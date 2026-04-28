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
 * Diagnóstico de produção revelou que GET /instance/connect retorna { "count": 0 }
 * (contador de clientes WebSocket), nunca o QR code. O QR só existe no corpo 201
 * do POST /instance/create — a Evolution API aguarda o Baileys gerar o QR de forma
 * síncrona antes de responder. Logo, o único fluxo confiável é DELETE + esperar 5s
 * + POST create.
 *
 * Fluxo:
 *  1. DELETE /instance/delete  → remove instância existente (best-effort)
 *  2. sleep(5000)              → garante limpeza completa do Baileys
 *  3. POST /instance/create    → instância nova, QR inline no 201
 *  4. 201 + QR presente        → salva Prisma + retorna ✓
 *  5. 201 + QR vazio (raro)    → sleep(3000) + loga diagnóstico + retorna erro
 *  6. outros status            → erro definitivo
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

  // Passo 1: DELETE incondicional — remove instância anterior (404 = não existia, tudo bem)
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
    // Erro de rede no DELETE é best-effort — prossegue mesmo assim
    logger.warn({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no DELETE /instance/delete — prosseguindo')
  }

  // Passo 2: Aguarda o Evolution API finalizar a limpeza completa do Baileys
  await new Promise(r => setTimeout(r, 5000))

  // Passo 3: POST /instance/create — QR vem inline no 201
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

  // Passo 4: Extrai QR do corpo 201
  const qrCodeBase64 = createData.qrcode?.base64 ?? createData.base64 ?? null
  logger.info(
    { module: 'whatsapp', storeId, instanceName, qrPresent: !!qrCodeBase64 },
    'POST /instance/create → 201'
  )

  if (qrCodeBase64) {
    // Caminho feliz: QR disponível na resposta do create
    await prisma.store.update({
      where: { id: storeId },
      data: { whatsappInstance: createData.instance?.instanceName ?? instanceName, whatsappConnected: false },
    })
    return { success: true as const, qrCodeBase64 }
  }

  // Passo 5: QR ausente no 201 — Baileys ainda inicializando (race condition)
  // O estado "connecting" aparece ~3s após o POST. O QR é gerado assincronamente
  // e fica disponível em GET /instance/connect assim que o Baileys estiver pronto.
  // Fazemos polling com até 6 tentativas (18s no total) para capturar o QR.
  logger.warn(
    { module: 'whatsapp', storeId, instanceName },
    'QR vazio no 201 — iniciando polling em GET /instance/connect (até 6 tentativas, 3s cada)'
  )

  const MAX_ATTEMPTS = 6
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, 3000))

    try {
      const pollRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: apiKey },
        cache: 'no-store',
      })
      const pollData = await pollRes.json() as Record<string, unknown>

      const polledQr =
        (pollData.base64 as string | undefined) ??
        ((pollData.qrcode as { base64?: string } | undefined)?.base64) ??
        null

      logger.info(
        { module: 'whatsapp', storeId, instanceName, attempt, qrPresent: !!polledQr, pollBody: pollData },
        `Polling GET /instance/connect — tentativa ${attempt}/${MAX_ATTEMPTS}`
      )

      if (polledQr) {
        await prisma.store.update({
          where: { id: storeId },
          data: { whatsappInstance: instanceName, whatsappConnected: false },
        })
        return { success: true as const, qrCodeBase64: polledQr }
      }
    } catch (err) {
      logger.warn({ module: 'whatsapp', storeId, instanceName, attempt, err }, 'Erro de rede no polling — tentando novamente')
    }
  }

  logger.error(
    { module: 'whatsapp', storeId, instanceName },
    `QR code ausente após ${MAX_ATTEMPTS} tentativas de polling`
  )
  return { success: false as const, error: 'QR Code não foi gerado a tempo. Tente novamente.' }
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
