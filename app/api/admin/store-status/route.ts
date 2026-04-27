import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { getLojistaSession } from '@/app/actions/adminAuth';

// FASE 3: STORE STATUS DA MASTER STORE (OU TENANT ATIVO)

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'saiudelivery.com.br'

async function getActiveStore() {
  const headerList = await headers();
  const host = headerList.get('x-store-domain');

  // 🔒 C-01 equivalente: sem host → retorna null em vez de buscar o primeiro store do banco
  if (!host) return null;

  // Extrai slug para subdomínios da plataforma; mantém host inteiro para domínios customizados
  const slug = host.endsWith(`.${BASE_DOMAIN}`)
    ? host.replace(`.${BASE_DOMAIN}`, '')
    : host

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
      return NextResponse.json({ error: 'Tenant não identificado' }, { status: 401 })
    }
    return NextResponse.json({ isOpen: store.isOpen })
  } catch(e) {
    return NextResponse.json({ error: 'Erro DB' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const store = await getActiveStore();
    if (!store) {
      return NextResponse.json({ error: 'Tenant não identificado.' }, { status: 401 })
    }

    const session = await getLojistaSession(store.id);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: { isOpen: body.isOpen }
    })

    return NextResponse.json({ success: true, isOpen: updatedStore.isOpen })
  } catch(e) {
    return NextResponse.json({ error: 'Erro ao salvar status' }, { status: 500 })
  }
}
