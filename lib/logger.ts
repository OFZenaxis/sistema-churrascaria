/**
 * Logger estruturado via Pino — nível Enterprise.
 *
 * Em produção (BETTERSTACK_TOKEN definido):
 *   → Envia logs para o Better Stack (Logtail) via worker_thread assíncrono.
 *     O transport roda em thread separada e não bloqueia o event loop do Next.js.
 *
 * Em dev / sem token:
 *   → pino-pretty com cores no terminal local.
 *
 * Suporta duas assinaturas para retrocompatibilidade com os callers legados:
 *   Legada : logger.error('module', 'mensagem', err)
 *   Pino   : logger.error({ err, storeId, slug }, 'mensagem')
 */

import pino, { type Logger as PinoLogger } from 'pino'
import * as Sentry from '@sentry/nextjs'

export type LogCtx = Record<string, unknown>

function createPinoInstance(): PinoLogger {
  const token = process.env.BETTERSTACK_TOKEN
  const isProd = process.env.NODE_ENV === 'production'

  if (token && isProd) {
    // worker_thread assíncrono — garante zero bloqueio no event loop
    return pino({
      level: process.env.LOG_LEVEL ?? 'info',
      transport: {
        target: '@logtail/pino',
        options: { sourceToken: token },
      },
    })
  }

  // Local / staging — pino-pretty colorido
  return pino({
    level: process.env.LOG_LEVEL ?? 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '[{module}] {msg}',
      },
    },
  })
}

const pinoInstance = createPinoInstance()

// Normaliza ambas as assinaturas em um único objeto de contexto
function resolveCtx(ctxOrModule: LogCtx | string, legacyErr?: unknown): LogCtx {
  if (typeof ctxOrModule === 'string') {
    return {
      module: ctxOrModule,
      ...(legacyErr !== undefined ? { err: legacyErr } : {}),
    }
  }
  return ctxOrModule
}

export const logger = {
  info(ctxOrModule: LogCtx | string, message: string): void {
    pinoInstance.info(resolveCtx(ctxOrModule), message)
  },

  warn(ctxOrModule: LogCtx | string, message: string): void {
    pinoInstance.warn(resolveCtx(ctxOrModule), message)
  },

  error(ctxOrModule: LogCtx | string, message: string, legacyErr?: unknown): void {
    const ctx = resolveCtx(ctxOrModule, legacyErr)
    pinoInstance.error(ctx, message)

    // Encaminha exceções ao Sentry quando SENTRY_DSN estiver configurado
    const err = ctx.err ?? legacyErr
    if (process.env.SENTRY_DSN && err !== undefined) {
      Sentry.captureException(err instanceof Error ? err : new Error(message), {
        extra: ctx,
      })
    }
  },
}
