import { NextResponse } from 'next/server'
// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()

// Mock function representing the new logic differential
async function getDynamicEstimatedTime(zoneId: string, currentQueueLength: number) {
  // Base time for specific zone (e.g. Center = 20, South = 35)
  // Let's assume fetched from DB based on zoneId
  let baseTime = 25 

  // The Magic Logic: If there are many orders in queue, increase time exponentially or linearly
  // This reduces customer complaints by setting realistic expectations dynamically
  const penaltyPerOrder = 5 // 5 minutes extra per order waiting

  const estimatedDeliveryTime = baseTime + (currentQueueLength * penaltyPerOrder)
  
  // Cap at 120 minutes max to avoid scaring clients
  return Math.min(estimatedDeliveryTime, 120)
}

export async function POST(request: Request) {
  try {
    const { orderId, driverId, zoneId } = await request.json()

    if (!orderId || !driverId) {
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 })
    }

    /*
      REAL LOGIC USING PRISMA (Commented out until DB is seeded)
      
      const currentPendingOrders = await prisma.order.count({
        where: { status: { in: ['PENDING', 'PREPARING'] } }
      })

      const estimatedTime = await getDynamicEstimatedTime(zoneId, currentPendingOrders)

      const dispatchResult = await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'DISPATCHED',
          estimatedDeliveryTime: estimatedTime,
          delivery: {
            create: {
               driverName: 'Motorista Mock',
               driverId: driverId
            }
          }
        }
      })
    */

    // Simulated result
    const simulatedResponse = {
      orderId,
      status: 'DISPATCHED',
      estimatedDeliveryTime: await getDynamicEstimatedTime(zoneId, 10), // mock 10 pending orders
      message: 'Motoboy despachado com sucesso!'
    }

    return NextResponse.json(simulatedResponse, { status: 200 })
  } catch (error) {
    console.error('Dispatch API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
