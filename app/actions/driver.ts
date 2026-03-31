"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function acceptRide(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DISPATCHED }
    })
    revalidatePath('/motoboy')
    return { success: true }
  } catch (error) {
    console.error("Erro ao aceitar corrida", error)
    return { success: false, error: 'Erro ao aceitar' }
  }
}

export async function finishRide(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED }
    })
    revalidatePath('/motoboy')
    return { success: true }
  } catch (error) {
    console.error("Erro ao finalizar corrida", error)
    return { success: false, error: 'Erro ao finalizar' }
  }
}
