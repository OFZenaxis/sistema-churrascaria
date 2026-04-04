"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { loginLojista } from '@/app/actions/adminAuth'
import { useRouter, useParams } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const res = await loginLojista(email, password, slug)
    setIsLoading(false)

    if (res.success) {
      router.push(`/${slug}/admin`)
      router.refresh()
    } else {
      setError(res.error || 'Erro desconhecido')
      setPassword('')
    }
  }

  const canSubmit = email.trim().length > 0 && password.length >= 8

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-white px-2">Acesso Restrito</h1>
          <p className="text-zinc-500 font-medium text-sm mt-2">Entre com as credenciais da sua loja</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-4">
          <div>
            <label className="block text-zinc-400 font-bold mb-2 text-sm ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full bg-[#151515] border border-zinc-800 text-white rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 font-bold mb-2 text-sm ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-[#151515] border border-zinc-800 text-white rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-emerald-500 transition-colors font-mono tracking-widest text-lg"
              />
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm font-bold text-center">
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-black text-lg py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>ENTRAR <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
