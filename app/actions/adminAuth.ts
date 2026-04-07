"use server"

import { cookies, headers } from 'next/headers'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signPayload, verifyPayload } from '@/lib/session'
import { rateLimit } from '@/lib/ratelimit'

// ─── Lojista Auth (per-tenant) ────────────────────────────────────────────────

/**
 * Autentica um lojista pelo e-mail + senha, vinculando a sessão ao tenant (storeId).
 * Define o cookie `lojista_token` assinado com HMAC-SHA256.
 */
export async function loginLojista(email: string, password: string, slug: string) {
  if (!email?.trim() || !password || !slug?.trim()) {
    return { success: false, error: 'Campos obrigatórios ausentes.' }
  }

  // Rate limiting — 5 tentativas por IP a cada 15 minutos
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.ok) {
    const minutes = Math.ceil((rl.retryAfterMs ?? 0) / 60_000)
    return { success: false, error: `Muitas tentativas. Aguarde ${minutes} minuto(s) antes de tentar novamente.` }
  }

  // 1. Resolve o tenant pelo slug
  const isDomain = slug.includes('.')
  const store = await prisma.store.findFirst({
    where: isDomain ? { customDomain: slug } : { slug },
    select: { id: true }
  })
  if (!store) return { success: false, error: 'Loja não encontrada.' }

  // 2. Busca o usuário ADMIN vinculado a este tenant
  const user = await prisma.user.findFirst({
    where: { email: email.trim().toLowerCase(), storeId: store.id },
    select: { id: true, password: true, role: true }
  })
  if (!user || !user.password) return { success: false, error: 'E-mail ou senha incorretos.' }

  // 3. Valida a senha com bcrypt — timing-safe por design
  const valid = await compare(password, user.password)
  if (!valid) return { success: false, error: 'E-mail ou senha incorretos.' }

  // 4. Assina o cookie vinculando userId + storeId + role
  // Formato: userId|storeId|role  — verificável sem DB no servidor
  const cookieStore = await cookies()
  cookieStore.set(`lojista_token_${store.id}`, signPayload(`${user.id}|${store.id}|${user.role}`), {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })

  return { success: true }
}

/**
 * Lê o cookie `lojista_token`, verifica a assinatura HMAC e retorna a sessão.
 * Retorna null se o cookie estiver ausente, expirado ou forjado.
 */
export async function getLojistaSession(storeId?: string): Promise<{ userId: string; storeId: string; role: string } | null> {
  const cookieStore = await cookies()

  // Leitura direta quando o storeId é conhecido (pages de admin com slug resolvido)
  if (storeId) {
    const token = cookieStore.get(`lojista_token_${storeId}`)?.value
    if (!token) return null
    const payload = verifyPayload(token)
    if (!payload) return null
    const parts = payload.split('|')
    if (parts.length !== 3) return null
    const [userId, sid, role] = parts
    if (!userId || !sid || !role || sid !== storeId) return null
    return { userId, storeId: sid, role }
  }

  // Fallback: itera todos os cookies e encontra o primeiro lojista_token_* válido
  // Usado pelas Server Actions do KDS/Admin que não recebem storeId do client.
  // 🔒 W-10: Valida que sid no payload bate com o sufixo do cookie — evita autenticar tenant errado.
  const all = cookieStore.getAll()
  for (const cookie of all) {
    if (!cookie.name.startsWith('lojista_token_')) continue
    const expectedStoreId = cookie.name.replace('lojista_token_', '')
    const payload = verifyPayload(cookie.value)
    if (!payload) continue
    const parts = payload.split('|')
    if (parts.length !== 3) continue
    const [userId, sid, role] = parts
    if (!userId || !sid || !role) continue
    // 🔒 Cookie name e storeId no payload devem coincidir — impede cross-tenant via cookie injetado
    if (sid !== expectedStoreId) continue
    return { userId, storeId: sid, role }
  }

  return null
}

/**
 * Helper unificado de autorização para Server Actions do admin.
 * Lê a sessão isolada do tenant e valida que pertence ao storeId esperado.
 * Retorna null (não autorizado) ou o objeto de sessão.
 * Elimina o padrão repetido de getLojistaSession + guard em cada action (O-03).
 */
export async function requireAdminSession(storeId: string): Promise<{ userId: string; storeId: string; role: string } | null> {
  const session = await getLojistaSession(storeId)
  if (!session || session.storeId !== storeId) return null
  return session
}

export async function logoutLojista(storeId?: string) {
  const cookieStore = await cookies()
  if (storeId) {
    cookieStore.delete(`lojista_token_${storeId}`)
    return
  }
  // Fallback: remove todos os cookies de sessão lojista encontrados
  cookieStore.getAll()
    .filter(c => c.name.startsWith('lojista_token_'))
    .forEach(c => cookieStore.delete(c.name))
}

// ─── Legacy admin session — lê lojista_token para compatibilidade ─────────────

/**
 * Retorna o storeId da sessão ativa (lojista_token).
 * Mantido para compatibilidade com páginas admin existentes.
 */
export async function getAdminSession(storeId?: string): Promise<string | null> {
  const session = await getLojistaSession(storeId)
  return session?.storeId ?? null
}

export async function logoutAdmin() {
  await logoutLojista()
}
