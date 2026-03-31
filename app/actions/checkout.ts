"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { getSessionUser } from './auth'

type PaymentMethod = 'PIX' | 'CARD' | 'CASH'

export async function submitOrder(
  totalAmount: number,
  paymentMethod: PaymentMethod,
  changeFor?: number,
  addressId?: string
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return { success: false, requiresAuth: true }
    }

    // Resolve o endereço escolhido (ou o default do usuário)
    const targetAddressId = addressId
      || user.addresses.find(a => a.isDefault)?.id
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

    // Monta string formatada para exibição na cozinha/motoboy
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

            // Salva no cache do Address
            await prisma.address.update({
              where: { id: address.id },
              data: { lat, lng }
            })
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err)
        // Não bloqueia o pedido
      }
    }

    const zone = await prisma.deliveryZone.findFirst()

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        status: OrderStatus.PENDING,
        totalAmount,
        paymentMethod,
        changeFor: paymentMethod === 'CASH' ? (changeFor ?? null) : null,
        deliveryZoneId: zone?.id,
        estimatedDeliveryTime: 30,
        deliveryAddress: deliveryAddressStr,
        addressId: address.id,
        customerLat: lat,
        customerLng: lng,
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
