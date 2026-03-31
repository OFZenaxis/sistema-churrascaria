import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Premium Steakhouse Delivery',
  description: 'Sistema de Gestão e Delivery para Carnes Nobres.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#0a0a0a] text-zinc-100 antialiased min-h-screen flex flex-col`}>
        {/* Navigation Bar */}
        <header className="border-b border-zinc-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold text-2xl tracking-tighter">Steakhouse</span>
              <span className="text-zinc-400 font-medium text-sm mt-1">Delivery</span>
            </div>
            
            <nav className="flex gap-6 text-sm font-medium text-zinc-400">
              <a href="/" className="hover:text-orange-500 transition-colors">Cardápio</a>
              <a href="/kitchen" className="hover:text-orange-500 transition-colors">Cozinha (KDS)</a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
