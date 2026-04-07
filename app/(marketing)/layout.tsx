import type { Metadata } from 'next'
import WhatsAppButton from '@/components/WhatsAppButton'

const OG_DESCRIPTION =
  'Delivery próprio com Pix direto na sua conta. R$ 97/mês fixos, zero comissão por pedido. Setup em 5 minutos.'

export const metadata: Metadata = {
  title: 'Saiu Delivery · Pare de pagar taxas',
  description: OG_DESCRIPTION,
  keywords: ['delivery próprio', 'site de pedidos', 'sem taxa de entrega', 'sistema kds', 'pix delivery', 'saas restaurante'],
  openGraph: {
    title: 'Saiu Delivery · Pare de pagar taxas',
    description: OG_DESCRIPTION,
    type: 'website',
    url: 'https://saiudelivery.com.br',
    images: [
      {
        url: 'https://saiudelivery.com.br/logo-full.png',
        width: 1200,
        height: 630,
        alt: 'Saiu Delivery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saiu Delivery · Pare de pagar taxas',
    description: OG_DESCRIPTION,
    images: ['https://saiudelivery.com.br/logo-full.png'],
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
