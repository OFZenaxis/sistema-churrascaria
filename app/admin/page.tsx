import React from 'react'
import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [completedOrders, products, categories, storeSettings] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'DELIVERED' },
      include: { items: { include: { product: true } } }
    }),
    prisma.product.findMany({ orderBy: { type: 'asc' } }),
    prisma.category.findMany(),
    prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
  ])
  
  let totalSales = 0

  const salesByType: Record<string, number> = { CUT: 0, SIDE: 0, BEVERAGE: 0, COMBO: 0 }
  const salesByPayment: Record<string, number> = { PIX: 0, CARD: 0, CASH: 0 }

  completedOrders.forEach(order => {
    totalSales += order.totalAmount
    
    // Agrupa por método de pagamento
    const method = order.paymentMethod?.toUpperCase() ?? 'PIX'
    salesByPayment[method] = (salesByPayment[method] || 0) + order.totalAmount

    // Agrupa por tipo de produto
    order.items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice
      if (item.product?.type) {
        salesByType[item.product.type] = (salesByType[item.product.type] || 0) + lineTotal
      }
    })
  })

  const totalOrders = completedOrders.length
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

  return (
    <AdminClient 
      totalSales={totalSales}
      totalOrders={totalOrders}
      averageTicket={averageTicket}
      salesByType={salesByType}
      salesByPayment={salesByPayment}
      storeIsOpen={storeSettings?.isOpen ?? true}
      products={products as any}
      categories={categories}
    />
  )
}
