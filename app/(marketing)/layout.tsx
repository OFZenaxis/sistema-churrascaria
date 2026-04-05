import type { Metadata } from 'next'
import WhatsAppButton from '@/components/WhatsAppButton'

export const metadata: Metadata = {
  title: 'Saiu Delivery · Pare de Pagar Taxas. O Lucro do Seu Delivery é 100% Seu.',
  description: 'Plataforma SaaS para restaurantes terem seu próprio site de pedidos, Pix direto na conta e cozinha KDS. Zero taxa por pedido. R$ 97/mês.',
  keywords: ['delivery próprio', 'site de pedidos', 'sem taxa de entrega', 'sistema kds', 'pix delivery', 'saas restaurante'],
  openGraph: {
    title: 'Saiu Delivery · Pare de Pagar Taxas',
    description: 'Tenha seu site de pedidos próprio e Pix direto na conta. Zero comissão por pedido.',
    type: 'website',
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 antialiased">
      {children}
      <WhatsAppButton />
    </div>
  )
}
