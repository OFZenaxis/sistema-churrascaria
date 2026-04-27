import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ABACATEPAY_PUBLIC_KEY = "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export function verifyAbacateSignature(rawBody: string, signatureFromHeader: string) {
  const bodyBuffer = Buffer.from(rawBody, "utf8");
  const expectedSig = crypto
    .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest("base64");
  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validação do Webhook Secret na Query String
    const receivedSecret = req.nextUrl.searchParams.get('webhookSecret');
    const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('ABACATEPAY_WEBHOOK_SECRET não configurada');
      return NextResponse.json({ error: 'Secret não configurado no servidor' }, { status: 500 });
    }

    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Não autorizado (Secret inválido)' }, { status: 401 });
    }

    // 2. Validação da Assinatura HMAC no Cabeçalho
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Assinatura HMAC ausente' }, { status: 401 });
    }

    const rawBody = await req.text();
    if (!verifyAbacateSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Assinatura HMAC inválida' }, { status: 401 });
    }

    // Passou pela dupla validação, prossegue normalmente
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (!event || !data) {
      return NextResponse.json({ error: 'Payload malformado' }, { status: 400 });
    }

    // Procura o storeId injetado no metadata durante a criação do checkout
    let storeId = null;
    if (event === 'checkout.completed') {
      storeId = data?.checkout?.metadata?.storeId;
    } else if (event === 'subscription.completed' || event === 'subscription.cancelled') {
      storeId = data?.subscription?.metadata?.storeId || data?.checkout?.metadata?.storeId;
    }

    console.log('Store ID extraído: ', storeId);

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
          abacatepaySubscriptionId: data?.subscription?.id || data?.checkout?.id || null, // salva o ID para gerenciar a assinatura
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
