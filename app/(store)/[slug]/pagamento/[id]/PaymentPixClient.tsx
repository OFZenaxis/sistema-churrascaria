"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Loader2, QrCode, MessageCircle } from 'lucide-react'

const POLL_INTERVAL_MS = 4_000
const TIMEOUT_MS = 15 * 60 * 1_000 // 15 minutos

export default function PaymentPixClient({ orderId, amount, customerEmail }: { orderId: string, amount: number, customerEmail: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [qrBase64, setQrBase64] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    setTimedOut(false)

    // Para o polling após 15 minutos sem confirmação
    timeoutRef.current = setTimeout(() => {
      stopPolling()
      setTimedOut(true)
    }, TIMEOUT_MS)

    // Verifica status a cada 4s
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.paymentStatus === 'approved' || data.paymentStatus === 'PAID') {
            stopPolling()
            router.push(`/pedido/${orderId}`)
          }
        }
      } catch {
        // Ignora erros de rede no polling
      }
    }, POLL_INTERVAL_MS)
  }, [orderId, router, stopPolling])

  // 1. Gerar o PIX chamando nossa API nativa
  useEffect(() => {
    generatePix()
    return () => stopPolling()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generatePix = async () => {
    setLoading(true)
    setError('')
    setTimedOut(false)
    stopPolling()
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          formData: {
            payment_method_id: 'pix',
            payer: { email: customerEmail }
          }
        })
      })
      const data = await res.json()

      if (data.qr_code && data.qr_code_base64) {
        setQrCode(data.qr_code)
        setQrBase64(data.qr_code_base64)
      } else {
        setError(data.error || 'Não foi possível gerar a chave PIX.')
      }
    } catch {
      setError('Erro de conexão ao gerar PIX.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Inicia polling com timeout assim que o QR code estiver pronto
  useEffect(() => {
    if (!qrCode) return
    startPolling()
    return () => stopPolling()
  }, [qrCode, startPolling, stopPolling])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#E31C1C]"/>
        <p className="text-zinc-500 text-sm font-bold animate-pulse">Gerando código PIX seguro...</p>
      </div>
    )
  }

  // ─── Erro de geração ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-12 h-12 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-3">
           <span className="text-red-500 font-bold text-xl">!</span>
        </div>
        <p className="text-red-400 text-sm font-bold border border-red-900/40 bg-red-900/10 p-4 rounded-xl">{error}</p>
        <button onClick={generatePix} className="mt-4 text-[#E31C1C] text-xs font-bold underline">Tentar novamente</button>
      </div>
    )
  }

  // ─── Timeout — 15 minutos sem confirmação ─────────────────────────────────────
  if (timedOut) {
    return (
      <div className="py-8 px-4 text-center flex flex-col items-center gap-5">
        <div className="w-14 h-14 bg-amber-950/50 border border-amber-900/40 rounded-full flex items-center justify-center">
          <span className="text-amber-400 font-black text-2xl">?</span>
        </div>
        <div className="space-y-2 max-w-[260px]">
          <p className="text-zinc-100 font-black text-sm">Não detectamos seu pagamento ainda.</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Isso pode levar alguns minutos.<br />
            Se já pagou e o pedido não foi confirmado,<br />
            fale com o suporte.
          </p>
        </div>
        <a
          href="https://wa.me/5561995783461"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-black text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-900/30"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com suporte no WhatsApp
        </a>
        <button
          onClick={startPolling}
          className="text-zinc-500 text-xs font-bold underline hover:text-zinc-300 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // ─── QR Code pronto ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center w-full px-2 py-4">

      <div className="bg-white p-2 rounded-3xl shadow-2xl w-[220px] h-[220px] mb-6 relative flex items-center justify-center border-4 border-[#1a1a1a]">
         <img
           src={`data:image/png;base64,${qrBase64}`}
           alt="QR Code PIX"
           className="w-full h-full object-contain rounded-xl"
         />
         <div className="absolute -bottom-3.5 bg-[#E31C1C] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(227,28,28,0.4)]">
            <QrCode className="w-3.5 h-3.5" /> Pague via App
         </div>
      </div>

      <p className="text-zinc-500 text-xs mt-2 text-center mb-5 max-w-[260px] leading-relaxed">
        Abra o app do seu banco, escolha <strong>Pix Copia e Cola</strong> ou aponte a câmera para pagar.
      </p>

      <div className="w-full relative mb-6 group">
        <input
          readOnly
          value={qrCode}
          className="w-full bg-[#0a0a0a] border border-[#333] group-hover:border-[#555] cursor-pointer rounded-xl py-3.5 pl-4 pr-14 text-zinc-400 text-[11px] font-mono outline-none transition-colors"
          onClick={copyToClipboard}
        />
        <button
          onClick={copyToClipboard}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#1f1f1f] hover:bg-[#333] rounded-lg p-2.5 transition-colors text-white"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {copied && (
        <p className="text-green-500 text-xs font-bold mb-4 animate-in fade-in slide-in-from-bottom-2">
          Código copiado com sucesso!
        </p>
      )}

      <div className="mt-4 px-4 py-2.5 bg-[#E31C1C]/10 border border-[#E31C1C]/20 rounded-full flex items-center gap-2 text-[#E31C1C] text-[10px] uppercase font-black tracking-widest">
         <Loader2 className="w-3.5 h-3.5 animate-spin"/> Aguardando Pagamento...
      </div>
    </div>
  )
}
