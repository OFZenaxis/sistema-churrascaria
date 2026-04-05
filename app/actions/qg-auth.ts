'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'qg_access_token'
const JWT_SUBJECT = 'qg_admin'
const MAX_AGE_SECONDS = 60 * 60 * 24 // 24h

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('[FATAL] JWT_SECRET não definido — autenticação QG recusada.')
  return new TextEncoder().encode(secret)
}

async function issueToken(): Promise<string> {
  return new SignJWT({ role: 'super_admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(JWT_SUBJECT)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())
}

export async function loginQGAdmin(pin: string): Promise<{ error: string } | never> {
  const superAdminPin = process.env.SUPER_ADMIN_PIN
  if (!superAdminPin || pin !== superAdminPin) {
    return { error: 'PIN incorreto.' }
  }

  const token = await issueToken()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE_SECONDS,
    path: '/qg-admin',
  })

  redirect('/qg-admin')
}

export async function logoutQGAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect('/qg-admin/login')
}

/**
 * Verifica o JWT do cookie.
 * Retorna true apenas se a assinatura for válida, o subject correto e o token não estiver expirado.
 * Qualquer falha (token adulterado, expirado, ausente) retorna false — sem exceção vazando.
 */
export async function verifyQGSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      subject: JWT_SUBJECT,
    })
    // Dupla verificação explícita do subject — jwtVerify já valida, mas defense-in-depth
    return payload.sub === JWT_SUBJECT
  } catch {
    // Token inválido, adulterado ou expirado — trata tudo como não-autenticado
    return false
  }
}
