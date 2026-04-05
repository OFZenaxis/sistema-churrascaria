/**
 * Rate limiter em memória — BUG-016.
 * Usa um Map com contagem de hits por chave (IP) e expira entradas a cada 60s.
 * Adequado para deploy em VPS single-instance; substitua por Redis em multi-instância.
 */

type Entry = {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Limpa entradas expiradas a cada 60 segundos para evitar crescimento ilimitado da memória
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) store.delete(key)
  }
}, 60_000)

/**
 * Verifica se a chave (IP) ultrapassou o limite.
 * @param key       Identificador único (ex: IP do cliente)
 * @param limit     Máximo de requisições permitidas na janela
 * @param windowMs  Janela em milissegundos (padrão: 60 000 ms = 1 min)
 * @returns `{ ok: true }` se dentro do limite, `{ ok: false, retryAfterMs }` se excedido
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  existing.count++
  if (existing.count > limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now }
  }

  return { ok: true }
}
