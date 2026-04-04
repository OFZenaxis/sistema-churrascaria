import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyPayload } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true, storeId: true }
    });

    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    const cookieStore = await cookies();

    // 🔒 Verifica cookie de lojista isolado por tenant
    const lojistaRaw = cookieStore.get(`lojista_token_${order.storeId}`)?.value
    if (lojistaRaw) {
      const payload = verifyPayload(lojistaRaw)
      if (payload) {
        const parts = payload.split('|')
        if (parts.length === 3 && parts[1] === order.storeId) {
          return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus })
        }
      }
    }

    // 🔒 Verifica cookie de cliente isolado por tenant
    const sessionRaw = cookieStore.get(`session_token_${order.storeId}`)?.value
    if (sessionRaw) {
      const payload = verifyPayload(sessionRaw)
      if (payload) {
        const [cookieStoreId] = payload.split('|')
        if (cookieStoreId === order.storeId) {
          return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus })
        }
      }
    }

    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
