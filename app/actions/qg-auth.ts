'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signPayload, verifyPayload } from '@/lib/session'

const COOKIE_NAME = 'qg_admin_token'
const SIGNED_PAYLOAD = 'qg_admin_authenticated'

export async function loginQGAdmin(pin: string): Promise<{ error: string } | never> {
  const superAdminPin = process.env.SUPER_ADMIN_PIN
  if (!superAdminPin || pin !== superAdminPin) {
    return { error: 'PIN incorreto.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signPayload(SIGNED_PAYLOAD), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24h
    path: '/qg-admin',
  })

  redirect('/qg-admin')
}

export async function logoutQGAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect('/qg-admin/login')
}

export async function verifyQGSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return false
  const payload = verifyPayload(raw)
  return payload === SIGNED_PAYLOAD
}
