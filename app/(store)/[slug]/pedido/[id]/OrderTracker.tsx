"use client"
import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Package, ChefHat, CheckCircle2, ChevronLeft, Bike } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OrderTracker({ order }: { order: any }) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isDelivered = status === 'DELIVERED'

  // Polling a cada 5s — para imediatamente quando DELIVERED for detectado
  useEffect(() => {
    if (isDelivered) return // pedido já entregue, não precisa de polling

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`)
        if (res.ok) {
          const data = await res.json()
          setStatus(data.status)
          setPaymentStatus(data.paymentStatus)
          // Para o polling no momento em que DELIVERED é detectado
          if (data.status === 'DELIVERED' && intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      } catch (err) {
        console.error('[OrderTracker] falha no polling de status:', err)
      }
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [order.id, isDelivered])

  const steps = [
    { id: 'PENDING',    label: 'Pagamento pendente', icon: <Package      className="w-5 h-5" /> },
    { id: 'PREPARING',  label: 'Preparando',         icon: <ChefHat      className="w-5 h-5" /> },
    { id: 'DISPATCHED', label: 'A caminho',           icon: <Bike         className="w-5 h-5" /> },
    { id: 'DELIVERED',  label: 'Entregue',            icon: <CheckCircle2 className="w-5 h-5" /> },
  ]

  const activeIndex =
    status === 'PENDING'    ? (paymentStatus === 'PAID' ? 1 : 0) :
    status === 'PREPARING'  ? 1 :
    status === 'DISPATCHED' ? 2 :
    status === 'DELIVERED'  ? 3 : 0

  const isPixPending = paymentStatus === 'pending' || paymentStatus === 'in_process'

  return (
    <div className="w-full space-y-6">

      {/* Aviso gigante se Pix estiver pendente */}
      {isPixPending && status === 'PENDING' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-5 rounded-3xl animate-pulse">
          <h2 className="text-yellow-500 font-black text-base uppercase mb-2">Aguardando Confirmação do Pagamento</h2>
          <p className="text-yellow-600/70 text-xs font-bold leading-relaxed">Já pagou o PIX pelo seu App de Banco? Pode levar uns segundinhos. O sistema vai confirmar automaticamente e enviar seu pedido para a cozinha.</p>
        </div>
      )}

      {/* Card de sucesso — exibido apenas quando DELIVERED */}
      {isDelivered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl text-center"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-emerald-400 font-black text-xl uppercase mb-2">Pedido entregue!</h2>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed">
            Bom apetite! 😊<br />
            Obrigado por pedir pelo nosso delivery próprio.
          </p>
        </motion.div>
      )}

      {/* Timeline de progresso */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">STATUS</span>
          <span className={`font-black text-sm uppercase ${isDelivered ? 'text-emerald-400' : 'text-[#E31C1C]'}`}>
            {isDelivered ? 'Concluído' : 'Em Andamento'}
          </span>
        </div>

        <div className="space-y-6 relative">
          <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-[#222]" />

          {steps.map((step, idx) => {
            const isActive = idx === activeIndex
            const isPast = idx < activeIndex

            return (
              <div key={idx} className="relative flex items-center gap-4 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-[#111] transition-colors ${
                  isActive && isDelivered   ? 'bg-emerald-500 text-white' :
                  isActive || isPast        ? 'bg-[#E31C1C] text-white'  :
                                              'bg-[#222] text-zinc-500'
                }`}>
                  {isPast || (isActive && isDelivered)
                    ? <CheckCircle2 className="w-4 h-4" />
                    : step.icon}
                </div>
                <div className={`flex flex-col ${isActive || isPast ? 'opacity-100' : 'opacity-40'}`}>
                  <span className={`text-sm font-black uppercase ${
                    isActive ? (isDelivered ? 'text-emerald-400' : 'text-white') : 'text-zinc-400'
                  }`}>
                    {step.label}
                  </span>
                  {isActive && !isDelivered && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[#E31C1C] text-[10px] font-bold uppercase tracking-widest"
                    >
                      Agora
                    </motion.span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => router.push('/')}
        className="w-full py-4 rounded-xl border-2 border-[#1f1f1f] text-zinc-400 font-bold uppercase text-xs hover:bg-[#1a1a1a] transition-colors"
      >
        <ChevronLeft className="w-4 h-4 inline mr-1" /> Voltar ao Início
      </button>
    </div>
  )
}
