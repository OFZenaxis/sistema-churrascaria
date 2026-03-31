"use client"
import React, { useEffect } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { useRouter } from 'next/navigation'

export default function PaymentClient({ orderId, amount, pubKey, method }: { orderId: string, amount: number, pubKey: string, method?: string }) {
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
    amount,
    preferenceId: undefined,
    payer: {
      email: "cliente@churras.com" // Necessário para o Brick não falhar na exibição do PIX
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
          router.push(`/pedido/${orderId}`)
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
    console.log(error);
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
