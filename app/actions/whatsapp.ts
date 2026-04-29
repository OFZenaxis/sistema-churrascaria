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

  const config = getEvolutionConfig()
  if (!config) return { success: false as const, error: 'Evolution API não configurada no servidor.' }

  const { apiUrl, apiKey } = config

  // 1. Limpeza assíncrona (Fire and forget)
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappInstance: true },
  })
  if (store?.whatsappInstance) {
    fetch(`${apiUrl}/instance/delete/${store.whatsappInstance}`, {
      method: 'DELETE',
      headers: { apikey: apiKey },
      cache: 'no-store',
    }).catch(() => {})
  }

  // 2. Nome absolutamente único — evita session lock do Baileys
  const newInstanceName = `${slug}-${Date.now()}`
  logger.info({ module: 'whatsapp', storeId, newInstanceName }, 'Criando nova instância')

  // 3. POST /instance/create
  const createRes = await fetch(`${apiUrl}/instance/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: apiKey },
    body: JSON.stringify({ instanceName: newInstanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
    cache: 'no-store',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createData = await createRes.json() as any
  logger.info(
    { module: 'whatsapp', storeId, newInstanceName, httpStatus: createRes.status, createData },
    'POST /instance/create concluído'
  )

  if (createRes.status !== 201) {
    logger.error({ module: 'whatsapp', storeId, newInstanceName, httpStatus: createRes.status }, 'Falha no POST /instance/create')
    return { success: false as const, error: createData?.message ?? 'Erro ao criar instância.' }
  }

  // QR síncrono — raro mas possível
  let qrCodeBase64: string | null = createData?.qrcode?.base64 || createData?.base64 || null

  // 4. Polling — 15s inicial (Baileys respira) + 5x / 8s = até 55s total
  if (!qrCodeBase64) {
    await new Promise(r => setTimeout(r, 15000))

    for (let i = 1; i <= 5; i++) {
      const pollRes = await fetch(`${apiUrl}/instance/connect/${newInstanceName}`, {
        method: 'GET',
        headers: { apikey: apiKey },
        cache: 'no-store',
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pollData = await pollRes.json() as any

      logger.info(
        { module: 'whatsapp', storeId, attempt: i, newInstanceName, pollBody: pollData },
        'Tentativa de resgate do QR Code'
      )

      qrCodeBase64 = pollData?.base64 || pollData?.qrcode?.base64 || null
      if (qrCodeBase64) break

      await new Promise(r => setTimeout(r, 8000))
    }
  }

  // 5. Resultado final
  if (!qrCodeBase64) {
    logger.error({ module: 'whatsapp', storeId, newInstanceName }, 'Timeout definitivo. QR Code não gerado.')
    return { success: false as const, error: 'Não foi possível gerar o QR Code no momento. Tente novamente.' }
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappInstance: newInstanceName, whatsappConnected: false, whatsappQrCode: null },
  })

  logger.info({ module: 'whatsapp', storeId, newInstanceName }, 'QR Code obtido com sucesso')
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
