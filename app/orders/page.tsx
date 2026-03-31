import React from 'react'
import { getSessionUser } from '../actions/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

// Esta rota agora é dinâmica devido aos cookies
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const user = await getSessionUser()

  if (!user) {
    // Se não tem sessão, manda pro início logar
    redirect('/')
  }

  // Busca os pedidos recentes do cliente ordenados pelo mais novo
  const activeOrders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return (
    <div className="pt-24 lg:pt-32 px-4 pb-20">
      <OrdersClient orders={activeOrders as any} />
    </div>
  )
}
