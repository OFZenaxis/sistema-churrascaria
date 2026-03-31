import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import MotoboyClient from './MotoboyClient'

function calculateElapsed(createdAt: Date): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  return `${m} min`
}

export default async function MotoboyPage() {
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.DISPATCHED]
      }
    },
    include: {
      deliveryZone: true // para saber o valor da entrega
    },
    orderBy: { createdAt: 'asc' }
  })

  // Format orders to Ride props
  const rides = activeOrders.map(order => {
    // Basic formatting from DB Order
    const addressData = order.deliveryAddress ? order.deliveryAddress.split(' - ') : ['Sem Endereço', 'Desconhecido']
    const address = addressData[0]
    const neighborhood = addressData[addressData.length - 1] || order.deliveryZone?.name || 'Local'
    
    // Distância mock baseada na zona
    const distance = (Math.random() * 5 + 1).toFixed(1) + ' km'
    
    return {
      id: order.id,
      address,
      neighborhood,
      distance,
      payout: order.deliveryZone?.fee || 5.0,
      status: order.status === OrderStatus.READY_FOR_PICKUP ? 'AVAILABLE' : 'DISPATCHED',
      timeElapsed: calculateElapsed(order.createdAt),
      customerLat: order.customerLat,
      customerLng: order.customerLng,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
    }
  })

  // Orders concluded today
  const beginningOfDay = new Date()
  beginningOfDay.setHours(0,0,0,0)
  
  const completedRides = await prisma.order.findMany({
    where: {
      status: OrderStatus.DELIVERED,
      updatedAt: { gte: beginningOfDay }
    },
    include: { deliveryZone: true }
  })

  const totalEarned = completedRides.reduce((acc, order) => acc + (order.deliveryZone?.fee || 0), 0)

  return (
    <MotoboyClient 
      availableRides={rides.filter(r => r.status === 'AVAILABLE') as any} 
      myRides={rides.filter(r => r.status === 'DISPATCHED') as any}
      completedRidesTotal={completedRides.length}
      totalEarned={totalEarned}
    />
  )
}
