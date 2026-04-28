'use client'

import { useState, useTransition } from 'react'
import { Loader2, Lock } from 'lucide-react'
import Image from 'next/image'
import { loginQGAdmin } from '@/app/actions/qg-auth'

export default function QGLoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await loginQGAdmin(pin)
      if (result?.error) {
        setError(result.error)
        setPin('')
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <Image src="/logo-full.png" alt="Saiu Delivery" width={200} height={56} className="h-10 w-auto filter brightness-0 invert" priority />
        </div>
        
        <div className="text-center mb-8">
          <p className="text-slate-500 text-sm font-medium mt-1">Acesso restrito. Insira o PIN de operação.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="password"
              autoFocus
              required
              value={pin}
              onChange={e => { setError(''); setPin(e.target.value) }}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-4 text-white font-black tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-rose-600/40 focus:border-rose-600/60 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-600 transition-all"
            />
          </div>

          {error && (
            <p className="text-center text-rose-500 text-sm font-bold">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !pin}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all py-4 rounded-xl text-white font-black text-sm shadow-lg shadow-rose-600/20"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Autenticando...</>
            ) : (
              <>Autorizar Acesso</>
            )}
          </button>
        </form>

        <p className="text-center text-slate-700 text-xs font-medium mt-8">
          Saiu Delivery · Sistema Interno · v2
        </p>
      </div>
    </div>
  )
}
