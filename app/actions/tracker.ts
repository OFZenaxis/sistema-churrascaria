"use server"

import { prisma } from '@/lib/prisma'
import { getSessionUser } from './auth'
import { getLojistaSession } from './adminAuth'
import { logger } from '@/lib/logger'

export async function updateMotoboyLocation(orderId: string, lat: number, lng: number, storeId: string) {
  const session = await getLojistaSession(storeId)
  if (!session) return { success: false, error: 'Não autorizado' }

  // BUG-005: Rejeita NaN, Infinity e valores fora dos limites geográficos válidos
  if (
    typeof lat !== 'number' || typeof lng !== 'number' ||
    !isFinite(lat) || !isFinite(lng) ||
    lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    return { success: false, error: 'Coordenadas inválidas' }
  }

  try {
    await prisma.order.update({
      where: { id: orderId, storeId: session.storeId },
      data: { driverLat: lat, driverLng: lng }
    })
    return { success: true }
  } catch (error) {
    logger.error('tracker', 'Erro ao atualizar localização: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    return { success: false }
  }
}

export async function getOrderLocation(orderId: string, storeId: string) {
  try {
    // 🔒 Verificar sessão: aceita cliente autenticado OU lojista admin do mesmo tenant
    const [customer, adminSession] = await Promise.all([
      getSessionUser(storeId).catch(() => null),
      getLojistaSession(storeId),
    ])

    if (!customer && !adminSession) {
      return { success: false, error: 'Não autorizado' }
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId }, // 🔒 sempre filtra pelo tenant
      select: { driverLat: true, driverLng: true, status: true, customerId: true }
    })

    if (!order) {
      return { success: false, error: 'Pedido não encontrado' }
    }

    // 🔒 Clientes só podem rastrear os próprios pedidos
    if (customer && !adminSession && order.customerId !== customer.id) {
      return { success: false, error: 'Não autorizado' }
    }

    const { customerId: _removed, ...locationData } = order
    return { success: true, data: locationData }
  } catch (error) {
    console.error("[tracker] Erro ao buscar localização:", error instanceof Error ? error.message : 'Erro desconhecido')
    return { success: false }
  }
}
