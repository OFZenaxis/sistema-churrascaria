"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { requireAdminSession } from '@/app/actions/adminAuth'
import { logger } from '@/lib/logger'

export async function advanceOrderStatus(orderId: string, currentStatus: OrderStatus, storeId: string) {
  const session = await requireAdminSession(storeId)
  if (!session) return { success: false, error: 'Não autorizado' }

  try {
    let nextStatus: OrderStatus = OrderStatus.PENDING

    if (currentStatus === 'PENDING') nextStatus = 'PREPARING'
    else if (currentStatus === 'PREPARING') nextStatus = 'READY_FOR_PICKUP'
    else return { success: false, error: 'Status final finalizado' }

    await prisma.order.update({
      where: { id: orderId, storeId: session.storeId },
      data: { status: nextStatus }
    })

    return { success: true, newStatus: nextStatus }
  } catch (error) {
    logger.error('kitchen', 'Erro advanceOrderStatus: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false }
  }
}
