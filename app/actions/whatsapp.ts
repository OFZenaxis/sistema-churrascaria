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
 * Inicia a conexão WhatsApp via Evolution API v2.
 *
 * Fluxo:
 *  1. DELETE /instance/delete  → remove instância existente (best-effort)
 *  2. sleep(5000)              → garante limpeza completa do Baileys
 *  3. Limpa whatsappQrCode anterior no banco
 *  4. POST /instance/create    → cria instância com webhook configurado
 *  5. Evolution API envia QRCODE_UPDATED ao nosso webhook → QR salvo no banco
 *  6. Frontend faz polling em getWhatsAppQrCode() até o QR aparecer
 *
 * O QR nunca está disponível de forma síncrona no 201 — Baileys o gera
 * assincronamente e o entrega via evento QRCODE_UPDATED.
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
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`

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

  // Passo 3: Limpa QR code anterior para evitar exibir QR stale
  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappQrCode: null },
  })

  // Passo 4: POST /instance/create com webhook configurado
  let createRes: Response
  try {
    createRes = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: webhookUrl,
          byEvents: true,
          base64: true,
          events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE'],
        },
      }),
      cache: 'no-store',
    })
  } catch (err) {
    logger.error({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no POST /instance/create')
    return { success: false as const, error: 'Erro de rede ao conectar com o servidor de WhatsApp.' }
  }

  const createData = await createRes.json() as {
    instance?: { instanceName?: string }
    qrcode?: { base64?: string }
    base64?: string
    message?: string
  }

  if (createRes.status !== 201) {
    logger.error(
      { module: 'whatsapp', storeId, instanceName, httpStatus: createRes.status, apiMessage: createData.message },
      'Erro fatal no POST /instance/create'
    )
    return { success: false as const, error: createData.message ?? 'Erro ao criar instância na Evolution API.' }
  }

  // Salva nome da instância; QR chegará via webhook QRCODE_UPDATED
  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappInstance: createData.instance?.instanceName ?? instanceName, whatsappConnected: false },
  })

  // Verifica se o QR veio sincronamente (improvável mas possível em algumas versões)
  const syncQr = createData.qrcode?.base64 ?? createData.base64 ?? null

  logger.info(
    { module: 'whatsapp', storeId, instanceName, webhookUrl, syncQrPresent: !!syncQr },
    'POST /instance/create → 201 — aguardando QRCODE_UPDATED via webhook'
  )

  if (syncQr) {
    await prisma.store.update({
      where: { id: storeId },
      data: { whatsappQrCode: syncQr },
    })
  }

  // Retorna qrCodeBase64 null quando aguardando webhook (pending)
  return { success: true as const, qrCodeBase64: syncQr }
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
