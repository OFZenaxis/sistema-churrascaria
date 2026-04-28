import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface AbacateCheckoutPayload {
  items: Array<{ id: string; quantity: number }>
  methods: string[]
  returnUrl: string
  completionUrl: string
  metadata?: Record<string, string>
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    const productId = process.env.ABACATEPAY_PRODUCT_ID;

    if (!apiKey || !productId) {
      logger.error('pagamentos/checkout', 'ABACATEPAY_API_KEY ou ABACATEPAY_PRODUCT_ID não configuradas');
      return NextResponse.json(
        { success: false, error: 'Erro interno de configuração do servidor.' },
        { status: 500 }
      );
    }

    let body: { storeId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body ausente ou inválido — prossegue sem storeId
    }

    const { storeId } = body;

    // Busca a loja para montar a URL de retorno do tenant dinamicamente
    let storeSlug: string | null = null;
    if (storeId) {
      const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
      if (store) storeSlug = store.slug;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'saiudelivery.com.br';
    const protocol = appUrl.includes('localhost') ? 'http://' : 'https://';

    const redirectUrl = storeSlug
      ? `${protocol}${storeSlug}.${baseDomain}/admin`
      : `${appUrl}/admin/login`;

    const payload: AbacateCheckoutPayload = {
      items: [{ id: productId, quantity: 1 }],
      methods: ['CARD'], // Assinaturas AbacatePay suportam apenas cartão
      returnUrl: redirectUrl,
      completionUrl: redirectUrl,
      ...(storeId ? { metadata: { storeId } } : {}),
    };

    const response = await fetch('https://api.abacatepay.com/v2/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as { success: boolean; data?: { url?: string }; error?: string };

    if (!response.ok || !data.success) {
      logger.error('pagamentos/checkout', 'Erro retornado pela AbacatePay ao criar checkout');
      return NextResponse.json(
        { success: false, error: data.error || 'Falha ao criar o checkout de assinatura.' },
        { status: response.status >= 400 ? response.status : 400 }
      );
    }

    return NextResponse.json({ success: true, url: data.data?.url });

  } catch (error) {
    logger.error('pagamentos/checkout', 'Exceção não tratada na rota', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar a requisição.' },
      { status: 500 }
    );
  }
}
