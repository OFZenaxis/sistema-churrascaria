import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Fail-fast: chave HMAC obrigatória — sem ela qualquer payload forjado passaria a validação
if (!process.env.ABACATEPAY_HMAC_KEY) {
  throw new Error(
    '[FATAL] ABACATEPAY_HMAC_KEY não definida — assinaturas de webhook AbacatePay não podem ser verificadas.'
  );
}

function getHmacKey(): string {
  // Garantido pelo boot guard acima — cast seguro
  return process.env.ABACATEPAY_HMAC_KEY as string;
}

export function verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
  const bodyBuffer = Buffer.from(rawBody, 'utf8');
  const expectedSig = crypto
    .createHmac('sha256', getHmacKey())
    .update(bodyBuffer)
    .digest('base64');
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
      logger.error('webhook-abacatepay', 'ABACATEPAY_WEBHOOK_SECRET não configurada');
      return NextResponse.json({ error: 'Configuração inválida no servidor' }, { status: 500 });
    }

    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validação da Assinatura HMAC no Cabeçalho
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Assinatura ausente' }, { status: 401 });
    }

    const rawBody = await req.text();
    if (!verifyAbacateSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // Passou pela dupla validação — processa o evento
    const payload = JSON.parse(rawBody) as { event?: string; data?: Record<string, unknown> };
    const event = payload.event;
    const data = payload.data as Record<string, unknown> | undefined;

    if (!event || !data) {
      return NextResponse.json({ error: 'Payload malformado' }, { status: 400 });
    }

    // Extrai storeId do metadata injetado durante a criação do checkout
    let storeId: string | null = null;
    if (event === 'checkout.completed') {
      storeId = (data as { checkout?: { metadata?: { storeId?: string } } })?.checkout?.metadata?.storeId ?? null;
    } else if (
      event === 'subscription.completed' ||
      event === 'subscription.cancelled' ||
      event === 'subscription.renewed'
    ) {
      const d = data as {
        subscription?: { metadata?: { storeId?: string } };
        checkout?: { metadata?: { storeId?: string } };
      };
      storeId = d?.subscription?.metadata?.storeId ?? d?.checkout?.metadata?.storeId ?? null;
    }

    if (!storeId) {
      logger.warn('webhook-abacatepay', `Evento "${event}" recebido sem storeId no metadata`);
      return NextResponse.json({ success: true, warning: 'Sem storeId associado' });
    }

    // Ativa loja: primeiro pagamento de assinatura ou renovação bem-sucedida
    if (event === 'subscription.completed' || event === 'subscription.renewed') {
      const subId = (data as { subscription?: { id?: string } })?.subscription?.id ?? null;
      await prisma.store.update({
        where: { id: storeId },
        data: {
          subscriptionStatus: 'ACTIVE',
          // Salva o subscriptionId apenas de eventos de assinatura — checkout.id não serve para cancelar
          ...(subId ? { abacatepaySubscriptionId: subId } : {}),
        },
      });
    } else if (event === 'checkout.completed') {
      // checkout.completed pode disparar junto com subscription.completed no primeiro pagamento
      // Não sobrescrevemos abacatepaySubscriptionId aqui — subscription.completed tem o ID correto
      await prisma.store.update({
        where: { id: storeId },
        data: { subscriptionStatus: 'ACTIVE' },
      });
    } else if (event === 'subscription.cancelled') {
      await prisma.store.update({
        where: { id: storeId },
        data: { subscriptionStatus: 'CANCELED' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('webhook-abacatepay', 'Erro no processamento do webhook', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
