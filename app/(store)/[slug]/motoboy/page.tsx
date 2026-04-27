import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import MotoboyClient from './MotoboyClient'

function calculateElapsed(createdAt: Date): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  return `${m} min`
}

export default async function MotoboyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const isDomain = slug.includes('.')

  // 🔒 Resolve o tenant correto a partir do slug/domínio
  const store = await prisma.store.findFirst({
    where: isDomain ? { customDomain: slug } : { slug },
    select: { id: true, slug: true, storeLat: true, storeLng: true }
  })

  if (!store) {
    return <div className="text-white p-10">Loja não encontrada.</div>
  }

  const activeOrders = await prisma.order.findMany({
    where: {
      storeId: store.id, // 🔒 Isolamento de tenant — nunca retorna pedidos de outras lojas
      status: {
        in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.DISPATCHED]
      }
    },
    include: {
      deliveryZone: true
    },
    orderBy: { createdAt: 'asc' }
  })

  const rides = activeOrders.map(order => {
    const addressData = order.deliveryAddress ? order.deliveryAddress.split(' - ') : ['Sem Endereço', 'Desconhecido']
    const address = addressData[0]
    const neighborhood = addressData[addressData.length - 1] || order.deliveryZone?.name || 'Local'
    return {
      id: order.id,
      address,
      neighborhood,
      payout: order.deliveryZone?.fee || 5.0,
      status: order.status === OrderStatus.READY_FOR_PICKUP ? 'AVAILABLE' : 'DISPATCHED',
      timeElapsed: calculateElapsed(order.createdAt),
      customerLat: order.customerLat,
      customerLng: order.customerLng,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
    }
  })

  const beginningOfDay = new Date()
  beginningOfDay.setHours(0, 0, 0, 0)

  const completedRides = await prisma.order.findMany({
    where: {
      storeId: store.id, // 🔒 Isolamento de tenant
      status: OrderStatus.DELIVERED,
      updatedAt: { gte: beginningOfDay }
    },
    include: { deliveryZone: true }
  })

  const totalEarned = completedRides.reduce((acc, order) => acc + (order.deliveryZone?.fee || 0), 0)

  return (
    <MotoboyClient
      storeId={store.id}
      slug={store.slug}
      availableRides={rides.filter(r => r.status === 'AVAILABLE') as any}
      myRides={rides.filter(r => r.status === 'DISPATCHED') as any}
      completedRidesTotal={completedRides.length}
      totalEarned={totalEarned}
      storeLat={store.storeLat ?? null}
      storeLng={store.storeLng ?? null}
    />
  )
}
