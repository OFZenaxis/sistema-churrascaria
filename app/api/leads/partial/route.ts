import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone } = body as { name?: string; email?: string; phone?: string }

    const ts = new Date().toISOString()
    console.log(`[${ts}] [INFO] [leads/partial] Lead parcial capturado — name="${name}" email="${email}" phone="${phone}"`)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
