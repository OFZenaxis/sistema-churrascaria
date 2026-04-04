"use client"

import { useState } from 'react'
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Info,
} from 'lucide-react'
import { savePaymentConfig } from '@/app/actions/paymentConfig'

type Props = {
  initial: {
    mpPublicKey: string
    mpAccessToken: string
  }
}

export default function PaymentConfigClient({ initial }: Props) {
  const [form, setForm] = useState(initial)
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async () => {
    setIsLoading(true)
    setStatus('idle')

    const res = await savePaymentConfig({
      mpPublicKey: form.mpPublicKey,
      mpAccessToken: form.mpAccessToken,
    })

    setIsLoading(false)

    if (res.success) {
      setStatus('success')
      setTimeout(() => setStatus('idle'), 4000)
    } else {
      setStatus('error')
      setErrorMsg(res.error ?? 'Erro ao salvar.')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Info */}
      <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          Encontre suas credenciais acessando:{' '}
          <strong>Seu Negócio &rarr; Configurações &rarr; Credenciais de Produção</strong>{' '}
          no painel do Mercado Pago.
        </p>
      </div>

      {/* Public Key */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Public Key</h2>
            <p className="text-xs text-slate-400 font-medium">Chave pública — usada no checkout do cliente</p>
          </div>
        </div>
        <input
          type="text"
          value={form.mpPublicKey}
          onChange={e => setForm(f => ({ ...f, mpPublicKey: e.target.value }))}
          placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Access Token */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Access Token</h2>
            <p className="text-xs text-slate-400 font-medium">Chave secreta — nunca compartilhe</p>
          </div>
        </div>
        <div className="relative">
          <input
            type={showToken ? 'text' : 'password'}
            value={form.mpAccessToken}
            onChange={e => setForm(f => ({ ...f, mpAccessToken: e.target.value }))}
            placeholder="APP_USR-0000000000000000-000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-000000000"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowToken(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Credenciais salvas com sucesso!</span>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wide px-6 py-3 rounded-xl transition-colors shadow-sm"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isLoading ? 'Salvando...' : 'Salvar Credenciais'}
      </button>
    </div>
  )
}
