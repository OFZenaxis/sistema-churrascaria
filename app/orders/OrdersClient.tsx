"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MapPin, CheckCircle2, Clock, Truck, ChefHat, X } from 'lucide-react'
import { OrderStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const CustomerTracker = dynamic(() => import('@/components/CustomerTracker'), { ssr: false })

export type OrderData = {
  id: string
  status: OrderStatus
  totalAmount: number
  createdAt: Date
}

type OrdersClientProps = {
  orders: OrderData[]
}

const steps = [
  { id: 'PENDING', label: 'Aguardando a Brasa', icon: Clock },
  { id: 'PREPARING', label: 'Assando', icon: ChefHat },
  { id: 'READY_FOR_PICKUP', label: 'Separado', icon: CheckCircle2 },
  { id: 'DISPATCHED', label: 'Na Moto', icon: Truck },
  { id: 'DELIVERED', label: 'Entregue', icon: MapPin },
]

export default function OrdersClient({ orders: initialOrders }: OrdersClientProps) {
  const router = useRouter()
  // Poderia ter um state global/SWC, mas aqui fazemos polling simples recarregando a rota
  const [orders, setOrders] = useState(initialOrders)
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null)

  useEffect(() => {
    // Polling nativo do Next App Router: revalida dados a cada 8 segundos se tiver pedidos não-entregues
    const hasActiveOrders = orders.some(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED')
    
    if (hasActiveOrders) {
      const interval = setInterval(() => {
        router.refresh()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [orders, router])

  // A page em si pode atualizar a prop inicial
  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const getStepIndex = (status: OrderStatus) => {
    return steps.findIndex(s => s.id === status)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8 min-h-[60vh]">
      
      {/* Tracker Fullscreen */}
      <AnimatePresence>
        {activeTrackerId && (
          <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111] w-full max-w-xl rounded-[2rem] border border-zinc-800 overflow-hidden shadow-2xl flex flex-col relative"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <button 
                onClick={() => setActiveTrackerId(null)}
                className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full text-zinc-400 hover:text-white border border-zinc-700/50"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-2">
                <CustomerTracker 
                  orderId={activeTrackerId} 
                  onDelivered={() => {
                    setTimeout(() => {
                      setActiveTrackerId(null)
                      router.refresh()
                    }, 4000)
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-5xl font-black text-white">Meus Pedidos</h1>
        <p className="text-zinc-400 mt-2 text-lg">Acompanhe a chegada da sua carne com precisão.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[#111] border border-zinc-800 rounded-3xl p-12 text-center">
          <p className="text-zinc-500 text-xl font-bold">Nenhum pedido recente encontrado.</p>
          <button onClick={() => router.push('/')} className="mt-6 font-bold text-orange-500 hover:text-orange-400">
            Fazer meu primeiro pedido
          </button>
        </div>
      ) : (
        orders.map(order => {
          const currentIndex = getStepIndex(order.status)
          const isFinished = order.status === 'DELIVERED' || order.status === 'CANCELED'
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id} 
              className={`bg-[#0a0a0a] border rounded-[2rem] p-6 lg:p-8 relative overflow-hidden transition-all shadow-xl ${
                isFinished ? 'border-zinc-800/80' : 'border-orange-500/30 shadow-orange-900/10'
              }`}
            >
              {/* O Blur Background pra dar o tom Premium */}
              {!isFinished && <div className="absolute inset-0 bg-orange-900/5 blur-3xl rounded-full" />}

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <span className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest">TICKET #{order.id.slice(0,6)}</span>
                    <h3 className="text-white text-2xl font-black mt-1">R$ {order.totalAmount.toFixed(2)}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 text-sm font-bold block">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-xs text-zinc-500 font-medium">Hoje</span>
                  </div>
                </div>

                {order.status === 'CANCELED' ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                    <p className="text-red-500 font-bold">Pedido Cancelado</p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      {/* Linha de progresso no fundo */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-800 -translate-y-1/2 z-0 rounded-full" />
                      <div 
                        className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 z-0 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.8)] transition-all duration-700" 
                        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                      />

                      <div className="relative z-10 flex justify-between">
                        {steps.map((step, idx) => {
                          const isCompleted = idx <= currentIndex
                          const Icon = step.icon
                          return (
                            <div key={step.id} className="flex flex-col items-center gap-2">
                              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${
                                isCompleted 
                                  ? 'bg-orange-600 border-[#0a0a0a] text-white shadow-lg shadow-orange-900/50' 
                                  : 'bg-zinc-900 border-[#0a0a0a] text-zinc-600'
                              }`}>
                                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                              </div>
                              <span className={`text-[10px] lg:text-xs font-black uppercase tracking-wider text-center w-16 lg:w-24 ${
                                isCompleted ? 'text-zinc-200' : 'text-zinc-600'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Botão de Mapa Magistral se estiver na Moto */}
                    {order.status === 'DISPATCHED' && (
                      <motion.button 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onClick={() => setActiveTrackerId(order.id)}
                        className="w-full mt-10 bg-orange-600 hover:bg-orange-500 text-white font-black text-xl lg:text-2xl py-5 rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.4)] flex justify-center items-center gap-3 transition-transform active:scale-[0.98]"
                      >
                        <MapPin className="w-6 h-6 lg:w-8 lg:h-8" />
                        ACOMPANHAR NO MAPA
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )
        })
      )}
    </div>
  )
}
