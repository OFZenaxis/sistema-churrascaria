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
 * Gera o QR Code de conexão WhatsApp via Evolution API v2.
 *
 * Fluxo:
 *  1. Busca instância antiga no Prisma e dispara DELETE fire-and-forget (sem await)
 *  2. Gera nome único com timestamp → elimina session lock do Baileys no Docker
 *  3. POST /instance/create com o novo nome
 *  4. Polling (4x / 2.5s) → GET /instance/connect/${newInstanceName}
 *  5. QR encontrado → atualiza instanceName + persiste Prisma + retorna base64
 *  6. Esgotado → retorna erro de timeout
 */
export async function generateWhatsAppQRCode(storeId: string, slug: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false as const, error: 'Não autorizado' }

  const config = getEvolutionConfig()
  if (!config) {
    return { success: false as const, error: 'Evolution API não configurada no servidor.' }
  }

  const { apiUrl, apiKey } = config

  // Passo 1: Busca instância anterior e dispara DELETE fire-and-forget
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { whatsappInstance: true },
  })

  if (store?.whatsappInstance) {
    const oldInstance = store.whatsappInstance
    // Fire-and-forget — não bloqueia a criação da nova instância
    fetch(`${apiUrl}/instance/delete/${oldInstance}`, {
      method: 'DELETE',
      headers: { apikey: apiKey },
    }).then(res => {
      logger.info({ module: 'whatsapp', storeId, oldInstance, deleteStatus: res.status }, 'DELETE fire-and-forget concluído')
    }).catch(err => {
      logger.warn({ module: 'whatsapp', storeId, oldInstance, err }, 'DELETE fire-and-forget falhou — ignorando')
    })
  }

  // Passo 2: Nome único com timestamp — evita session lock do Baileys
  const newInstanceName = `${slug}-${Date.now()}`

  logger.info({ module: 'whatsapp', storeId, newInstanceName }, 'Criando nova instância WhatsApp')

  // Passo 3: POST /instance/create com o novo nome
  let createRes: Response
  try {
    createRes = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ instanceName: newInstanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      cache: 'no-store',
    })
  } catch (err) {
    logger.error({ module: 'whatsapp', storeId, newInstanceName, err }, 'Erro de rede no POST /instance/create')
    return { success: false as const, error: 'Erro de rede ao conectar com o servidor de WhatsApp.' }
  }

  const createData = await createRes.json() as {
    instance?: { instanceName?: string }
    message?: string
  }

  if (createRes.status !== 201) {
    logger.error(
      { module: 'whatsapp', storeId, newInstanceName, httpStatus: createRes.status, apiMessage: createData.message },
      'Erro fatal no POST /instance/create'
    )
    return { success: false as const, error: createData.message ?? 'Erro ao criar instância na Evolution API.' }
  }

  logger.info(
    { module: 'whatsapp', storeId, newInstanceName },
    'POST /instance/create → 201 — iniciando polling GET /instance/connect'
  )

  // Passo 4: Polling — Baileys gera o QR assincronamente após o POST
  const MAX_ATTEMPTS = 4
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2500))

    let pollData: Record<string, unknown>
    try {
      const pollRes = await fetch(`${apiUrl}/instance/connect/${newInstanceName}`, {
        headers: { apikey: apiKey },
        cache: 'no-store',
      })
      pollData = await pollRes.json() as Record<string, unknown>
    } catch (err) {
      logger.warn({ module: 'whatsapp', storeId, newInstanceName, attempt: i + 1, err }, 'Erro de rede no polling')
      continue
    }

    const qrCodeBase64 = (pollData.base64 as string | undefined) ?? null

    logger.info(
      { module: 'whatsapp', storeId, newInstanceName, attempt: i + 1, qrPresent: !!qrCodeBase64, pollBody: pollData },
      `Polling GET /instance/connect — tentativa ${i + 1}/${MAX_ATTEMPTS}`
    )

    if (qrCodeBase64) {
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappInstance: newInstanceName, whatsappConnected: false, whatsappQrCode: null },
      })
      logger.info(
        { module: 'whatsapp', storeId, newInstanceName, attempt: i + 1 },
        'QR Code obtido com sucesso'
      )
      return { success: true as const, qrCodeBase64 }
    }
  }

  logger.error(
    { module: 'whatsapp', storeId, newInstanceName },
    `Timeout na geração do QR Code após ${MAX_ATTEMPTS} tentativas`
  )
  return { success: false as const, error: 'Timeout na geração do QR Code. Tente novamente.' }
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
