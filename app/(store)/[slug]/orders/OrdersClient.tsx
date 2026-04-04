"use client"

import React, { useEffect, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, MapPin, CheckCircle2, Clock, Truck, ChefHat, X,
  ArrowLeft, LogOut, Ticket, MessageCircle, RotateCcw,
} from 'lucide-react'
import { OrderStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { logout } from '@/app/actions/auth'
import type { StoreTheme } from '@/components/MenuComponent'

const CustomerTracker = dynamic(() => import('@/components/CustomerTracker'), { ssr: false })

export type OrderItem = {
  quantity: number
  product: { name: string }
}

export type OrderData = {
  id: string
  status: OrderStatus
  totalAmount: number
  createdAt: Date
  items: OrderItem[]
}

type OrdersClientProps = {
  orders: OrderData[]
  slug: string
  storeId: string
  storeTheme: StoreTheme
  user: { name: string | null; phone: string }
}

const STEPS = [
  { id: 'PENDING',          label: 'Recebido',   icon: Clock },
  { id: 'PREPARING',        label: 'Preparando', icon: ChefHat },
  { id: 'READY_FOR_PICKUP', label: 'Separado',   icon: CheckCircle2 },
  { id: 'DISPATCHED',       label: 'Em Rota',    icon: Truck },
  { id: 'DELIVERED',        label: 'Entregue',   icon: MapPin },
]

const STATUS_LABEL: Record<string, string> = {
  DELIVERED: 'Entregue',
  CANCELED:  'Cancelado',
}

export default function OrdersClient({ orders: initialOrders, slug, storeId, storeTheme, user }: OrdersClientProps) {
  const { brandColor, phoneBg, phoneCard, phoneText, phoneSubText } = storeTheme
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Polling para pedidos em andamento
  useEffect(() => {
    const hasActive = orders.some(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED')
    if (!hasActive) return
    const interval = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(interval)
  }, [orders, router])

  useEffect(() => { setOrders(initialOrders) }, [initialOrders])

  const handleLogout = () => {
    startTransition(async () => {
      await logout(storeId)
      router.push(`/${slug}`)
    })
  }

  // Separação inteligente
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELED')
  const pastOrders   = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELED')

  const getStepIndex = (status: OrderStatus) => STEPS.findIndex(s => s.id === status)

  const border    = phoneSubText + '22'
  const subtleBg  = phoneSubText + '12'

  const avatarLetter  = (user.name ?? user.phone).trim().charAt(0).toUpperCase()
  const formattedPhone = user.phone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')

  const shortcuts = [
    { icon: <MapPin className="w-5 h-5" />,        label: 'Endereços' },
    { icon: <Ticket className="w-5 h-5" />,         label: 'Cupons'    },
    { icon: <MessageCircle className="w-5 h-5" />,  label: 'Suporte'   },
  ]

  return (
    <>
      {/* ── Tracker fullscreen ── */}
      <AnimatePresence>
        {activeTrackerId && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative border"
              style={{ background: phoneBg, borderColor: border }}
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <button
                onClick={() => setActiveTrackerId(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full border"
                style={{ background: phoneBg, borderColor: border, color: phoneSubText }}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-2">
                <CustomerTracker
                  orderId={activeTrackerId}
                  onDelivered={() => setTimeout(() => { setActiveTrackerId(null); router.refresh() }, 4000)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b" style={{ borderColor: border }}>
        <button
          onClick={() => router.push(`/${slug}`)}
          className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
          style={{ background: subtleBg, color: phoneSubText }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-black" style={{ color: phoneText }}>Minha Conta</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ── Card de Perfil Premium ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border flex items-center gap-4"
          style={{ background: phoneCard, borderColor: border }}
        >
          {/* Avatar com glow sutil */}
          <div className="relative shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              {avatarLetter}
            </div>
            <div
              className="absolute inset-0 rounded-full blur-md opacity-30 -z-10 scale-110"
              style={{ backgroundColor: brandColor }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-base leading-tight truncate" style={{ color: phoneText }}>
              {user.name ?? 'Cliente'}
            </p>
            <p className="text-sm font-medium mt-0.5" style={{ color: phoneSubText }}>
              {formattedPhone}
            </p>
          </div>
        </motion.div>

        {/* ── Atalhos Rápidos ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {shortcuts.map((s, i) => (
            <button
              key={s.label}
              className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-transform active:scale-95 shadow-sm"
              style={{ background: phoneCard, borderColor: border }}
              onClick={() => console.log(`[shortcut] ${s.label}`)}
            >
              <div className="p-2.5 rounded-full" style={{ backgroundColor: brandColor + '15', color: brandColor }}>
                {s.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: phoneSubText }}>
                {s.label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ── Pedidos Ativos ── */}
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: brandColor }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>
                Acompanhar Pedido
              </p>
            </div>

            {activeOrders.map((order, oi) => {
              const currentIndex = getStepIndex(order.status)
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: oi * 0.06 }}
                  className="rounded-2xl p-5 border relative overflow-hidden"
                  style={{ background: phoneCard, borderColor: brandColor + '44' }}
                >
                  {/* Glow de fundo */}
                  <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ background: brandColor }}
                  />

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: phoneSubText }}>
                          #{order.id.slice(0, 6)}
                        </span>
                        <h3 className="text-xl font-black mt-0.5" style={{ color: phoneText }}>
                          R$ {order.totalAmount.toFixed(2)}
                        </h3>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                        style={{ background: brandColor + '20', color: brandColor }}
                      >
                        Em andamento
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                      <div className="absolute top-5 left-5 right-5 h-0.5 rounded-full" style={{ background: border }} />
                      <div
                        className="absolute top-5 left-5 h-0.5 rounded-full transition-all duration-700"
                        style={{
                          background: brandColor,
                          width: currentIndex === 0
                            ? '0%'
                            : `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 2.5rem)`,
                        }}
                      />
                      <div className="relative z-10 flex justify-between">
                        {STEPS.map((step, idx) => {
                          const done = idx <= currentIndex
                          const Icon = step.icon
                          return (
                            <div key={step.id} className="flex flex-col items-center gap-1.5">
                              <motion.div
                                animate={done ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 0.4 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                                style={done
                                  ? { background: brandColor, borderColor: phoneCard, color: '#fff' }
                                  : { background: phoneBg, borderColor: border, color: phoneSubText }
                                }
                              >
                                <Icon className="w-4 h-4" />
                              </motion.div>
                              <span
                                className="text-[9px] font-black uppercase tracking-wide text-center w-14"
                                style={{ color: done ? phoneText : phoneSubText }}
                              >
                                {step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {order.status === 'DISPATCHED' && (
                      <motion.button
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onClick={() => setActiveTrackerId(order.id)}
                        className="w-full mt-5 text-white font-black text-sm py-3.5 rounded-xl flex justify-center items-center gap-2 active:scale-[0.98] transition-transform"
                        style={{ background: brandColor }}
                      >
                        <MapPin className="w-4 h-4" />
                        ACOMPANHAR NO MAPA
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ── Histórico Compacto ── */}
        {pastOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-black uppercase tracking-widest pt-2" style={{ color: phoneSubText }}>
              Histórico
            </p>

            {pastOrders.map((order, oi) => {
              const isDelivered = order.status === 'DELIVERED'
              const statusLabel = STATUS_LABEL[order.status] ?? order.status

              // Monta resumo "1x Smash Duplo, 2x Coca-Cola"
              const itemsSummary = order.items
                .map(i => `${i.quantity}x ${i.product.name}`)
                .join(', ')

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: oi * 0.04 }}
                  className="rounded-xl p-3 border shadow-sm"
                  style={{ background: phoneCard, borderColor: border }}
                >
                  {/* Linha 1: ticket + badge + data */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-mono font-semibold uppercase opacity-70 shrink-0" style={{ color: phoneSubText }}>
                        #{order.id.slice(0, 6)}
                      </span>
                      <span
                        className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0"
                        style={isDelivered
                          ? { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }
                          : { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
                        }
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium shrink-0 opacity-70" style={{ color: phoneSubText }}>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  {/* Linha 2: itens do pedido */}
                  {itemsSummary && (
                    <p className="text-xs mt-1.5 mb-2 line-clamp-2 leading-snug" style={{ color: phoneSubText }}>
                      {itemsSummary}
                    </p>
                  )}

                  {/* Linha 3: valor + botão pedir novamente */}
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <p className="font-black text-sm" style={{ color: phoneText }}>
                      R$ {order.totalAmount.toFixed(2)}
                    </p>

                    {isDelivered && (
                      <button
                        onClick={() => console.log('[reorder]', order.id)}
                        className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                        style={{ backgroundColor: brandColor + '15', color: brandColor }}
                      >
                        <RotateCcw className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
                          Pedir novamente
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ── Estado vazio ── */}
        {orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-10 text-center border"
            style={{ background: phoneCard, borderColor: border }}
          >
            <p className="text-3xl mb-3">🛍️</p>
            <p className="font-bold" style={{ color: phoneSubText }}>Nenhum pedido ainda.</p>
            <button
              onClick={() => router.push(`/${slug}`)}
              className="mt-4 font-bold text-sm underline"
              style={{ color: brandColor }}
            >
              Ver cardápio
            </button>
          </motion.div>
        )}

        {/* ── Sair da Conta (discreto, no rodapé) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="pt-4 pb-8 flex justify-center"
        >
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <LogOut className="w-4 h-4" />
            }
            Sair da conta
          </button>
        </motion.div>

      </div>
    </>
  )
}
