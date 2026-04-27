'use client'

import { useState } from 'react'
import { Loader2, ArrowRight, Lock } from 'lucide-react'

export function PaymentButton({ storeId }: { storeId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePayment() {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pagamentos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })
      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Erro ao gerar link de pagamento.')
        setIsLoading(false)
      }
    } catch (err) {
      setError('Erro de conexão ao gerar pagamento.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all px-8 py-4 rounded-xl text-white font-black text-lg shadow-lg shadow-emerald-500/25 w-full max-w-sm"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Gerando link...</>
        ) : (
          <><Lock className="w-5 h-5" /> Realizar Pagamento <ArrowRight className="w-5 h-5 ml-1" /></>
        )}
      </button>

      {error && (
        <p className="text-rose-500 text-sm font-bold mt-4">{error}</p>
      )}
    </div>
  )
}
