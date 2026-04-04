"use client"
import React, { useEffect } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { useRouter } from 'next/navigation'

export default function PaymentClient({ orderId, slug, amount, pubKey, method, customerEmail }: { orderId: string, slug: string, amount: number, pubKey: string, method?: string, customerEmail: string }) {
  const router = useRouter()

  useEffect(() => {
    if (pubKey) {
      initMercadoPago(pubKey, { locale: 'pt-BR' });
    }
  }, [pubKey])

  if (!pubKey) {
    return <p className="text-red-500">Credenciais Mercado Pago não configuradas no ambiente local.</p>
  }

  const initialization = {
    amount: Number(Number(amount).toFixed(2)),
    preferenceId: undefined,
    payer: {
      email: customerEmail
    }
  };

  const customization = {
    paymentMethods: {
      ...(method === 'PIX' ? { pix: 'all' as any } : {}),
      ...(method === 'CARD_ONLINE' ? { creditCard: 'all' as any } : {}),
      ...(!method ? { pix: 'all' as any, creditCard: 'all' as any } : {})
    },
    visual: {
      style: {
        theme: 'dark' as any,
        customVariables: {
          baseColor: '#E31C1C',
        }
      }
    }
  } as any;

  const onSubmit = async (param: any) => {
    return new Promise((resolve, reject) => {
      fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...param, orderId }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'approved' || data.status === 'in_process' || data.status === 'pending') {
          resolve(data)
          // Se gerou Pix "pending" ou cartão "approved", manda pra tela de acompanhamento
          router.push(`/${slug}/pedido/${orderId}`)
        } else {
          reject(data)
        }
      })
      .catch((error) => {
        reject(error)
      });
    });
  };

  const onError = async (error: any) => {
    console.error('[PaymentClient] erro no brick MP:', error)
  };

  const onReady = async () => {
    // Esconder skeleton ou loaders se houver
  };

  return (
    <div className="w-full">
       <Payment
         initialization={initialization}
         customization={customization}
         onSubmit={onSubmit}
         onReady={onReady}
         onError={onError}
       />
    </div>
  )
}
