import React from 'react'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import KitchenClient from './KitchenClient'

export const dynamic = 'force-dynamic'

export default async function KitchenPage() {
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP]
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Convert for client props keeping date types 
  const formattedOrders = activeOrders.map(o => ({
    id: o.id,
    customerName: o.customerName,
    totalAmount: o.totalAmount,
    status: o.status,
    createdAt: o.createdAt,
    items: o.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      doneness: item.doneness,
      comboSides: item.comboSides,
      product: { name: item.product.name }
    }))
  }))

  return <KitchenClient activeOrders={formattedOrders} />
}
