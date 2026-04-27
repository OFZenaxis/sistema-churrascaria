"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/app/actions/adminAuth'
import { logger } from '@/lib/logger'

export async function acceptRide(orderId: string, storeId: string, slug: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false, error: 'Não autorizado' }

  try {
    await prisma.order.update({
      where: { id: orderId, storeId: session.storeId },
      data: { status: OrderStatus.DISPATCHED }
    })
    revalidatePath(`/${slug}/motoboy`)
    return { success: true }
  } catch (error) {
    logger.error('driver', 'Erro ao aceitar corrida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao aceitar' }
  }
}

export async function finishRide(orderId: string, storeId: string, slug: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false, error: 'Não autorizado' }

  try {
    await prisma.order.update({
      where: { id: orderId, storeId: session.storeId },
      data: { status: OrderStatus.DELIVERED }
    })
    revalidatePath(`/${slug}/motoboy`)
    return { success: true }
  } catch (error) {
    logger.error('driver', 'Erro ao finalizar corrida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false, error: 'Erro ao finalizar' }
  }
}
