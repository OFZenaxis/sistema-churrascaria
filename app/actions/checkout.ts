"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { getSessionUser } from './auth'
import { logger } from '@/lib/logger'
import { geocodeAddress, getDrivingDistance, calcDeliveryFee } from '@/lib/mapbox'

type PaymentMethod = 'PIX' | 'CARD_ONLINE' | 'CARD_MACHINE' | 'CASH'

type CartItemInput = {
  productId: string
  quantity: number
  optionsText?: string
}

// ── Estimativa de frete (chamada no checkout modal antes de confirmar) ─────────
export async function estimateDeliveryFee(
  addressId: string,
  storeId: string
): Promise<{ fee: number; distanceKm: number | null; outOfRange: boolean; isEstimated?: boolean; error?: string }> {
  try {
    // BUG-031: verifica ownership — address deve pertencer ao customer autenticado
    const user = await getSessionUser(storeId)
    if (!user) return { fee: 0, distanceKm: null, outOfRange: false, isEstimated: true }

    const [address, store] = await Promise.all([
      prisma.address.findFirst({
        where: { id: addressId, customerId: user.id },
        select: { lat: true, lng: true, rua: true, numero: true, bairro: true, cidade: true, estado: true }
      }),
      prisma.store.findUnique({
        where: { id: storeId },
        select: { storeLat: true, storeLng: true, baseDeliveryFee: true, deliveryFeePerKm: true, maxDeliveryRadius: true }
      })
    ])

    if (!address || !store) return { fee: 0, distanceKm: null, outOfRange: false }

    // Se a loja não tiver coordenadas configuradas, cobra apenas a taxa base (estimada)
    if (!store.storeLat || !store.storeLng) {
      return { fee: store.baseDeliveryFee, distanceKm: null, outOfRange: false, isEstimated: true }
    }

    let lat = address.lat
    let lng = address.lng

    // Geocodifica se o endereço ainda não tiver coordenadas
    if (!lat || !lng) {
      const fullAddress = `${address.rua}, ${address.numero}, ${address.bairro}, ${address.cidade}, ${address.estado}, Brasil`
      const coords = await geocodeAddress(fullAddress)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        await prisma.address.update({ where: { id: addressId }, data: { lat, lng } })
      }
    }

    // BUG-009: sem coords do cliente = fallback estimado
    if (!lat || !lng) {
      return { fee: store.baseDeliveryFee, distanceKm: null, outOfRange: false, isEstimated: true }
    }

    const distanceKm = await getDrivingDistance(store.storeLat, store.storeLng, lat, lng)

    // BUG-009: Mapbox Directions falhou = fallback estimado para taxa base
    if (distanceKm === null) {
      return { fee: store.baseDeliveryFee, distanceKm: null, outOfRange: false, isEstimated: true }
    }

    if (distanceKm > store.maxDeliveryRadius) {
      return { fee: 0, distanceKm, outOfRange: true, error: 'Infelizmente não entregamos neste endereço no momento.' }
    }

    const fee = calcDeliveryFee(distanceKm, store.baseDeliveryFee, store.deliveryFeePerKm)
    return { fee, distanceKm, outOfRange: false }
  } catch {
    return { fee: 0, distanceKm: null, outOfRange: false, isEstimated: true }
  }
}

export async function submitOrder(
  paymentMethod: PaymentMethod,
  cartItems: CartItemInput[],
  changeFor?: number,
  addressId?: string,
  storeId?: string // Adicionado na FASE 1
) {
  try {
    // 🔒 storeId verificado primeiro — sem ele não há contexto de tenant válido
    if (!storeId) {
      throw new Error('Tenant não identificado: storeId ausente no checkout')
    }
    const targetStoreId = storeId

    const user = await getSessionUser(storeId)

    if (!user) {
      return { success: false, requiresAuth: true }
    }

    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Carrinho vazio.' }
    }

    // ── Resolve address ──
    const targetAddressId = addressId
      || user.addresses.find(a => a.isDefault)?.id
      || user.addresses[0]?.id

    if (!targetAddressId) {
      return { success: false, requiresAddress: true }
    }

    // 🔒 Valida que o endereço pertence ao customer autenticado — impede uso de endereço alheio
    const address = await prisma.address.findFirst({
      where: { id: targetAddressId, customerId: user.id }
    })

    if (!address) {
      return { success: false, error: 'Endereço não encontrado.' }
    }

    // ══════════════════════════════════════════════════════════════
    // FASE 1: FILTRO DE PRODUTOS PELO STORE ID
    // ══════════════════════════════════════════════════════════════
    const productIds = [...new Set(cartItems.map(i => i.productId))]
    const dbProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds }, 
        isActive: true,
        storeId: targetStoreId // 🔒 Validação Multi-Tenant de Catálogo
      },
      select: { id: true, price: true, name: true }
    })

    const priceMap = new Map(dbProducts.map(p => [p.id, p]))

    let serverTotal = 0
    const validatedItems: {
      productId: string
      quantity: number
      unitPrice: number
      comboSides: string | null
    }[] = []

    for (const item of cartItems) {
      const dbProduct = priceMap.get(item.productId)
      if (!dbProduct) {
        return { success: false, error: `Produto isolado / indisponível para esta Loja.` }
      }

      if (item.quantity < 1 || item.quantity > 50) {
        return { success: false, error: 'Quantidade inválida.' }
      }

      const unitPrice = dbProduct.price
      serverTotal += unitPrice * item.quantity

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        comboSides: item.optionsText || null,
      })
    }

    // ── Monta endereço formatado ──
    const deliveryAddressStr = [
      `${address.rua}, ${address.numero}`,
      address.complemento,
      address.bairro,
      `${address.cidade} - ${address.estado}`,
      `CEP ${address.cep}`
    ].filter(Boolean).join(', ')

    // ── Geocodificação do endereço do cliente ──
    let lat = address.lat ?? null
    let lng = address.lng ?? null

    if (!lat || !lng) {
      const fullAddress = `${address.rua}, ${address.numero}, ${address.bairro}, ${address.cidade}, ${address.estado}, Brasil`
      const coords = await geocodeAddress(fullAddress)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        await prisma.address.update({ where: { id: address.id }, data: { lat, lng } })
      }
    }

    // ── Busca configurações de entrega do tenant ──
    const storeDelivery = await prisma.store.findUnique({
      where: { id: targetStoreId },
      select: {
        storeLat: true,
        storeLng: true,
        baseDeliveryFee: true,
        deliveryFeePerKm: true,
        maxDeliveryRadius: true,
      }
    })

    // ── Validação de raio e cálculo de frete dinâmico ──
    let deliveryFee = 0

    if (
      storeDelivery?.storeLat &&
      storeDelivery?.storeLng &&
      lat &&
      lng
    ) {
      const distanceKm = await getDrivingDistance(
        storeDelivery.storeLat,
        storeDelivery.storeLng,
        lat,
        lng
      )

      if (distanceKm !== null) {
        if (distanceKm > storeDelivery.maxDeliveryRadius) {
          return {
            success: false,
            error: 'Infelizmente não entregamos neste endereço no momento.'
          }
        }
        deliveryFee = calcDeliveryFee(
          distanceKm,
          storeDelivery.baseDeliveryFee,
          storeDelivery.deliveryFeePerKm
        )
      }
    }

    serverTotal += deliveryFee

    // ── Criar pedido ──
    const order = await prisma.order.create({
      data: {
        storeId: targetStoreId, // 🔒 Tenant
        customerId: user.id,
        customerName: user.name || "Cliente sem Nome",
        customerPhone: user.phone || "00000000000",
        status: OrderStatus.PENDING,
        totalAmount: serverTotal,
        paymentMethod,
        changeFor: paymentMethod === 'CASH' ? (changeFor ?? null) : null,
        estimatedDeliveryTime: 30,
        deliveryAddress: deliveryAddressStr,
        addressId: address.id,
        customerLat: lat,
        customerLng: lng,
        items: {
          create: validatedItems
        }
      }
    })

    return { success: true, orderId: order.id }
  } catch (error: unknown) {
    logger.error('checkout', 'submitOrder: ' + (error instanceof Error ? error.message : 'Erro desconhecido'), error)
    const isPrismaConflict =
      typeof error === 'object' && error !== null &&
      'code' in error && (error as { code: string }).code === 'P2002'
    return { success: false, error: isPrismaConflict ? 'Pedido duplicado detectado.' : 'Erro na conexão com o banco. Tente novamente.' }
  }
}
