import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    const productId = process.env.ABACATEPAY_PRODUCT_ID;
    
    if (!apiKey || !productId) {
      console.error('Variáveis ABACATEPAY_API_KEY ou ABACATEPAY_PRODUCT_ID não configuradas.');
      return NextResponse.json(
        { success: false, error: 'Erro interno de configuração do servidor.' },
        { status: 500 }
      );
    }

    // Tenta capturar o storeId do body (se enviado pelo frontend)
    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    
    const { storeId } = body;

    // Busca a loja para montar a URL do tenant dinamicamente
    let storeSlug = null;
    if (storeId) {
      const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
      if (store) {
        storeSlug = store.slug;
      }
    }

    // Define a URL base para o retorno após o pagamento
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'saiudelivery.com.br';
    const isLocalhost = appUrl.includes('localhost');
    const protocol = isLocalhost ? 'http://' : 'https://';
    
    // Monta a URL de redirecionamento para o dashboard do lojista
    const redirectUrl = storeSlug 
      ? `${protocol}${storeSlug}.${baseDomain}/admin` 
      : `${appUrl}/admin/login`;

    const payload: any = {
      items: [
        {
          id: productId,
          quantity: 1,
        },
      ],
      methods: ['CARD'], // Assinaturas na AbacatePay suportam apenas cartão
      returnUrl: redirectUrl,      // Link para o cliente voltar caso cancele
      completionUrl: redirectUrl,  // Auto-redirect ao finalizar o pagamento com sucesso
    };

    if (storeId) {
      payload.metadata = { storeId };
    }

    const response = await fetch('https://api.abacatepay.com/v2/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Erro retornado pela API da AbacatePay:', data.error || data);
      return NextResponse.json(
        { success: false, error: data.error || 'Falha ao criar o checkout de assinatura.' },
        { status: response.status >= 400 ? response.status : 400 }
      );
    }

    // Retorna a URL de checkout extraída do envelope da AbacatePay
    return NextResponse.json({ 
      success: true, 
      url: data.data.url 
    });

  } catch (error) {
    console.error('Erro na rota /api/pagamentos/checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar a requisição.' },
      { status: 500 }
    );
  }
}
