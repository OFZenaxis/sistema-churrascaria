"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function loginWithPhone(phone: string, customerName?: string, address?: string) {
  try {
    const formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.length < 10) return { success: false, error: 'Número inválido' }

    // Pega ou cria o usuário baseado no telefone
    let user = await prisma.user.findUnique({ where: { phone: formattedPhone } })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          name: customerName || 'Cliente ' + formattedPhone.slice(-4),
          address: address || null
        }
      })
    } else if (address && user.address !== address) {
      // Se já existia, mas o endereço mudou, atualiza
      user = await prisma.user.update({
        where: { id: user.id },
        data: { address }
      })
    }

    // Salva nos cookies por 30 dias usando next/headers set
    const cookieStore = await cookies()
    cookieStore.set('session_phone', formattedPhone, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })

    return { success: true, user }
  } catch (error) {
    console.error("Erro no login", error)
    return { success: false, error: 'Erro ao entrar.' }
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const phone = cookieStore.get('session_phone')?.value
  
  if (!phone) return null

  const user = await prisma.user.findUnique({ where: { phone } })
  return user
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session_phone')
}
