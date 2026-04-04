import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Domínio base da plataforma — configurável via env para não hardcodar em todo o código
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'saiudelivery.com.br'

// Next.js 16.2.1+ lê proxy.ts e busca o export nomeado "proxy" (ou default)
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
    // 🔒 Cookie isolado por tenant: lojista_token_{storeId}
    // No middleware não temos o storeId (UUID), então verificamos a presença de qualquer cookie
    // do padrão lojista_token_* — a validação completa ocorre no layout do admin via HMAC.
    const hasAdminSession = req.cookies.getAll().some(c => c.name.startsWith('lojista_token_'))

    if (!hasAdminSession) {
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
  //    — Domínio raiz: marketing site (app/(marketing))
  //    — www.BASE_DOMAIN: alias do raiz; sem rewrite, Next.js serve marketing naturalmente
  //    — subdomínio.BASE_DOMAIN: loja do tenant → rewrite para /subdomínio
  //    — qualquer outro host: domínio customizado → rewrite para /host
  const isRootDomain =
    hostname === BASE_DOMAIN ||
    hostname === `www.${BASE_DOMAIN}` ||  // www não é subdomínio de loja
    hostname === 'localhost:3000' ||
    hostname === 'localhost:3001'

  if (isRootDomain) {
    // Route Groups são invisíveis — Next.js resolve app/(marketing)/page.tsx como '/' naturalmente
    return NextResponse.next()
  }

  // Caso Subdomínio (*.BASE_DOMAIN) → rewrite para /{slug}
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '')
    return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, req.url))
  }

  // Caso Domínio Customizado (qualquer outro host)
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
