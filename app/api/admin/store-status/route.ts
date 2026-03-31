import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// O middleware.ts já garante que só admin autenticado chega aqui.

export async function GET(req: Request) {
  try {
    let settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } })
    if (!settings) {
       settings = await prisma.storeSettings.create({ data: { id: "singleton", isOpen: true } })
    }
    return NextResponse.json({ isOpen: settings.isOpen })
  } catch(e) {
    return NextResponse.json({ error: 'Erro DB' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const settings = await prisma.storeSettings.upsert({
      where: { id: "singleton" },
      update: { isOpen: body.isOpen },
      create: { id: "singleton", isOpen: body.isOpen }
    })
    return NextResponse.json({ success: true, isOpen: settings.isOpen })
  } catch(e) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
