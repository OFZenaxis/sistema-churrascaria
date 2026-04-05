import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
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
