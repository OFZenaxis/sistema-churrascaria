"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Loader2, QrCode } from 'lucide-react'

export default function PaymentPixClient({ orderId, amount }: { orderId: string, amount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [qrBase64, setQrBase64] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // 1. Gerar o PIX chamando nossa API nativa
  useEffect(() => {
    generatePix()
  }, [])

  const generatePix = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          formData: {
            payment_method_id: 'pix',
            payer: { email: 'cliente@costaesouza.com.br' }
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
    } catch (err) {
      setError('Erro de conexão ao gerar PIX.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Polling para checar se o Webhook confirmou o pagamento
  useEffect(() => {
    if (!qrCode) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        if (res.ok) {
           const data = await res.json()
           if (data.paymentStatus === 'approved' || data.paymentStatus === 'PAID') {
             router.push(`/pedido/${orderId}`)
           }
        }
      } catch (e) {
        // Ignora erros de rede no polling
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [qrCode, orderId, router])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#E31C1C]"/>
        <p className="text-zinc-500 text-sm font-bold animate-pulse">Gerando código PIX seguro...</p>
      </div>
    )
  }

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
