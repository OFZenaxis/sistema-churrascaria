import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rotas públicas: NUNCA interceptar ──
  const isPublic =
    pathname === '/' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||    // Webhooks do MP precisam passar sem auth
    pathname.startsWith('/api/orders') ||       // Polling do cliente (status do pedido)
    pathname.startsWith('/api/payments') ||     // Payment Brick do MP
    pathname.startsWith('/pagamento') ||        // Tela de pagamento do cliente
    pathname.startsWith('/pedido') ||           // Tela de acompanhamento do cliente
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||            // PWA icons
    pathname === '/manifest.json' ||
    pathname === '/ding.mp3'

  if (isPublic) return NextResponse.next()

  // ── Proteger TODAS as rotas admin (páginas E APIs) ──
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  
  if (isAdminRoute) {
    const adminToken = request.cookies.get('admin_token')?.value
    
    if (!adminToken) {
      // Se é API, retorna 401 JSON (não redirect)
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
      // Se é página, redireciona para login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
