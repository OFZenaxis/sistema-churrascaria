import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

interface MercadoPagoPaymentPayload {
  transaction_amount: number
  payment_method_id: string
  description: string
  payer: {
    email: string
    identification?: { type: string; number: string }
  }
  external_reference: string
  notification_url?: string
  // Campos exclusivos de cartão de crédito
  token?: string
  installments?: number
  issuer_id?: number
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ══════════════════════════════════════════════════════════════
    // Extração de dados (Checkout Transparente envia formData)
    // ══════════════════════════════════════════════════════════════
    const orderId = body.orderId;
    const formData = body.formData || body;

    const {
      token,
      issuer_id,
      payment_method_id,
      installments,
      payer,
    } = formData;

    // ── Validação Inicial ──
    if (!orderId) {
      return NextResponse.json({ error: 'orderId é obrigatório' }, { status: 400 });
    }

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Método de pagamento não informado' }, { status: 400 });
    }

    // 🔒 Buscar pedido real do banco incluindo a configuração de pagamento da Loja
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          include: { paymentConfig: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'approved') {
      return NextResponse.json({ error: 'Pedido já foi pago' }, { status: 400 });
    }

    const transaction_amount = Number(Number(order.totalAmount).toFixed(2));
    if (!transaction_amount || transaction_amount <= 0) {
      return NextResponse.json({ error: 'Valor do pedido inválido' }, { status: 400 });
    }

    // ── Resgatar o Acess Token específico do Tenant (Loja) ──
    const access_token = order.store.paymentConfig?.mpAccessToken;
    if (!access_token) {
      console.error('[payments] MP Access Token ausente para storeId:', order.storeId);
      return NextResponse.json({ error: 'Esta loja não configurou pagamentos ainda.' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: access_token, options: { timeout: 5000 } });
    const payment = new Payment(client);

    // ── Preparar URL de Webhook (só inclui em produção — MP rejeita localhost) ──
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const notification_url =
      baseUrl?.startsWith('https://')
        ? `${baseUrl}/api/webhooks/mercadopago?storeId=${order.storeId}`
        : undefined;

    // ══════════════════════════════════════════════════════════════
    // Montar payload dinâmico (Cartão vs Pix)
    // ══════════════════════════════════════════════════════════════
    const paymentBody: MercadoPagoPaymentPayload = {
      transaction_amount,
      payment_method_id,
      description: `Pedido #${order.id.split('-')[0].toUpperCase()} - ${order.store.name}`,
      payer: {
        email: payer?.email || `${(order.customerPhone ?? '').replace(/\D/g, '')}@saiu.delivery`,
        identification: payer?.identification || undefined,
      },
      external_reference: orderId,
      ...(notification_url && { notification_url }),
    };

    // Cartão de crédito: precisa de token, issuer e parcelas
    if (token) {
      paymentBody.token = token;
      paymentBody.installments = installments || 1;
      paymentBody.issuer_id = issuer_id ? Number(issuer_id) : undefined;
    }

    // Criar requisição MP
    const mpRes = await payment.create({ body: paymentBody });

    // Atualizar Status inicial (pending)
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: mpRes.status }
    });

    return NextResponse.json({ 
      status: mpRes.status, 
      status_detail: mpRes.status_detail, 
      id: mpRes.id,
      qr_code: payment_method_id === 'pix' ? mpRes.point_of_interaction?.transaction_data?.qr_code : undefined,
      qr_code_base64: payment_method_id === 'pix' ? mpRes.point_of_interaction?.transaction_data?.qr_code_base64 : undefined,
    });
  } catch (err: any) {
    console.error('[payments] Erro:', err instanceof Error ? err.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Falha no processamento. Tente novamente.' }, { status: 500 });
  }
}
