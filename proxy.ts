import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Nunca interceptar: home, login, assets, api
  const isPublic =
    pathname === '/' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')

  if (isPublic) return NextResponse.next()

  const adminToken = request.cookies.get('admin_token')?.value
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/kitchen')

  if (isProtected && !adminToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*'],
}
