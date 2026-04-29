import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Aceita apikey via query string (embutida pela action) ou header (fallback)
    const apiKeyFromQuery = req.nextUrl.searchParams.get('apikey')
    const apiKeyFromHeader = req.headers.get('apikey')
    const receivedKey = apiKeyFromQuery ?? apiKeyFromHeader
    if (!receivedKey || receivedKey !== process.env.EVOLUTION_API_KEY) {
      logger.warn({ module: 'webhook-evolution', requestId, hasQuery: !!apiKeyFromQuery, hasHeader: !!apiKeyFromHeader }, 'Rejeitado: apikey inválida ou ausente')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = await req.json() as {
      event?: string
      instance?: string
      data?: Record<string, unknown>
    }

    const { event, instance: instanceName, data } = payload

    if (!event || !instanceName) {
      logger.warn({ module: 'webhook-evolution', requestId, payload }, 'Payload malformado: event ou instance ausentes')
      return NextResponse.json({ error: 'Payload malformado' }, { status: 400 })
    }

    logger.info(
      { module: 'webhook-evolution', requestId, event, instanceName },
      'Webhook Evolution recebido'
    )

    if (event === 'QRCODE_UPDATED') {
      const qrBase64 =
        (data as { qrcode?: { base64?: string } } | undefined)?.qrcode?.base64 ??
        (data as { base64?: string } | undefined)?.base64 ??
        null

      if (!qrBase64) {
        logger.warn({ module: 'webhook-evolution', requestId, instanceName, data }, 'QRCODE_UPDATED sem base64')
        return NextResponse.json({ success: true })
      }

      const updated = await prisma.store.updateMany({
        where: { whatsappInstance: instanceName },
        data: { whatsappQrCode: qrBase64 },
      })

      logger.info(
        { module: 'webhook-evolution', requestId, instanceName, updatedCount: updated.count },
        'QR code salvo no banco'
      )
    } else if (event === 'CONNECTION_UPDATE') {
      const state = (data as { state?: string } | undefined)?.state

      if (state === 'open') {
        await prisma.store.updateMany({
          where: { whatsappInstance: instanceName },
          data: { whatsappConnected: true, whatsappQrCode: null },
        })
        logger.info({ module: 'webhook-evolution', requestId, instanceName }, 'Instância conectada via webhook')
      } else if (state === 'close' || state === 'closed') {
        await prisma.store.updateMany({
          where: { whatsappInstance: instanceName },
          data: { whatsappConnected: false },
        })
        logger.info({ module: 'webhook-evolution', requestId, instanceName, state }, 'Instância desconectada via webhook')
      }
    } else {
      logger.info({ module: 'webhook-evolution', requestId, event, instanceName }, 'Evento ignorado')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ module: 'webhook-evolution', requestId, err: error }, 'Erro no processamento do webhook')
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
