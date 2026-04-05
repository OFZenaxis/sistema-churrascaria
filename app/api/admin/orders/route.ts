import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// FASE 3: PEDIDOS MULTI-TENANT COM MIDDLEWARE INJECTS

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'saiudelivery.com.br'

async function getActiveStore() {
  const headerList = await headers();
  const host = headerList.get('x-store-domain');

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
      return NextResponse.json({ error: 'Tenant não identificado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    // BUG-013: paginação cursor-based — evita timeout em lojas de alto volume
    const cursor = searchParams.get('cursor') ?? undefined;
    const PAGE_SIZE = 50;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
         createdAt: { gte: today },
         storeId: store.id
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const nextCursor = orders.length === PAGE_SIZE ? orders[orders.length - 1].id : null;

    return NextResponse.json({ orders, nextCursor });
  } catch(e) {
    console.error('[Admin Orders GET]', e instanceof Error ? e.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
     const { orderId, status } = await req.json();
     
     if (!orderId || !status) {
       return NextResponse.json({ error: 'orderId e status necessários' }, { status: 400 });
     }

     const VALID_STATUSES = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DISPATCHED', 'DELIVERED', 'CANCELED']
     if (!VALID_STATUSES.includes(status)) {
       return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
     }
     
     // 🔒 Segurança: Mesmo na atualização de status, garantimos que não vaze tenant
     const store = await getActiveStore();

     if (!store) {
       return NextResponse.json({ error: 'SaaS Desconfigurado' }, { status: 500 });
     }

     await prisma.order.update({ 
       where: { id: orderId, storeId: store.id }, 
       data: { status } 
     });
     
     return NextResponse.json({ success: true });
  } catch(e) {
     console.error('[Admin Orders PUT]', e instanceof Error ? e.message : 'Erro desconhecido');
     return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
