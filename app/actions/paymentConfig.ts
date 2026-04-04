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
  mpAccessToken: string
}) {
  const session = await getLojistaSession()
  if (!session) return { success: false, error: 'Não autorizado.' }

  const publicKey = data.mpPublicKey.trim()
  const accessToken = data.mpAccessToken.trim()

  if (!publicKey || !accessToken) {
    return { success: false, error: 'Preencha todos os campos.' }
  }

  await prisma.storePaymentConfig.upsert({
    where: { storeId: session.storeId },
    create: { storeId: session.storeId, mpPublicKey: publicKey, mpAccessToken: accessToken },
    update: { mpPublicKey: publicKey, mpAccessToken: accessToken },
  })

  return { success: true }
}
