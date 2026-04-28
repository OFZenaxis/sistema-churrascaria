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
 * Fluxo com verificação manual de status HTTP (fetch não lança erro em 403):
 *  201 + QR presente  → retorna imediatamente
 *  201 + QR vazio     → aguarda 2s → GET /instance/connect (passo 3)
 *  403                → instância já existe, aguarda 1s → GET /instance/connect (passo 3)
 *  outros erros       → falha definitiva
 *  Prisma só é atualizado se base64 válido for obtido no final
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

  // Passo 1: POST /instance/create
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

  // Passo 2: Verificação manual do status HTTP
  const createData = await createRes.json() as {
    instance?: { instanceName?: string }
    qrcode?: { base64?: string }
    base64?: string
    message?: string
  }

  if (createRes.status === 201) {
    const qrCodeBase64 = createData.qrcode?.base64 ?? createData.base64 ?? null
    logger.info(
      { module: 'whatsapp', storeId, instanceName, qrPresent: !!qrCodeBase64 },
      'POST /instance/create → 201'
    )

    if (qrCodeBase64) {
      // Caminho feliz: QR disponível imediatamente
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappInstance: createData.instance?.instanceName ?? instanceName, whatsappConnected: false },
      })
      return { success: true as const, qrCodeBase64 }
    }

    // QR vazio no create (race condition Baileys) → aguarda 2s e vai ao resgate
    logger.warn(
      { module: 'whatsapp', storeId, instanceName },
      'QR vazio no 201 — aguardando 2s antes do resgate'
    )
    await new Promise(r => setTimeout(r, 2000))

  } else if (createRes.status === 403) {
    // Instância já existe e pode estar conectada ao WhatsApp (GET /connect retorna { count: 0 }).
    // Uma instância conectada não gera QR — é preciso fazer logout primeiro para desparear.
    // DELETE /instance/logout mantém a instância no Evolution API mas remove a sessão do WhatsApp,
    // fazendo o Baileys entrar em modo "connecting" e gerar um novo QR.
    logger.warn(
      { module: 'whatsapp', storeId, instanceName, apiMessage: createData.message },
      'POST /instance/create → 403 — chamando logout para forçar novo QR'
    )

    try {
      const logoutRes = await fetch(`${apiUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { apikey: apiKey },
        cache: 'no-store',
      })
      logger.info(
        { module: 'whatsapp', storeId, instanceName, logoutStatus: logoutRes.status },
        'DELETE /instance/logout concluído'
      )
    } catch (err) {
      // Best-effort: se o logout falhar, tenta o connect mesmo assim
      logger.warn({ module: 'whatsapp', storeId, instanceName, err }, 'Erro no DELETE /instance/logout — prosseguindo')
    }

    // Aguarda o Baileys processar o logout e preparar o novo QR
    await new Promise(r => setTimeout(r, 2000))

  } else {
    // Qualquer outro status é erro definitivo
    logger.error(
      { module: 'whatsapp', storeId, instanceName, httpStatus: createRes.status, apiMessage: createData.message },
      'Erro fatal no POST /instance/create'
    )
    return { success: false as const, error: createData.message ?? 'Erro ao criar instância na Evolution API.' }
  }

  // Passo 3: Resgate — GET /instance/connect retorna o QR atual da instância
  let connectRes: Response
  try {
    connectRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      headers: { apikey: apiKey },
      cache: 'no-store',
    })
  } catch (err) {
    logger.error({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no GET /instance/connect')
    return { success: false as const, error: 'Erro de rede ao buscar QR Code. Tente novamente.' }
  }

  // Loga o corpo bruto para diagnóstico — campos variam entre versões da Evolution API
  const connectData = await connectRes.json() as Record<string, unknown>
  logger.info(
    { module: 'whatsapp', storeId, instanceName, connectStatus: connectRes.status, connectBody: connectData },
    'GET /instance/connect — resposta bruta'
  )

  // Evolution API v2 pode retornar base64 em estruturas diferentes conforme versão e estado da instância:
  //   { base64: "data:image/png;base64,..." }           — resposta direta
  //   { qrcode: { base64: "..." } }                    — aninhado em qrcode
  //   { qrcode: { base64Image: "..." } }               — variante antiga
  const qrCodeBase64 =
    (connectData.base64 as string | undefined) ??
    ((connectData.qrcode as { base64?: string; base64Image?: string } | undefined)?.base64) ??
    ((connectData.qrcode as { base64?: string; base64Image?: string } | undefined)?.base64Image) ??
    null

  logger.info(
    { module: 'whatsapp', storeId, instanceName, qrPresent: !!qrCodeBase64, usedFallback: true },
    'GET /instance/connect concluído'
  )

  if (!qrCodeBase64) {
    logger.error(
      { module: 'whatsapp', storeId, instanceName },
      'QR code ausente mesmo após resgate GET /instance/connect'
    )
    return { success: false as const, error: 'QR Code não disponível. Aguarde alguns segundos e tente novamente.' }
  }

  // Prisma atualizado apenas após confirmar base64 válido
  await prisma.store.update({
    where: { id: storeId },
    data: { whatsappInstance: instanceName, whatsappConnected: false },
  })

  return { success: true as const, qrCodeBase64 }
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
