"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function updateMotoboyLocation(orderId: string, lat: number, lng: number) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { driverLat: lat, driverLng: lng }
    })
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar localização", error)
    return { success: false }
  }
}

export async function getOrderLocation(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { driverLat: true, driverLng: true, status: true }
    })
    return { success: true, data: order }
  } catch (error) {
    console.error("Erro ao buscar localização", error)
    return { success: false }
  }
}
