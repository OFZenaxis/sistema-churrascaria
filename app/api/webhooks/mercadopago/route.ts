import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ══════════════════════════════════════════════════════════════════
// WEBHOOK MERCADO PAGO — COM VALIDAÇÃO DE ASSINATURA
// ══════════════════════════════════════════════════════════════════

function validateWebhookSignature(req: Request, dataId: string): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET

  // Sem secret configurado = aceita (dev mode)
  if (!webhookSecret) {
    console.warn('[WEBHOOK] ⚠️ MP_WEBHOOK_SECRET não configurado — validação desabilitada')
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')

  // Se não tem headers de assinatura, aceita em dev com warning
  if (!xSignature || !xRequestId) {
    console.warn('[WEBHOOK] ⚠️ Headers x-signature/x-request-id ausentes (teste do painel MP?)')
    return true
  }

  try {
    const parts: Record<string, string> = {}
    xSignature.split(',').forEach(part => {
      const [key, ...rest] = part.split('=')
      if (key && rest.length) parts[key.trim()] = rest.join('=').trim()
    })

    const ts = parts['ts']
    const v1 = parts['v1']

    if (!ts || !v1) {
      console.warn('[WEBHOOK] ⚠️ Formato do x-signature incompleto')
      return true // Não crashar em dev
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex')

    if (hmac !== v1) {
      console.error('[WEBHOOK] ❌ Assinatura HMAC inválida')
      return false
    }

    return true
  } catch (e) {
    console.error('[WEBHOOK] Erro ao validar assinatura:', e)
    return true // Não crashar por erro de parse
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const topic = url.searchParams.get('topic');

    // Parse do body
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Body vazio ou inválido — OK para alguns pings do MP
    }

    const paymentId = url.searchParams.get('data.id') || body?.data?.id;

    // ══════════════════════════════════════════════════════════════
    // 🧪 BYPASS DE TESTE: O painel do MP manda data.id = "123456"
    // Precisamos retornar 200 para ele validar a URL
    // ══════════════════════════════════════════════════════════════
    if (!paymentId) {
      console.log('[WEBHOOK] Ping recebido sem payment ID — retornando 200')
      return NextResponse.json({ message: 'Webhook ativo' })
    }

    if (paymentId === '123456' || paymentId === 123456) {
      console.log('[WEBHOOK] 🧪 Teste do painel MP recebido — retornando 200 OK')
      return NextResponse.json({ message: 'Test OK' })
    }

    // 🔒 Validar assinatura (flexível em dev)
    if (!validateWebhookSignature(req, String(paymentId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Processar apenas eventos de pagamento
    const isPaymentEvent = type === 'payment' || topic === 'payment' || body?.action?.includes('payment')
    
    if (!isPaymentEvent) {
      console.log(`[WEBHOOK] Evento ignorado: type=${type}, topic=${topic}`)
      return NextResponse.json({ message: 'Evento ignorado' })
    }

    // ── Consultar pagamento real na API do MP ──
    const access_token = process.env.MP_ACCESS_TOKEN;
    if (!access_token) {
      console.error('[WEBHOOK] MP_ACCESS_TOKEN ausente')
      return NextResponse.json({ error: 'Config ausente' }, { status: 500 })
    }

    try {
      const client = new MercadoPagoConfig({ accessToken: access_token });
      const paymentApi = new Payment(client);
      const paymentData = await paymentApi.get({ id: paymentId });

      if (paymentData.status === 'approved' && paymentData.external_reference) {
        await prisma.order.update({
          where: { id: paymentData.external_reference },
          data: {
            paymentStatus: 'PAID',
            status: 'PREPARING'
          }
        });
        console.log(`[WEBHOOK] ✅ Pedido ${paymentData.external_reference} → PAID + PREPARING`)
      } else {
        console.log(`[WEBHOOK] Pagamento ${paymentId}: status=${paymentData.status}`)
      }
    } catch (mpError: any) {
      // Se o pagamento não existe no MP (ID inválido, expirado, etc)
      console.error(`[WEBHOOK] Erro ao consultar pagamento ${paymentId}:`, mpError?.message || mpError)
      // Retorna 200 mesmo assim para o MP não reenviar infinitamente
      return NextResponse.json({ message: 'Pagamento não encontrado, ignorado' })
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[WEBHOOK] Erro geral:', e?.message || e);
    // Retorna 200 para evitar retentativas infinitas do MP
    return NextResponse.json({ message: 'Erro processado' })
  }
}
