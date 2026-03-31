import './globals.css'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'

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
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="bg-black text-zinc-100 antialiased min-h-screen">
        {children}

        {/* Script agressivo para matar cache de PWA/Service Workers velhos usando next/script para evitar erros no console */}
        <Script id="sw-killer" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister().then(function(success) {
                    if(success) window.location.reload();
                  });
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
