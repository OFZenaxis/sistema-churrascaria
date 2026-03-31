"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Flame, BellRing, PackageCheck, Loader2, Clock, Truck } from 'lucide-react'
import { OrderStatus } from '@prisma/client'
import { advanceOrderStatus } from '../actions/kitchen'
import { useRouter } from 'next/navigation'

export type KitchenOrder = {
  id: string
  customerName: string
  totalAmount: number
  status: OrderStatus
  items: {
    id: string
    product: { name: string }
    quantity: number
    doneness: string | null
    comboSides: string | null
  }[]
  createdAt: Date
}

type KitchenClientProps = {
  activeOrders: KitchenOrder[]
}

const NEW_ORDER_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

export default function KitchenClient({ activeOrders }: KitchenClientProps) {
  const router = useRouter()
  
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null)
  
  const prevOrderIdsRef = useRef<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Polling silencioso
  useEffect(() => {
    const int = setInterval(() => {
      router.refresh()
    }, 4000)
    return () => clearInterval(int)
  }, [router])

  // Setup de Áudio Nativo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(NEW_ORDER_SOUND_URL)
    }
  }, [])

  // Verifica novos pedidos e emite o BIP se o Áudio estiver habilitado
  useEffect(() => {
    const currentPendingIds = activeOrders.filter(o => o.status === 'PENDING').map(o => o.id)
    
    if (audioEnabled && prevOrderIdsRef.current.size > 0) {
      const hasNewOrder = currentPendingIds.some(id => !prevOrderIdsRef.current.has(id))
      if (hasNewOrder && audioRef.current) {
        audioRef.current.play().catch(e => console.warn("Erro ao tocar áudio", e))
      }
    }
    
    // Atualiza a memória de IDs
    prevOrderIdsRef.current = new Set(currentPendingIds)
  }, [activeOrders, audioEnabled])

  const enableExpedition = () => {
    setAudioEnabled(true)
    // Força um play vazio só pra destravar a API de Audio do Navegador no gesto de clique
    if (audioRef.current) {
      audioRef.current.volume = 0
      audioRef.current.play().then(() => {
        audioRef.current!.volume = 1
        audioRef.current!.pause()
        audioRef.current!.currentTime = 0
      }).catch(e => console.log("Unlock bloqueado:", e))
    }
  }

  const handleAdvance = async (orderId: string, currentStatus: OrderStatus) => {
    setIsProcessingId(orderId)
    const res = await advanceOrderStatus(orderId, currentStatus)
    setIsProcessingId(null)
    
    if (res.success) {
      router.refresh()
    } else {
      alert("Erro ao avançar pedido")
    }
  }

  const pending = activeOrders.filter(o => o.status === 'PENDING')
  const preparing = activeOrders.filter(o => o.status === 'PREPARING')
  const ready = activeOrders.filter(o => o.status === 'READY_FOR_PICKUP')

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 lg:p-8 font-sans">
      
      {/* Header Central KDS */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#111] p-6 rounded-3xl border border-zinc-800 shadow-xl mb-8">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="bg-orange-500/20 p-4 rounded-2xl border border-orange-500/30">
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">KDS Expedition</h1>
            <p className="text-zinc-400 font-medium">Controle de Preparo em Tempo Real</p>
          </div>
        </div>

        <div>
           {!audioEnabled ? (
             <button 
               onClick={enableExpedition}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all animate-pulse"
             >
               <BellRing className="w-6 h-6" /> ABRIR EXPEDIÇÃO
             </button>
           ) : (
             <div className="bg-zinc-800/50 border border-zinc-700 px-6 py-3 rounded-xl flex items-center gap-3">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
               </span>
               <span className="font-bold text-zinc-300">Expedição e Áudio Ativos</span>
             </div>
           )}
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        
        {/* Coluna 1: Pendentes */}
        <div className="bg-[#111]/80 rounded-[2rem] border border-zinc-800 p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
            <h2 className="text-xl font-black text-rose-500 flex items-center gap-2"><Clock className="w-5 h-5"/> PENDENTES</h2>
            <span className="bg-rose-500 flex items-center justify-center text-white w-8 h-8 rounded-full font-black text-sm">{pending.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <AnimatePresence>
              {pending.map(order => (
                 <KanbanCard 
                   key={order.id} 
                   order={order} 
                   loading={isProcessingId === order.id}
                   actionText="MANDAR PRA GRELHA" 
                   actionColor="bg-orange-600 hover:bg-orange-500"
                   onAction={() => handleAdvance(order.id, order.status)} 
                 />
              ))}
            </AnimatePresence>
            {pending.length === 0 && <EmptyState text="Nenhum pedido na fila" />}
          </div>
        </div>

        {/* Coluna 2: Em Preparo */}
        <div className="bg-[#111]/80 rounded-[2rem] border border-zinc-800 p-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
            <h2 className="text-xl font-black text-orange-500 flex items-center gap-2"><ChefHat className="w-5 h-5"/> NA GRELHA</h2>
            <span className="bg-orange-500 flex items-center justify-center text-white w-8 h-8 rounded-full font-black text-sm">{preparing.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <AnimatePresence>
              {preparing.map(order => (
                 <KanbanCard 
                   key={order.id} 
                   order={order} 
                   loading={isProcessingId === order.id}
                   actionText="MARCAR COMO PRONTO" 
                   actionColor="bg-emerald-600 hover:bg-emerald-500"
                   onAction={() => handleAdvance(order.id, order.status)} 
                 />
              ))}
            </AnimatePresence>
            {preparing.length === 0 && <EmptyState text="Grelha vazia" />}
          </div>
        </div>

        {/* Coluna 3: Pronto (Aguardando Motoboy) */}
        <div className="bg-[#111]/80 rounded-[2rem] border border-zinc-800 p-6 flex flex-col opacity-80 mix-blend-luminosity">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
            <h2 className="text-xl font-black text-emerald-500 flex items-center gap-2"><PackageCheck className="w-5 h-5"/> SEPARADOS</h2>
            <span className="bg-emerald-500 flex items-center justify-center text-white w-8 h-8 rounded-full font-black text-sm">{ready.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <AnimatePresence>
              {ready.map(order => (
                 <motion.div
                   key={order.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="bg-[#1a1a1a] rounded-2xl p-4 border-l-4 border-emerald-500 flex flex-col gap-2"
                 >
                   <div className="flex justify-between">
                     <span className="text-zinc-400 font-mono text-xs">#{order.id.slice(0,6)}</span>
                     <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">Aguardando Moto <Truck className="w-3 h-3"/></span>
                   </div>
                   <p className="font-bold text-lg text-white">{order.customerName}</p>
                 </motion.div>
              ))}
            </AnimatePresence>
            {ready.length === 0 && <EmptyState text="Nenhum pedido pronto" />}
          </div>
        </div>

      </div>
    </div>
  )
}

function KanbanCard({ order, actionText, actionColor, onAction, loading }: { order: KitchenOrder, actionText: string, actionColor: string, onAction: () => void, loading: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      layout
      className="bg-[#0a0a0a] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl"
    >
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-black text-xl text-white">{order.customerName}</h3>
          <span className="text-zinc-500 font-mono text-xs font-bold">#{order.id.slice(0,6)}</span>
        </div>
        <p className="text-sm text-zinc-400 font-medium">Chegou às {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
      </div>
      
      <div className="p-4 space-y-3">
        {order.items.map(item => (
          <div key={item.id} className="text-sm border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
            <div className="flex gap-2 text-zinc-200">
              <span className="font-bold text-orange-500">{item.quantity}x</span>
              <span className="font-bold">{item.product.name}</span>
            </div>
            {item.doneness && (
              <p className="text-xs text-rose-400 mt-1 pl-6">🔥 {item.doneness.replace(/_/g, ' ')}</p>
            )}
            {item.comboSides && (
              <p className="text-xs text-zinc-500 mt-1 pl-6">↳ {JSON.parse(item.comboSides).join(', ')}</p>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 pt-0">
        <button 
          onClick={onAction}
          disabled={loading}
          className={`w-full ${actionColor} text-white font-black text-sm uppercase tracking-widest py-3 rounded-xl transition-transform active:scale-95 flex items-center justify-center`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : actionText}
        </button>
      </div>
    </motion.div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-40 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl">
      <p className="text-zinc-600 font-bold">{text}</p>
    </div>
  )
}
