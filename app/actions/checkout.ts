"use server"

import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { getSessionUser } from './auth'

type PaymentMethod = 'PIX' | 'CARD' | 'CASH'

export async function submitOrder(
  totalAmount: number,
  paymentMethod: PaymentMethod,
  changeFor?: number,
  payloadAddress?: string
) {
  try {
    const user = await getSessionUser()
    
    if (!user) {
      return { success: false, requiresAuth: true }
    }

    const zone = await prisma.deliveryZone.findFirst()

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const finalAddress = payloadAddress || user.address || 'Endereço não informado'
    
    let lat: number | null = user.lat ?? null
    let lng: number | null = user.lng ?? null

    // Cache de geocoding: só chama a API se o endereço é diferente ou não tem coords
    const addressChanged = payloadAddress && payloadAddress !== user.address
    const hasNoCoords = !user.lat || !user.lng

    if (mapboxToken && finalAddress !== 'Endereço não informado' && (hasNoCoords || addressChanged)) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(finalAddress)}.json?access_token=${mapboxToken}&limit=1`
        const geoRes = await fetch(url, { next: { revalidate: 0 } })
        if (!geoRes.ok) throw new Error(`Mapbox returned ${geoRes.status}`)
        
        const geoData = await geoRes.json()
        if (geoData.features?.length > 0) {
          const [lon, lati] = geoData.features[0].center
          lng = lon
          lat = lati

          // Salva no perfil do usuário para próximas vezes (cache)
          await prisma.user.update({
            where: { id: user.id },
            data: { lat, lng, address: finalAddress }
          })
        } else {
          return { success: false, error: 'Endereço não localizado. Por favor, tente ser mais específico (incluir cidade).' }
        }
      } catch (err) {
        console.error("Geocoding failed", err)
        // Não bloqueia o pedido se o geocoding falhar — apenas não terá rota no mapa
      }
    }

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
        deliveryAddress: finalAddress,
        customerLat: lat,
        customerLng: lng
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
