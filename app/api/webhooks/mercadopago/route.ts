import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

// ══════════════════════════════════════════════════════════════════
// WEBHOOK MERCADO PAGO — MULTI-TENANT (DEDICADO À CONSULTA DIRETA)
// ══════════════════════════════════════════════════════════════════

/** Tipo mínimo do body de notificação do Mercado Pago. BUG-010. */
type MercadoPagoWebhookBody = {
  data?: { id?: string }
  action?: string
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const topic = url.searchParams.get('topic');

    // ── Resgatar a Identificação do Tenant Responsável da Loja ──
    const storeId = url.searchParams.get('storeId');

    // Parse do body payload
    let body: MercadoPagoWebhookBody = {};
    try {
      body = await req.json();
    } catch (err) {
      // Se paymentId vier na URL (pings de teste do MP), continua normalmente.
      // Se não houver paymentId em lugar nenhum, o guard !paymentId abaixo devolve 200 (ping bypass).
      // Mas se o body está genuinamente corrompido, logamos para rastreabilidade.
      console.error('[WEBHOOK] Erro no payload do Webhook MP:', err);
      if (!url.searchParams.get('data.id')) {
        return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
      }
    }

    const paymentId = url.searchParams.get('data.id') || body?.data?.id;

    // ══════════════════════════════════════════════════════════════
    // PING BYPASS: O painel do MP manda data.id="123456" para testar
    // (Também aceitar pings de conexão sem dados de pagamento)
    // ══════════════════════════════════════════════════════════════
    if (!paymentId) {
      console.log(`[WEBHOOK] Ping ativo no sistema. Retornando 200 OK.`);
      return NextResponse.json({ message: 'Webhook Recebido com sucesso.' });
    }

    if (String(paymentId) === '123456') {
      console.log('[WEBHOOK] 🧪 Teste simulado do Painel do MP recebido — retornando 200 OK');
      return NextResponse.json({ message: 'Conexão Teste OK' });
    }

    // ══════════════════════════════════════════════════════════════
    // 🔒 VALIDAÇÃO DE ASSINATURA x-signature (BUG-002)
    // Garante que o webhook veio realmente do Mercado Pago.
    // Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    // ══════════════════════════════════════════════════════════════
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[WEBHOOK] ⛔ MP_WEBHOOK_SECRET não configurado — rejeitando requisição.');
      return NextResponse.json({ error: 'Configuração de segurança ausente' }, { status: 500 });
    }

    const xSignature = req.headers.get('x-signature') ?? '';
    const xRequestId = req.headers.get('x-request-id') ?? '';

    if (!xSignature) {
      console.error('[WEBHOOK] ⛔ Header x-signature ausente — possível request forjado.');
      return NextResponse.json({ error: 'Assinatura ausente' }, { status: 401 });
    }

    // Formato do header: "ts=<timestamp>,v1=<hash_hex>"
    const tsMatch = xSignature.match(/ts=(\d+)/);
    const v1Match = xSignature.match(/v1=([a-f0-9]+)/);

    if (!tsMatch || !v1Match) {
      console.error('[WEBHOOK] ⛔ Formato inválido do header x-signature.');
      return NextResponse.json({ error: 'Formato de assinatura inválido' }, { status: 401 });
    }

    const ts = tsMatch[1];
    const v1 = v1Match[1];

    // String de manifesto conforme documentação oficial do MP
    const dataIdForSig = url.searchParams.get('data.id') ?? '';
    const manifest = `id:${dataIdForSig};request-id:${xRequestId};ts:${ts};`;

    const expectedHash = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
    const expectedBuf = Buffer.from(expectedHash, 'utf8');
    const receivedBuf = Buffer.from(v1, 'utf8');

    // timingSafeEqual exige buffers de mesmo tamanho; tamanhos diferentes = assinatura inválida
    const sigValid =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    if (!sigValid) {
      console.error('[WEBHOOK] ⛔ Assinatura x-signature inválida — request rejeitado.');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }
    // ── Fim da validação de assinatura ──────────────────────────────

    // Processar apenas eventos focados em status de pagamentos
    const isPaymentEvent = type === 'payment' || topic === 'payment' || body?.action?.includes('payment');
    
    if (!isPaymentEvent) {
      console.log(`[WEBHOOK] Ignorado: evento não reflete um PIX/Cartão → type=${type}, topic=${topic}`);
      return NextResponse.json({ message: 'Evento ignorado' });
    }

    // ── Se houver pagamento de verdade, A Loja dona desta notificação DEVE existir ──
    if (!storeId) {
      console.warn(`[WEBHOOK] Pagamento ${paymentId} ignorado pois falta query ?storeId na URL`);
      return NextResponse.json({ message: 'Requerente Multi-tenant inválido' }, { status: 400 });
    }

    // Buscar credenciais da API específica da Loja
    const storeData = await prisma.store.findUnique({
      where: { id: storeId },
      include: { paymentConfig: true },
    });

    const access_token = storeData?.paymentConfig?.mpAccessToken;

    if (!access_token) {
      console.error(`[WEBHOOK] Falha crítica - Loja ${storeId} não possui Acesso Token MP Ativo, webhook perdido.`);
      return NextResponse.json({ message: 'Credencial ausente no db' }, { status: 500 });
    }

    // ── Validação por Consulta Ativa ──
    // Usamos o SDK logado apenas com o token do respectivo Tenant
    try {
      const client = new MercadoPagoConfig({ accessToken: access_token });
      const paymentApi = new Payment(client);
      const paymentData = await paymentApi.get({ id: paymentId });

      // Verificamos a referência e se a confirmação "approved" veio direto dos cofres do MP
      if (paymentData.status === 'approved' && paymentData.external_reference) {
        
        // Garante que o pedido validado realmente pertence à Loja requisitada
        const relatedOrder = await prisma.order.findUnique({
          where: { id: paymentData.external_reference },
          select: { storeId: true }
        });

        if (relatedOrder?.storeId === storeId) {
          await prisma.order.update({
            where: { id: paymentData.external_reference },
            data: {
              paymentStatus: 'PAID',
              status: 'PREPARING'
            }
          });
          console.log(`[WEBHOOK | LOJA: ${storeData.name}] ✅ Pedido ${paymentData.external_reference} Pago e Em Preparo!`);
        } else {
          console.error(`[WEBHOOK | FRAUDE EVITADA] Pedido ${paymentData.external_reference} processado num MP de loja diferente!`);
        }
      } else {
        console.log(`[WEBHOOK] Pagamento ID: ${paymentId} / Status atual: ${paymentData.status}`);
      }
    } catch (mpError: unknown) {
      console.error(`[WEBHOOK] Erro ao consultar pagamento diretamente na API MP: ${paymentId}:`, mpError instanceof Error ? mpError.message : 'Erro desconhecido');
      return NextResponse.json({ message: 'Pagamento fantasma ou não processável pelo Mercado Pago' });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('[WEBHOOK] Erro Sistêmico Geral:', e instanceof Error ? e.message : 'Erro desconhecido');
    // Retornar código de sucesso MP para barrar envios infinitos dele em caso de erro local crítico
    return NextResponse.json({ message: 'Erro contornável do servidor processado e abafado.' });
  }
}
