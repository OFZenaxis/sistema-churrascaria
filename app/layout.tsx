import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Costa e Souza Churrascaria · Luziânia GO',
  description: 'A Pioneira do Jardim Ingá. Sabor e Tradição. Carnes selecionadas na brasa, entregues na sua porta em Luziânia e região.',
  keywords: ['churrascaria', 'delivery', 'luziânia', 'costa e souza', 'picanha', 'jardim ingá'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-zinc-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
