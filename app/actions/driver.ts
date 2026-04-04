"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function acceptRide(orderId: string, storeId: string, slug: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    // 🔒 storeId no where garante que o motoboy só opera pedidos do seu tenant
    await prisma.order.update({
      where: { id: orderId, storeId },
      data: { status: OrderStatus.DISPATCHED }
    })
    revalidatePath(`/${slug}/motoboy`)
    return { success: true }
  } catch (error) {
    console.error("[driver] Erro ao aceitar corrida:", error instanceof Error ? error.message : 'Erro desconhecido')
    return { success: false, error: 'Erro ao aceitar' }
  }
}

export async function finishRide(orderId: string, storeId: string, slug: string) {
  if (!storeId) throw new Error('Tenant não identificado')

  try {
    // 🔒 storeId no where garante que o motoboy só finaliza pedidos do seu tenant
    await prisma.order.update({
      where: { id: orderId, storeId },
      data: { status: OrderStatus.DELIVERED }
    })
    revalidatePath(`/${slug}/motoboy`)
    return { success: true }
  } catch (error) {
    console.error("[driver] Erro ao finalizar corrida:", error instanceof Error ? error.message : 'Erro desconhecido')
    return { success: false, error: 'Erro ao finalizar' }
  }
}
