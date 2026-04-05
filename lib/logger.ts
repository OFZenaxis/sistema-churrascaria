/**
 * Logger estruturado — substitui console.log/error nas server actions.
 * BUG-003: log com timestamp + módulo prefixado.
 * BUG-018: erros críticos são capturados pelo Sentry quando SENTRY_DSN está configurado.
 */

import * as Sentry from '@sentry/nextjs'

type LogLevel = 'info' | 'warn' | 'error'

function fmt(level: LogLevel, module: string, message: string): string {
  const ts = new Date().toISOString()
  return `[${ts}] [${level.toUpperCase()}] [${module}] ${message}`
}

export const logger = {
  info(module: string, message: string): void {
    console.log(fmt('info', module, message))
  },

  warn(module: string, message: string): void {
    console.warn(fmt('warn', module, message))
  },

  error(module: string, message: string, err?: unknown): void {
    console.error(fmt('error', module, message))

    if (process.env.SENTRY_DSN && err !== undefined) {
      Sentry.captureException(err instanceof Error ? err : new Error(message), {
        tags: { module },
      })
    }
  },
}
