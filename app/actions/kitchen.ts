"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function advanceOrderStatus(orderId: string, currentStatus: OrderStatus, storeId: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    let nextStatus: OrderStatus = OrderStatus.PENDING

    if (currentStatus === 'PENDING') nextStatus = 'PREPARING'
    else if (currentStatus === 'PREPARING') nextStatus = 'READY_FOR_PICKUP'
    else return { success: false, error: 'Status final finalizado' }

    // 🔒 storeId no where garante que o pedido pertence ao tenant do admin logado
    await prisma.order.update({
      where: { id: orderId, storeId },
      data: { status: nextStatus }
    })

    return { success: true, newStatus: nextStatus }
  } catch (error) {
    console.error("[kitchen] Erro advanceOrderStatus:", error instanceof Error ? error.message : 'Erro desconhecido')
    return { success: false }
  }
}
