"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Loader2 } from 'lucide-react'
import { loginWithPhone } from '../app/actions/auth'

type PhoneLoginProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PhoneLogin({ isOpen, onClose, onSuccess }: PhoneLoginProps) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const res = await loginWithPhone(phone, name, address)
    
    if (res.success) {
      onSuccess()
    } else {
      setError(res.error || 'Erro ao fazer login.')
    }
    setIsLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-[#111] w-full max-w-sm rounded-[2rem] border border-zinc-800 p-8 relative shadow-2xl"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                <Smartphone className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-white">Quase lá!</h2>
              <p className="text-zinc-400 text-sm mt-2">Informe seu WhatsApp para despacharmos a sua carne.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Telefone / WhatsApp</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(61) 99999-9999"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all font-mono text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Como chama você?</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all font-medium text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Onde vamos entregar?</label>
                <input 
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Seu endereço completo"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all font-medium text-lg"
                />
              </div>

              {error && <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-black text-xl py-4 rounded-xl shadow-xl shadow-orange-900/40 transition-all flex justify-center items-center mt-8 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar & Pedir'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
