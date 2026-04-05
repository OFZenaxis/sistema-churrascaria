'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Flame, ArrowRight, Loader2, XCircle } from 'lucide-react'
import { findStoreByEmail } from '@/app/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await findStoreByEmail(email)
      // Se chegou aqui, houve erro (redirect bem-sucedido não retorna)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-5">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-white fill-white" strokeWidth={1.5} />
          </div>
          <span className="text-slate-900 font-black text-xl tracking-tight">
            Saiu<span className="text-rose-600">Delivery</span>
          </span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Acessar minha loja
          </h1>
          <p className="text-slate-500 font-medium text-sm mb-8">
            Digite o e-mail cadastrado e te direcionamos para o painel da sua loja.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                E-mail cadastrado
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => { setError(''); setEmail(e.target.value) }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm transition-colors placeholder:text-slate-300"
                placeholder="dono@restaurante.com"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !email}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all py-3.5 rounded-xl text-white font-black text-sm shadow-md shadow-rose-600/30"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Buscando sua loja...</>
              ) : (
                <>Encontrar minha loja <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs font-medium mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-rose-600 font-bold hover:text-rose-700 transition-colors">
            Criar minha loja grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
