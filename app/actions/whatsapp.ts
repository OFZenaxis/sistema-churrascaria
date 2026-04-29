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

export async function generateWhatsAppQRCode(storeId: string, slug: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false as const, error: 'Não autorizado' }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappInstance: true },
  })

  // 1. Limpeza assíncrona (Fire and forget)
  if (store?.whatsappInstance) {
    fetch(`${process.env.EVOLUTION_API_URL}/instance/delete/${store.whatsappInstance}`, {
      method: 'DELETE',
      headers: { 'apikey': process.env.EVOLUTION_API_KEY as string }
    }).catch(() => {})
  }

  // 2. Gerar nome absolutamente único
  const newInstanceName = `${slug}-${Date.now()}`

  // 3. Criar Instância (POST)
  const createRes = await fetch(`${process.env.EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY as string
    },
    body: JSON.stringify({
      instanceName: newInstanceName,
      token: newInstanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    })
  })

  const createData = await createRes.json()
  logger.info({ module: 'whatsapp', storeId, newInstanceName }, 'POST /instance/create concluído')

  // A V2 às vezes devolve o QR Code direto no create se o server for rápido
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let qrCodeBase64: string | null = (createData as any)?.qrcode?.base64 || (createData as any)?.base64 || null

  // 4. Polling de Resgate (Se o QR não veio na criação)
  if (!qrCodeBase64) {
    // Dá um respiro inicial de 3 segundos para o DB da API salvar a instância
    await new Promise(resolve => setTimeout(resolve, 3000))

    for (let i = 1; i <= 4; i++) {
      logger.info({ module: 'whatsapp', attempt: i, newInstanceName }, 'Tentativa de resgate do QR Code')

      // ATENÇÃO: Método GET e URL exata
      const pollRes = await fetch(`${process.env.EVOLUTION_API_URL}/instance/connect/${newInstanceName}`, {
        method: 'GET',
        headers: {
          'apikey': process.env.EVOLUTION_API_KEY as string
        }
      })

      const pollData = await pollRes.json()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qrCodeBase64 = (pollData as any)?.base64 || (pollData as any)?.qrcode?.base64 || (pollData as any)?.instance?.qrcode || null

      if (qrCodeBase64) {
        break // Achou a imagem, quebra o loop!
      }

      // Aguarda mais 2.5s antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 2500))
    }
  }

  // 5. Atualização Final
  if (!qrCodeBase64) {
    logger.error({ module: 'whatsapp', storeId, newInstanceName }, 'Timeout definitivo. QR Code não gerado.')
    return { success: false as const, error: 'Não foi possível gerar o QR Code no momento. Tente novamente.' }
  }

  // Atualiza o banco com o novo instanceName e retorna para o front
  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappInstance: newInstanceName, whatsappConnected: false, whatsappQrCode: null },
  })

  return { success: true as const, qrCodeBase64 }
}

/**
 * Lê o QR code temporário do banco — chamado pelo frontend durante o polling.
 */
export async function getWhatsAppQrCode(storeId: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { qrCodeBase64: null }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappQrCode: true },
  })

  return { qrCodeBase64: store?.whatsappQrCode ?? null }
}

/**
 * Consulta a Evolution API para verificar se a instância está conectada.
 * Persiste `whatsappConnected = true` e limpa o QR quando o estado for "open".
 */
export async function checkWhatsAppConnection(storeId: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { connected: false }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { slug: true, whatsappInstance: true, whatsappConnected: true },
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
        data: { whatsappConnected: true, whatsappQrCode: null },
      })
      revalidatePath(`/${store.slug}/admin/configuracoes/whatsapp`)
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
    data: { whatsappInstance: null, whatsappConnected: false, whatsappQrCode: null },
  })

  revalidatePath(`/${slug}/admin/configuracoes/whatsapp`)
  return { success: true as const }
}
