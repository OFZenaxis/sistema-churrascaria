"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'
import { loginAdmin } from '@/app/actions/adminAuth'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const res = await loginAdmin(password)
    setIsLoading(false)

    if (res.success) {
      router.push('/admin')
      router.refresh()
    } else {
      setError(res.error || 'Erro desconhecido')
      setPassword('')
    }
  }

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
          <p className="text-zinc-500 font-medium text-sm mt-2">Autentique-se para gerenciar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-6">
          <div>
            <label className="block text-zinc-400 font-bold mb-2 text-sm ml-1">Senha Mestra</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
             className="w-full bg-[#151515] border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-colors font-mono tracking-widest text-lg"
              autoFocus
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm font-bold text-center">
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isLoading || password.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-black text-lg py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
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
