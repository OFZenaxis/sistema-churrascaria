import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// FASE 3: STORE STATUS DA MASTER STORE (OU TENANT ATIVO)
async function getActiveStore() {
  const headerList = await headers();
  const host = headerList.get('x-store-domain');

  if (!host) {
    return await prisma.store.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  const slug = host.replace('.saiudelivery.com.br', '');
  
  return await prisma.store.findFirst({
    where: {
      OR: [
        { customDomain: host },
        { slug: slug }
      ]
    }
  });
}

export async function GET(req: Request) {
  try {
    const store = await getActiveStore();
    if (!store) {
       return NextResponse.json({ isOpen: false })
    }
    return NextResponse.json({ isOpen: store.isOpen })
  } catch(e) {
    return NextResponse.json({ error: 'Erro DB' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const store = await getActiveStore();

    if (!store) {
      return NextResponse.json({ error: 'SaaS não configurado.' }, { status: 400 })
    }
    
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { isOpen: body.isOpen }
    })

    return NextResponse.json({ success: true, isOpen: updatedStore.isOpen })
  } catch(e) {
    return NextResponse.json({ error: 'Erro ao salvar status' }, { status: 500 })
  }
}
