import { createHmac, timingSafeEqual } from 'crypto'

// ── Boot Guard ────────────────────────────────────────────────────────────────
// Falha imediatamente ao carregar o módulo se o segredo não estiver configurado.
// Sem COOKIE_SECRET qualquer token HMAC pode ser forjado com chave vazia.
// Este guard impede que o servidor opere em estado de segurança comprometida.
if (!process.env.COOKIE_SECRET) {
  throw new Error(
    '[FATAL] COOKIE_SECRET não está definido no ambiente. ' +
    'O servidor se recusou a iniciar: não é possível assinar tokens de sessão sem esta variável.'
  )
}

function getSecret(): string {
  // COOKIE_SECRET garantido pelo boot guard acima — o cast é seguro
  return process.env.COOKIE_SECRET as string
}

/**
 * Assina um payload com HMAC-SHA256 e retorna `payload.assinatura`.
 * Usado para cookies de sessão e admin — garante que o cliente não pode forjar o valor.
 */
export function signPayload(payload: string): string {
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/**
 * Verifica a assinatura HMAC e retorna o payload original, ou null se inválido.
 * Usa timingSafeEqual para prevenir timing attacks.
 */
export function verifyPayload(token: string): string | null {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null

  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url')

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null

  try {
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return payload
}
