import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname
  const hostname = req.headers.get("host") || ""

  // 1. Ignorar rotas do Next.js (arquivos estáticos, assets)
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // 2. Proteção de Rotas Administrativas (Auth)
  // Formato das rotas: /{slug}/admin e /{slug}/admin/login
  const segments = pathname.split('/').filter(Boolean)
  const urlSlug = segments[0] ?? ''
  const isAdminRoute = segments.length >= 2 && segments[1] === 'admin'
  const isAdminLoginRoute = segments.length >= 3 && segments[1] === 'admin' && segments[2] === 'login'

  if (isAdminRoute && !isAdminLoginRoute) {
    // Aceita lojista_token (novo) ou admin_token (legado em migração)
    const lojistaToken = req.cookies.get('lojista_token')?.value
    const adminToken = req.cookies.get('admin_token')?.value

    if (!lojistaToken && !adminToken) {
      // Se é API, retorna 401 JSON (não redirect)
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
      // Se é página, redireciona para o login do tenant correto
      return NextResponse.redirect(new URL(`/${urlSlug}/admin/login`, req.url))
    }
  }

  // 3. Injetar x-store-domain para APIs e pular o Rewrite estrutural das pastas
  // Nossas APIs não estão dentro de (marketing) nem (store), ficam livres e dependem do header
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('x-store-domain', hostname)
    return response
  }

  // 4. Roteamento Multi-Tenant (Domínios e Route Groups)
  const isRootDomain = hostname === 'saiudelivery.com.br' || hostname === 'localhost:3000' || hostname === 'localhost:3001'

  if (isRootDomain && pathname === '/') {
    // Route Groups são invisíveis — Next.js resolve app/(marketing)/page.tsx como '/' naturalmente
    return NextResponse.next()
  }
  
  if (isRootDomain) {
    return NextResponse.next()
  }

  // Caso Subdomínio (.saiudelivery.com.br)
  // Route Groups são invisíveis — app/(store)/[slug]/page.tsx responde em /[slug]
  if (hostname.endsWith('.saiudelivery.com.br')) {
    const subdomain = hostname.replace('.saiudelivery.com.br', '')
    return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, req.url))
  }

  // Caso Domínio Customizado (Qualquer outro host)
  return NextResponse.rewrite(new URL(`/${hostname}${pathname}`, req.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
