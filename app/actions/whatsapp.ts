'use server'

import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/app/actions/adminAuth'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

function getEvolutionConfig(): { apiUrl: string; apiKey: string } | null {
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  if (!apiUrl || !apiKey) return null
  return { apiUrl, apiKey }
}

/**
 * Cria (ou recria) a instância WhatsApp na Evolution API e retorna o QR code em base64.
 * Aplica fluxo de resgate com retry para compensar a race condition do Baileys:
 * o POST /instance/create pode responder antes do QR estar disponível.
 */
export async function generateWhatsAppQRCode(storeId: string, slug: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false as const, error: 'Não autorizado' }

  const config = getEvolutionConfig()
  if (!config) {
    return { success: false as const, error: 'Evolution API não configurada no servidor.' }
  }

  const { apiUrl, apiKey } = config
  const instanceName = `loja-${slug}`

  // Passo 1: Força delete da instância anterior (best-effort, ignora erro)
  try {
    await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: apiKey },
    })
    logger.info({ module: 'whatsapp', storeId, instanceName }, 'DELETE instância enviado')
  } catch {
    // Instância pode não existir — prossegue
  }

  // Passo 2: Aguarda Baileys liberar o slot
  await new Promise(r => setTimeout(r, 1000))

  try {
    // Passo 3: Cria nova instância
    const res = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
      cache: 'no-store',
    })

    const data = await res.json() as {
      instance?: { instanceName?: string }
      qrcode?: { base64?: string }
      base64?: string
      message?: string
    }

    if (!res.ok) {
      logger.error('whatsapp', `Erro ao criar instância "${instanceName}": ${data.message ?? res.status}`)
      return { success: false as const, error: data.message ?? 'Erro ao criar instância na Evolution API.' }
    }

    // Usa o nome confirmado pela API (pode diferir do enviado em casos de sanitização)
    const confirmedName = data.instance?.instanceName ?? instanceName

    await prisma.store.update({
      where: { id: storeId },
      data: { whatsappInstance: confirmedName, whatsappConnected: false },
    })

    // Tenta extrair QR da resposta do create (nem sempre presente — race condition do Baileys)
    let qrCodeBase64 = data.qrcode?.base64 ?? data.base64 ?? null
    logger.info(
      { module: 'whatsapp', storeId, confirmedName, qrPresent: !!qrCodeBase64 },
      'POST /instance/create concluído'
    )

    // Passo 4-6: Fallback — aguarda e busca QR via GET /instance/connect/{name}
    if (!qrCodeBase64) {
      logger.warn(
        { module: 'whatsapp', storeId, confirmedName },
        'QR ausente no create — aguardando 2.5s e tentando GET /instance/connect'
      )
      await new Promise(r => setTimeout(r, 2500))

      try {
        const connectRes = await fetch(`${apiUrl}/instance/connect/${confirmedName}`, {
          headers: { apikey: apiKey },
          cache: 'no-store',
        })
        const connectData = await connectRes.json() as { base64?: string; code?: string }
        qrCodeBase64 = connectData.base64 ?? null
        logger.info(
          { module: 'whatsapp', storeId, confirmedName, qrPresent: !!qrCodeBase64 },
          'GET /instance/connect concluído'
        )
      } catch (err) {
        logger.error({ module: 'whatsapp', storeId, confirmedName, err }, 'Erro no GET /instance/connect')
      }
    }

    if (!qrCodeBase64) {
      logger.error('whatsapp', `Instância "${confirmedName}" criada mas QR code ausente após retry`)
      return { success: false as const, error: 'Instância criada, mas QR Code não foi retornado. Tente novamente.' }
    }

    return { success: true as const, qrCodeBase64 }
  } catch (err) {
    logger.error('whatsapp', 'generateWhatsAppQRCode: erro de rede com a Evolution API', err)
    return { success: false as const, error: 'Erro de rede ao conectar com o servidor de WhatsApp.' }
  }
}

/**
 * Consulta a Evolution API para verificar se a instância está conectada.
 * Persiste `whatsappConnected = true` no banco quando o estado for "open".
 */
export async function checkWhatsAppConnection(storeId: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { connected: false }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappInstance: true, whatsappConnected: true },
  })

  if (!store?.whatsappInstance) return { connected: false }
  if (store.whatsappConnected) return { connected: true }

  const config = getEvolutionConfig()
  if (!config) return { connected: false }

  try {
    const res = await fetch(
      `${config.apiUrl}/instance/connectionState/${store.whatsappInstance}`,
      { headers: { apikey: config.apiKey }, cache: 'no-store' }
    )

    if (!res.ok) return { connected: false }

    const data = await res.json() as { instance?: { state?: string } }
    const isOpen = data?.instance?.state === 'open'

    if (isOpen) {
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappConnected: true },
      })
      revalidatePath(`/${store.whatsappInstance.replace('loja-', '')}/admin/configuracoes/whatsapp`)
    }

    return { connected: isOpen }
  } catch {
    return { connected: false }
  }
}

/**
 * Remove a instância da Evolution API e limpa os dados de WhatsApp da loja.
 */
export async function disconnectWhatsApp(storeId: string, slug: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false as const, error: 'Não autorizado' }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappInstance: true },
  })

  if (!store?.whatsappInstance) {
    return { success: false as const, error: 'Nenhuma instância registrada.' }
  }

  const config = getEvolutionConfig()
  if (config) {
    try {
      await fetch(`${config.apiUrl}/instance/delete/${store.whatsappInstance}`, {
        method: 'DELETE',
        headers: { apikey: config.apiKey },
      })
    } catch {
      // Best-effort — prossegue mesmo se a API retornar erro
    }
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappInstance: null, whatsappConnected: false },
  })

  revalidatePath(`/${slug}/admin/configuracoes/whatsapp`)
  return { success: true as const }
}
