"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { getSessionUser } from './auth'

type PaymentMethod = 'PIX' | 'CARD' | 'CASH'

// ══════════════════════════════════════════════════════════════════
// UPSELLS SERVER-SIDE (espelho exato do ProductModal.tsx)
// O frontend envia apenas os IDs; os preços são calculados AQUI.
// ══════════════════════════════════════════════════════════════════
const SERVER_UPSELLS: Record<string, { name: string; price: number }> = {
  u1: { name: 'Carne Assada Extra', price: 10.0 },
  u2: { name: 'Linguiça Toscana Extra', price: 4.0 },
  u3: { name: 'Ovo Frito', price: 3.0 },
}

type CartItemInput = {
  productId: string
  quantity: number
  optionsText?: string
  upsellIds?: string[]
}

export async function submitOrder(
  paymentMethod: PaymentMethod,
  cartItems: CartItemInput[],
  changeFor?: number,
  addressId?: string
) {
  try {
    const user: any = await getSessionUser()

    if (!user) {
      return { success: false, requiresAuth: true }
    }

    // ── Validate cart is not empty ──
    if (!cartItems || cartItems.length === 0) {
      return { success: false, error: 'Carrinho vazio.' }
    }

    // ── Resolve address ──
    const targetAddressId = addressId
      || user.addresses.find((a: any) => a.isDefault)?.id
      || user.addresses[0]?.id

    if (!targetAddressId) {
      return { success: false, requiresAddress: true }
    }

    const address = await prisma.address.findUnique({
      where: { id: targetAddressId }
    })

    if (!address) {
      return { success: false, error: 'Endereço não encontrado.' }
    }

    // ══════════════════════════════════════════════════════════════
    // 🔒 CÁLCULO DE PREÇO SERVER-SIDE (a "Trava do Dinheiro")
    // ══════════════════════════════════════════════════════════════

    // 1. Buscar TODOS os preços reais do banco de dados
    const productIds = [...new Set(cartItems.map(i => i.productId))]
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, price: true, name: true }
    })

    // 2. Criar index para lookup rápido
    const priceMap = new Map(dbProducts.map(p => [p.id, p]))

    // 3. Validar que todos os produtos existem e calcular total
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
        return { success: false, error: `Produto não encontrado ou indisponível.` }
      }

      if (item.quantity < 1 || item.quantity > 50) {
        return { success: false, error: 'Quantidade inválida.' }
      }

      // Calcular preço unitário: preço base + upsells
      let unitPrice = dbProduct.price

      if (item.upsellIds && item.upsellIds.length > 0) {
        for (const upsellId of item.upsellIds) {
          const upsell = SERVER_UPSELLS[upsellId]
          if (upsell) {
            unitPrice += upsell.price
          }
          // IDs inválidos são silenciosamente ignorados (segurança)
        }
      }

      serverTotal += unitPrice * item.quantity

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        comboSides: item.optionsText || null,
      })
    }

    // ══════════════════════════════════════════════════════════════

    // ── Monta endereço formatado ── 
    const deliveryAddressStr = [
      `${address.rua}, ${address.numero}`,
      address.complemento,
      address.bairro,
      `${address.cidade} - ${address.estado}`,
      `CEP ${address.cep}`
    ].filter(Boolean).join(', ')

    let lat = address.lat ?? null
    let lng = address.lng ?? null

    // Geocoding se não tiver cache no Address
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (mapboxToken && (!lat || !lng)) {
      try {
        const fullAddress = `${address.rua}, ${address.numero}, ${address.bairro}, ${address.cidade}, ${address.estado}, Brasil`
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&limit=1`
        const geoRes = await fetch(url, { next: { revalidate: 0 } })

        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (geoData.features?.length > 0) {
            const [lon, lati] = geoData.features[0].center
            lng = lon
            lat = lati

            await prisma.address.update({
              where: { id: address.id },
              data: { lat, lng }
            })
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err)
      }
    }

    const zone = await prisma.deliveryZone.findFirst()

    // ── Criar pedido com preço SERVER-SIDE ──
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        status: OrderStatus.PENDING,
        totalAmount: serverTotal, // 🔒 Calculado pelo servidor, NUNCA pelo browser
        paymentMethod,
        changeFor: paymentMethod === 'CASH' ? (changeFor ?? null) : null,
        deliveryZoneId: zone?.id,
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
  } catch (error: any) {
    console.error("Erro no checkout", error)
    const message = error?.code === 'P2002'
      ? 'Pedido duplicado detectado.'
      : 'Erro na conexão com o banco. Tente novamente.'
    return { success: false, error: message }
  }
}
