"use client"

import React, { useState } from 'react'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { loginLojista } from '@/app/actions/adminAuth'
import { useParams } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = email.trim().length > 0 && password.length >= 6

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isLoading) return
    setIsLoading(true)
    setError('')

    const res = await loginLojista(email, password, slug)
    setIsLoading(false)

    if (res.success) {
      window.location.href = '/admin'
    } else {
      setError(res.error || 'Credenciais inválidas. Tente novamente.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Marca */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo-full.png"
            alt="Saiu Delivery"
            width={200}
            height={56}
            priority
            className="w-48 h-auto mx-auto mb-6 object-contain"
          />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel do Lojista</h1>
          <p className="text-slate-500 text-sm mt-1">Entre com suas credenciais para continuar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

          {/* Banner de erro */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* E-mail */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white font-black text-sm py-3.5 rounded-xl shadow-md shadow-emerald-500/20 mt-2"
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Entrar <ArrowRight className="w-4 h-4" /></>
              }
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Saiu Delivery · Painel Administrativo
        </p>
      </div>
    </div>
  )
}
