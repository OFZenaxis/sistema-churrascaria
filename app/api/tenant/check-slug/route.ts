import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Slugs reservados — não podem ser usados por lojistas (conflitam com rotas da plataforma)
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'cadastro', 'pricing',
  'about', 'contato', 'suporte', 'saiu', 'saiudelivery',
  'app', 'dashboard', 'billing', 'webhook', 'static',
])

export async function GET(req: Request) {
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
