import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OrderTracker from './OrderTracker'

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } }
  })

  if (!order) return redirect('/')

  return (
    <main className="min-h-screen bg-black text-white p-6 justify-center flex">
      <div className="w-full max-w-md pt-8">
         <h1 className="text-3xl font-black mb-1 uppercase tracking-tight">Status do Pedido</h1>
         <p className="text-zinc-500 mb-8 font-bold text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
         
         {/* @ts-ignore */}
         <OrderTracker order={order} />
      </div>
    </main>
  )
}
