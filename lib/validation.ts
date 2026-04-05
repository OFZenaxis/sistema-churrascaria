/**
 * lib/validation.ts
 * BUG-012 — Fonte única de verdade para validação de slugs de tenant.
 * Importado por: app/actions/tenant.ts, app/api/tenant/route.ts, app/api/tenant/check-slug/route.ts
 */

/** Apenas letras minúsculas, números e hifens. Mínimo 3, máximo 40 chars. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Slugs que conflitam com rotas da plataforma — nunca podem ser usados por lojistas. */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'cadastro', 'pricing',
  'about', 'contato', 'suporte', 'saiu', 'saiudelivery',
  'app', 'dashboard', 'billing', 'webhook', 'static',
])
