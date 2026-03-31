import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// O middleware.ts já garante que só admin autenticado chega aqui.
// Não precisamos mais verificar senha no body.

export async function GET(req: Request) {
  try {
    // Busca pedidos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
         createdAt: { gte: today },
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
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch(e) {
    console.error('[Admin Orders GET]', e);
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
     const { orderId, status } = await req.json();
     
     if (!orderId || !status) {
       return NextResponse.json({ error: 'orderId e status necessários' }, { status: 400 });
     }

     // Validar que status é um valor válido
     const VALID_STATUSES = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DISPATCHED', 'DELIVERED', 'CANCELED']
     if (!VALID_STATUSES.includes(status)) {
       return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
     }
     
     await prisma.order.update({ 
       where: { id: orderId }, 
       data: { status } 
     });
     
     return NextResponse.json({ success: true });
  } catch(e) {
     console.error('[Admin Orders PUT]', e);
     return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
