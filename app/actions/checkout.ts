"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function submitOrder(totalAmount: number) {
  try {
    // 1. Pega ou cria o "Cliente Teste Central"
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: { name: 'Cliente App', phone: '61' + Math.floor(Math.random()*99999999) }
      })
    }

    const zone = await prisma.deliveryZone.findFirst()

    // 2. Cria a Order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        status: OrderStatus.READY_FOR_PICKUP, // Para fins do MVP simulamos que já está pronto pra pegar
        totalAmount,
        deliveryZoneId: zone?.id,
        estimatedDeliveryTime: 30,
        deliveryAddress: 'Rua das Flores, Quadra 5 - Centro, Luziânia'
      }
    })

    return { success: true, orderId: order.id }
  } catch (error) {
    console.error("Erro no checkout", error)
    return { success: false }
  }
}
