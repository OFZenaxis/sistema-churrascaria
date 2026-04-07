import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Saiu Delivery SaaS',
  description: 'Plataforma para dezenas de deliverys.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Saiu Delivery',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3DAA6E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
