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
 *  1. POST /instance/create
 *  2. 403 ou "already exists" → instância já existe, vai direto ao fallback
 *  3. POST bem-sucedido com QR na resposta → retorna imediatamente (caminho feliz)
 *  4. Fallback (403 capturado OU QR vazio): aguarda 2s e faz GET /instance/connect
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

  // Indica se o caminho normal falhou e o fallback será necessário
  let needsFallback = false

  // Passo 1: Tenta criar a instância
  try {
    const res = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      cache: 'no-store',
    })

    const data = await res.json() as {
      instance?: { instanceName?: string }
      qrcode?: { base64?: string }
      base64?: string
      message?: string
      error?: string
    }

    // Passo 2: 403 ou mensagem de "já existe" → instância existente, não é erro fatal
    const alreadyExists =
      res.status === 403 ||
      data.message?.toLowerCase().includes('already') ||
      data.error?.toLowerCase().includes('already')

    if (alreadyExists) {
      logger.warn(
        { module: 'whatsapp', storeId, instanceName, httpStatus: res.status, apiMessage: data.message },
        'Instância já existe na Evolution API — redirecionando para fallback'
      )
      needsFallback = true
    } else if (!res.ok) {
      // Erro real (não 403) — falha definitiva
      logger.error(
        { module: 'whatsapp', storeId, instanceName, httpStatus: res.status, apiMessage: data.message },
        'Erro fatal ao criar instância na Evolution API'
      )
      return { success: false as const, error: data.message ?? 'Erro ao criar instância na Evolution API.' }
    } else {
      // Passo 3: POST bem-sucedido — persiste e tenta retornar QR imediatamente
      const confirmedName = data.instance?.instanceName ?? instanceName
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappInstance: confirmedName, whatsappConnected: false },
      })

      const qrCodeBase64 = data.qrcode?.base64 ?? data.base64 ?? null
      logger.info(
        { module: 'whatsapp', storeId, confirmedName, qrPresent: !!qrCodeBase64, usedFallback: false },
        'POST /instance/create concluído'
      )

      if (qrCodeBase64) {
        return { success: true as const, qrCodeBase64 }
      }

      // QR veio vazio no create (race condition Baileys) → usa fallback
      logger.warn(
        { module: 'whatsapp', storeId, confirmedName },
        'QR vazio no create — redirecionando para fallback'
      )
      needsFallback = true
    }
  } catch (err) {
    logger.error({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no POST /instance/create')
    return { success: false as const, error: 'Erro de rede ao conectar com o servidor de WhatsApp.' }
  }

  // Passo 4: Fallback — aguarda 2s para o Baileys gerar o QR e busca via GET
  if (needsFallback) {
    logger.info(
      { module: 'whatsapp', storeId, instanceName },
      'Iniciando fallback: aguardando 2s antes do GET /instance/connect'
    )
    await new Promise(r => setTimeout(r, 2000))

    try {
      const connectRes = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: apiKey },
        cache: 'no-store',
      })
      const connectData = await connectRes.json() as { base64?: string; code?: string }
      const qrCodeBase64 = connectData.base64 ?? null

      logger.info(
        { module: 'whatsapp', storeId, instanceName, qrPresent: !!qrCodeBase64, usedFallback: true },
        'GET /instance/connect concluído'
      )

      if (!qrCodeBase64) {
        logger.error(
          { module: 'whatsapp', storeId, instanceName },
          'QR code ausente mesmo após fallback GET /instance/connect'
        )
        return { success: false as const, error: 'QR Code não disponível. Aguarde alguns segundos e tente novamente.' }
      }

      // Garante que o instanceName está salvo no banco (necessário para o caminho 403)
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappInstance: instanceName, whatsappConnected: false },
      })

      return { success: true as const, qrCodeBase64 }
    } catch (err) {
      logger.error({ module: 'whatsapp', storeId, instanceName, err }, 'Erro de rede no GET /instance/connect')
      return { success: false as const, error: 'Erro de rede ao buscar QR Code. Tente novamente.' }
    }
  }

  // Nunca deve chegar aqui — needsFallback garante cobertura total
  return { success: false as const, error: 'Estado inesperado. Tente novamente.' }
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
