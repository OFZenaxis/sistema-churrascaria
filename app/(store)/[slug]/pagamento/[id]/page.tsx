import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import PaymentClient from './PaymentClient'
import PaymentPixClient from './PaymentPixClient'

export default async function PagamentoPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ method?: string }>
}) {
  const { slug, id } = await params
  const { method } = await searchParams

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, totalAmount: true, paymentStatus: true, storeId: true, customerPhone: true }
  })

  if (!order) notFound()

  // 🔒 Valida que o pedido pertence à loja deste slug antes de renderizar
  const store = await prisma.store.findFirst({
    where: { slug },
    select: { id: true }
  })

  if (!store || order.storeId !== store.id) notFound()

  // Já pago — redireciona para a tela de acompanhamento
  if (order.paymentStatus === 'approved' || order.paymentStatus === 'PAID') {
    redirect(`/pedido/${order.id}`)
  }

  // Busca credenciais do lojista no banco (isolado por tenant via storeId)
  const paymentConfig = await prisma.storePaymentConfig.findUnique({
    where: { storeId: order.storeId },
    select: { mpPublicKey: true }
  })

  const pubKey = paymentConfig?.mpPublicKey ?? ''

  const customerEmail = `${order.customerPhone.replace(/\D/g, '')}@saiu.delivery`

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-md mt-6">
        <h1 className="text-2xl font-black mb-1 uppercase tracking-tight">Finalizar Pagamento</h1>
        <p className="text-zinc-400 font-medium mb-8">
          Pedido Nº {order.id.split('-')[0].toUpperCase()} •{' '}
          <span className="text-[#E31C1C] font-black">R$ {order.totalAmount.toFixed(2)}</span>
        </p>

        <div className="bg-[#111] p-4 rounded-3xl border border-[#222]">
          {!pubKey ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-amber-400 font-black text-sm uppercase tracking-wide">Pagamento Indisponível</p>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                Esta loja ainda não configurou os pagamentos online.<br />
                Entre em contato com o estabelecimento.
              </p>
            </div>
          ) : method === 'PIX' ? (
            <PaymentPixClient orderId={order.id} amount={order.totalAmount} customerEmail={customerEmail} />
          ) : (
            <PaymentClient
              orderId={order.id}
              slug={slug}
              amount={order.totalAmount}
              pubKey={pubKey}
              method={method}
              customerEmail={customerEmail}
            />
          )}
        </div>
      </div>
    </main>
  )
}
