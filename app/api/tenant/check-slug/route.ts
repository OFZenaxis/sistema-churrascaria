import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SLUG_REGEX, RESERVED_SLUGS } from '@/lib/validation'
import { rateLimit } from '@/lib/ratelimit'

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`check-slug:${ip}`, 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60_000) / 1000)) },
      }
    )
  }

  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('slug')

  if (!raw) {
    return NextResponse.json(
      { error: 'Parâmetro slug é obrigatório.' },
      { status: 400 }
    )
  }

  const slug = raw.toLowerCase().trim()

  // Formato inválido — retorna unavailable em vez de erro (melhor UX no frontend)
  if (slug.length < 3 || slug.length > 40 || !SLUG_REGEX.test(slug)) {
    return NextResponse.json({ available: false, reason: 'format' })
  }

  // Slug reservado
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ available: false, reason: 'reserved' })
  }

  const existing = await prisma.store.findUnique({
    where: { slug },
    select: { id: true }
  })

  return NextResponse.json({ available: existing === null })
}
