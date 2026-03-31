"use server"

import { cookies } from 'next/headers'

export async function loginAdmin(password: string) {
  const correctPassword = process.env.ADMIN_PASSWORD
  
  if (!correctPassword) return { success: false, error: 'Variável ADMIN_PASSWORD não configurada no servidor' }

  if (password === correctPassword) {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', 'true', {
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })
    return { success: true }
  } else {
    return { success: false, error: 'Senha incorreta' }
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
}
