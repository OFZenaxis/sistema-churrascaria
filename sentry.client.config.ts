import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Captura 10% das transações de performance em produção
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Desabilita completamente se não houver DSN configurado
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
