'use client'

import { useState } from 'react'
import { cancelSubscription } from '@/app/actions/abacatepay'
import { Loader2, AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CancelSubscriptionButton({ storeId }: { storeId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCancel() {
    setIsLoading(true)
    setError('')

    const result = await cancelSubscription(storeId)
    
    if (result.success) {
      setIsOpen(false)
      router.refresh()
    } else {
      setError(result.error || 'Erro ao cancelar assinatura.')
      setIsLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-rose-50 text-rose-600 font-bold border border-rose-200 rounded-xl transition-colors"
      >
        Cancelar Assinatura
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 text-center tracking-tight mb-2">
              Deseja realmente cancelar?
            </h3>
            
            <p className="text-slate-500 font-medium text-center mb-8">
              Ao cancelar sua assinatura, o sistema inteiro da loja será desativado e o painel bloqueado para novas vendas e operações de caixa.
            </p>

            {error && (
              <p className="text-sm font-bold text-rose-500 text-center mb-6">{error}</p>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Cancelando...</> : 'Sim, quero cancelar'}
              </button>
              
              <button 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-slate-600 font-bold text-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Manter minha loja ativa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
