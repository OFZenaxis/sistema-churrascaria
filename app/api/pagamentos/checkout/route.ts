import { NextResponse } from 'next/server';

const PLANO_MENSAL_ID = 'prod_mpwpRhQnFKRd51QFFZFAb3K0';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    
    if (!apiKey) {
      console.error('ABACATEPAY_API_KEY não configurada.');
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

    // Define a URL base para o retorno após o pagamento
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const returnUrl = `${appUrl}/qg-admin`; // Redireciona para o painel após o pagamento

    const payload: any = {
      items: [
        {
          id: PLANO_MENSAL_ID,
          quantity: 1,
        },
      ],
      methods: ['CARD'], // Assinaturas na AbacatePay suportam apenas cartão
      returnUrl,
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
