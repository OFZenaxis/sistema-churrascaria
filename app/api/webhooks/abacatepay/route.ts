import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-abacatepay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 });
    }

    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('ABACATEPAY_WEBHOOK_SECRET não configurada');
      return NextResponse.json({ error: 'Secret não configurado no servidor' }, { status: 500 });
    }

    const bodyText = await req.text();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    if (!event || !data) {
      return NextResponse.json({ error: 'Payload malformado' }, { status: 400 });
    }

    // Procura o storeId injetado no metadata durante a criação do checkout
    const storeId = data?.metadata?.storeId || data?.customer?.metadata?.storeId;

    if (!storeId) {
      // Retornamos 200 para a AbacatePay parar de tentar enviar, 
      // mas logamos que não encontramos a loja correspondente.
      console.warn('Webhook recebido sem storeId no metadata', payload);
      return NextResponse.json({ success: true, warning: 'Sem storeId associado' });
    }

    if (event === 'subscription.completed' || event === 'checkout.completed') {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          subscriptionStatus: 'ACTIVE',
          abacatepaySubscriptionId: data?.id || null, // salva o ID para gerenciar a assinatura
        }
      });
      console.log(`Loja ${storeId} ativada via Webhook da AbacatePay!`);
    } else if (event === 'subscription.cancelled') {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          subscriptionStatus: 'CANCELED'
        }
      });
      console.log(`Assinatura da loja ${storeId} foi cancelada via Webhook.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no processamento do Webhook da AbacatePay:', error);
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 });
  }
}
