import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  // BUG-038: rate limit por IP — 10 requisições por 5 minutos
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = rateLimit(`leads_partial:${ip}`, 10, 5 * 60_000)
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { name, email, phone } = body as { name?: string; email?: string; phone?: string }

    await prisma.partialLead.create({
      data: { name: name ?? null, email: email ?? null, phone: phone ?? null },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
