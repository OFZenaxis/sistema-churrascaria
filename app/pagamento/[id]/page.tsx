import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PaymentClient from './PaymentClient'

export default async function PagamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, totalAmount: true, paymentStatus: true }
  })

  if (!order) return redirect('/')
  if (order.paymentStatus === 'approved' || order.paymentStatus === 'PAID') {
    return redirect(`/pedido/${order.id}`)
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-md mt-6">
        <h1 className="text-2xl font-black mb-1 uppercase tracking-tight">Finalizar Pagamento</h1>
        <p className="text-zinc-400 font-medium mb-8">Pedido Nº {order.id.split('-')[0].toUpperCase()} • <span className="text-[#E31C1C] font-black">R$ {order.totalAmount.toFixed(2)}</span></p>
        
        <div className="bg-[#111] p-4 rounded-3xl border border-[#222]">
          <PaymentClient 
            orderId={order.id} 
            amount={order.totalAmount} 
            pubKey={process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''} 
          />
        </div>
      </div>
    </main>
  )
}
