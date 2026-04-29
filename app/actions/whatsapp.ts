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
 *  1. DELETE /instance/delete  → remove instância existente (best-effort)
 *  2. sleep(5000)              → garante limpeza completa do Baileys
 *  3. POST /instance/create    → cria instância nova
 *  4. Polling (4x / 2.5s)     → GET /instance/connect aguarda o Baileys gerar o QR
 *  5. QR encontrado            → salva Prisma + retorna base64
 *  6. Esgotado                 → retorna erro de timeout
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

  // Passo 1: DELETE incondicional — remove instância anterior
  try {
    const deleteRes = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: apiKey },
      cache: 'no-store',
    })
    logger.info(
      { module: 'whatsapp', storeId, instanceName, deleteStatus: deleteRes.status },
      'DELETE /instance/delete concluído'
    )
  } catch (err) {
    logger.warn({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no DELETE — prosseguindo')
  }

  // Passo 2: Aguarda limpeza completa do Baileys
  await new Promise(r => setTimeout(r, 5000))

  // Passo 3: POST /instance/create
  let createRes: Response
  try {
    createRes = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      cache: 'no-store',
    })
  } catch (err) {
    logger.error({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no POST /instance/create')
    return { success: false as const, error: 'Erro de rede ao conectar com o servidor de WhatsApp.' }
  }

  const createData = await createRes.json() as {
    instance?: { instanceName?: string }
    message?: string
  }

  if (createRes.status !== 201) {
    logger.error(
      { module: 'whatsapp', storeId, instanceName, httpStatus: createRes.status, apiMessage: createData.message },
      'Erro fatal no POST /instance/create'
    )
    return { success: false as const, error: createData.message ?? 'Erro ao criar instância na Evolution API.' }
  }

  const finalInstanceName = createData.instance?.instanceName ?? instanceName

  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappInstance: finalInstanceName, whatsappConnected: false, whatsappQrCode: null },
  })

  logger.info(
    { module: 'whatsapp', storeId, instanceName: finalInstanceName },
    'POST /instance/create → 201 — iniciando polling GET /instance/connect'
  )

  // Passo 4: Polling — Baileys gera o QR assincronamente após o POST
  const MAX_ATTEMPTS = 4
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2500))

    let pollData: Record<string, unknown>
    try {
      const pollRes = await fetch(`${apiUrl}/instance/connect/${finalInstanceName}`, {
        headers: { apikey: apiKey },
        cache: 'no-store',
      })
      pollData = await pollRes.json() as Record<string, unknown>
    } catch (err) {
      logger.warn({ module: 'whatsapp', storeId, instanceName: finalInstanceName, attempt: i + 1, err }, 'Erro de rede no polling')
      continue
    }

    const qrCodeBase64 = (pollData.base64 as string | undefined) ?? null

    logger.info(
      { module: 'whatsapp', storeId, instanceName: finalInstanceName, attempt: i + 1, qrPresent: !!qrCodeBase64, pollBody: pollData },
      `Polling GET /instance/connect — tentativa ${i + 1}/${MAX_ATTEMPTS}`
    )

    if (qrCodeBase64) {
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappInstance: finalInstanceName, whatsappConnected: false },
      })
      logger.info(
        { module: 'whatsapp', storeId, instanceName: finalInstanceName, attempt: i + 1 },
        'QR Code obtido com sucesso'
      )
      return { success: true as const, qrCodeBase64 }
    }
  }

  logger.error(
    { module: 'whatsapp', storeId, instanceName: finalInstanceName },
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
        data: { whatsappConnected: true, whatsappQrCode: null },
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
    data: { whatsappInstance: null, whatsappConnected: false, whatsappQrCode: null },
  })

  revalidatePath(`/${slug}/admin/configuracoes/whatsapp`)
  return { success: true as const }
}
