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
 * Se a loja já possuía uma instância anterior, ela é removida antes da criação.
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

  // Se já existia uma instância, remove antes de recriar para garantir QR fresco
  const existing = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappInstance: true },
  })

  if (existing?.whatsappInstance) {
    try {
      await fetch(`${apiUrl}/instance/delete/${existing.whatsappInstance}`, {
        method: 'DELETE',
        headers: { apikey: apiKey },
      })
    } catch {
      // Remoção best-effort — falha ignorada, instância pode não existir mais na API
    }
  }

  try {
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

    const base64 = data.qrcode?.base64
    if (!base64) {
      logger.error('whatsapp', `Instância "${confirmedName}" criada mas QR code ausente na resposta`)
      return { success: false as const, error: 'Instância criada, mas QR Code não foi retornado. Tente novamente.' }
    }

    // A Evolution API já retorna o prefixo "data:image/png;base64," — repassamos direto
    return { success: true as const, base64 }
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
