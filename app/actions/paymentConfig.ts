"use server"

import { prisma } from '@/lib/prisma'
import { getLojistaSession } from './adminAuth'

export async function getPaymentConfig() {
  const session = await getLojistaSession()
  if (!session) return null

  const config = await prisma.storePaymentConfig.findUnique({
    where: { storeId: session.storeId },
    select: { mpPublicKey: true, mpAccessToken: true }
  })

  return config
}

export async function savePaymentConfig(data: {
  mpPublicKey: string
  mpAccessToken?: string
}) {
  const session = await getLojistaSession()
  if (!session) return { success: false, error: 'Não autorizado.' }

  const publicKey = data.mpPublicKey.trim()
  const newToken = data.mpAccessToken?.trim() ?? ''

  if (!publicKey) {
    return { success: false, error: 'A Public Key é obrigatória.' }
  }

  const existing = await prisma.storePaymentConfig.findUnique({
    where: { storeId: session.storeId },
    select: { mpAccessToken: true },
  })

  if (!existing?.mpAccessToken && !newToken) {
    return { success: false, error: 'Preencha o Access Token.' }
  }

  await prisma.storePaymentConfig.upsert({
    where: { storeId: session.storeId },
    create: { storeId: session.storeId, mpPublicKey: publicKey, mpAccessToken: newToken },
    update: {
      mpPublicKey: publicKey,
      ...(newToken && { mpAccessToken: newToken }),
    },
  })

  return { success: true }
}
