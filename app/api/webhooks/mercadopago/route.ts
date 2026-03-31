import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ══════════════════════════════════════════════════════════════════
// WEBHOOK MERCADO PAGO — COM VALIDAÇÃO DE ASSINATURA
// ══════════════════════════════════════════════════════════════════

function validateWebhookSignature(req: Request, body: string): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET
  
  // Se não tem secret configurado, aceita em dev (mas loga warning)
  if (!webhookSecret) {
    console.warn('[WEBHOOK] ⚠️ MP_WEBHOOK_SECRET não configurado — validação de assinatura desabilitada')
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')

  if (!xSignature || !xRequestId) {
    console.error('[WEBHOOK] ❌ Headers x-signature ou x-request-id ausentes')
    return false
  }

  // Extrair ts e v1 do header x-signature
  // Formato: "ts=TIMESTAMP,v1=HASH"
  const parts: Record<string, string> = {}
  xSignature.split(',').forEach(part => {
    const [key, value] = part.split('=')
    if (key && value) parts[key.trim()] = value.trim()
  })

  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) {
    console.error('[WEBHOOK] ❌ Formato do x-signature inválido')
    return false
  }

  // Extrair data.id da URL query params
  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id') || ''

  // Template do MP: "id:[data.id];request-id:[x-request-id];ts:[ts];"
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  
  const hmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(manifest)
    .digest('hex')

  if (hmac !== v1) {
    console.error('[WEBHOOK] ❌ Assinatura HMAC inválida — possível ataque')
    return false
  }

  return true
}

export async function POST(req: Request) {
  try {
    // Ler body como texto primeiro (para validação) 
    const rawBody = await req.text()
    
    // 🔒 Validar assinatura do Mercado Pago
    if (!validateWebhookSignature(req, rawBody)) {
      return NextResponse.json({ error: 'Forbidden: Invalid signature' }, { status: 403 })
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const topic = url.searchParams.get('topic');

    // Parse do body
    let body: any = {}
    try { body = JSON.parse(rawBody) } catch { /* empty body is ok */ }
    
    const paymentId = url.searchParams.get('data.id') || body?.data?.id;

    if (paymentId && (type === 'payment' || topic === 'payment' || body?.action?.includes('payment'))) {
      const access_token = process.env.MP_ACCESS_TOKEN;
      if (!access_token) throw new Error('MP Token Missing');

      const client = new MercadoPagoConfig({ accessToken: access_token });
      const paymentApi = new Payment(client);
      const paymentData = await paymentApi.get({ id: paymentId });

      // Se foi aprovado e tem referência cruzada conosco
      if (paymentData.status === 'approved' && paymentData.external_reference) {
        await prisma.order.update({
          where: { id: paymentData.external_reference },
          data: { 
            paymentStatus: 'PAID',
            status: 'PREPARING'
          }
        });
        console.log(`[WEBHOOK] ✅ Order ${paymentData.external_reference} marcada como PAID!`);
      }
    }

    return NextResponse.json({ success: true });
  } catch(e) {
    console.error('[WEBHOOK ERROR]', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
