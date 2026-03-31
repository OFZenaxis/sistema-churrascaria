import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ══════════════════════════════════════════════════════════════
    // O Payment Brick envia: { formData: { token, payment_method_id, ... }, orderId }
    // Precisamos extrair de formData, não do root do body
    // ══════════════════════════════════════════════════════════════
    const orderId = body.orderId;
    const formData = body.formData || body; // fallback se vier flat

    const {
      token,
      issuer_id,
      payment_method_id,
      installments,
      payer,
    } = formData;

    // ── Validação ──
    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Método de pagamento não informado' }, { status: 400 });
    }

    const access_token = process.env.MP_ACCESS_TOKEN;
    if (!access_token) {
      console.error('MP Access Token ausente.');
      return NextResponse.json({ error: 'Configuração MP ausente' }, { status: 500 });
    }

    // 🔒 Buscar valor REAL do banco
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, totalAmount: true, customerName: true, paymentStatus: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'approved') {
      return NextResponse.json({ error: 'Pedido já foi pago' }, { status: 400 });
    }

    const transaction_amount = Number(order.totalAmount);
    if (!transaction_amount || transaction_amount <= 0) {
      return NextResponse.json({ error: 'Valor do pedido inválido' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken: access_token, options: { timeout: 5000 } });
    const payment = new Payment(client);

    // ══════════════════════════════════════════════════════════════
    // Montar payload dinâmico: Cartão precisa de token, Pix não
    // ══════════════════════════════════════════════════════════════
    const paymentBody: any = {
      transaction_amount,
      payment_method_id,
      description: `Costa e Souza - Pedido #${order.id.split('-')[0].toUpperCase()}`,
      payer: {
        email: payer?.email || 'cliente@costaesouza.com.br',
        identification: payer?.identification || undefined,
      },
      external_reference: orderId,
    };

    // Cartão de crédito: precisa de token, issuer e parcelas
    if (token) {
      paymentBody.token = token;
      paymentBody.installments = installments || 1;
      paymentBody.issuer_id = issuer_id;
    }

    const mpRes = await payment.create({ body: paymentBody });

    // Salvar status inicial
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: mpRes.status }
    });

    return NextResponse.json({ 
      status: mpRes.status, 
      status_detail: mpRes.status_detail, 
      id: mpRes.id 
    });
  } catch (err: any) {
    console.error('Payment Error:', err?.message || err);
    return NextResponse.json({ error: 'Falha no pagamento. Tente novamente.' }, { status: 500 });
  }
}
