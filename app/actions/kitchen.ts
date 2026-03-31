"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function advanceOrderStatus(orderId: string, currentStatus: OrderStatus) {
  try {
    let nextStatus: OrderStatus = OrderStatus.PENDING

    if (currentStatus === 'PENDING') nextStatus = 'PREPARING'
    else if (currentStatus === 'PREPARING') nextStatus = 'READY_FOR_PICKUP'
    else return { success: false, error: 'Status final finalizado' }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus }
    })

    return { success: true, newStatus: nextStatus }
  } catch (error) {
    console.error("Erro advanceOrderStatus:", error)
    return { success: false }
  }
}
