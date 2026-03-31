"use client"

import React, { useEffect, useState } from 'react'
import { Clock, CheckSquare } from 'lucide-react'

// Mocking initial data since it's an MVP UI representation for the KDS
type Order = {
  id: string
  customerName: string
  items: { product: string, props?: string, quantity: number }[]
  status: 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP'
  createdAt: string
  estimatedDeliveryTime?: number
}

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-101',
    customerName: 'Carlos Silva',
    items: [
      { product: 'Picanha Angus', props: 'Ponto: Mal Passado', quantity: 1 },
      { product: 'Farofa de Ovos', quantity: 1 },
      { product: 'Fritas', quantity: 2 },
    ],
    status: 'PREPARING',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    estimatedDeliveryTime: 40
  },
  {
    id: 'ORD-102',
    customerName: 'Mariana Costa',
    items: [
      { product: 'Bife Ancho', props: 'Ponto: Ao Ponto', quantity: 2 },
      { product: 'Arroz Biro-Biro', quantity: 1 },
    ],
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
    estimatedDeliveryTime: 45
  }
]

// Calculators for freshness timer
function calculateElapsed(createdAtStr: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 1000)
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

function getFreshnessColorClass(createdAtStr: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 1000 / 60)
  if (mins >= 15) return 'text-red-500 bg-red-500/10 border-red-500/50'
  if (mins >= 8) return 'text-amber-500 bg-amber-500/10 border-amber-500/50'
  return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50'
}

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<Order[]>([])
  const [now, setNow] = useState(Date.now()) // trigger re-render for timers

  // 1. POLLING DE DADOS A CADA 5 SEGUNDOS (V1)
  useEffect(() => {
    // Simulando uma requisição API (Polling)
    const fetchOrders = () => {
      // In a real scenario: const res = await fetch('/api/orders/active')
      setOrders(MOCK_ORDERS)
    }
    
    fetchOrders() // Chamada Inicial
    const pollingInterval = setInterval(fetchOrders, 5000)
    return () => clearInterval(pollingInterval)
  }, [])

  // 2. TIMERS (UI Refresh) A CADA 1 SEGUNDO
  useEffect(() => {
    const timerInterval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timerInterval)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-orange-500 flex items-center gap-3">
            KDS Expedição
            <span className="text-sm font-medium bg-orange-500/20 px-2 py-1 rounded-full text-orange-400 border border-orange-500/30">
              {orders.length} pedidos na fila
            </span>
          </h1>
          <p className="text-zinc-400 mt-1">Painel atualizado em tempo real (Polling: 5s)</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {orders.map(order => (
          <div key={order.id} className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header do Card */}
            <div className={`px-4 py-3 flex justify-between items-center border-b ${
              order.status === 'PENDING' ? 'border-orange-500/20 bg-orange-900/10' :
              order.status === 'PREPARING' ? 'border-blue-500/20 bg-blue-900/10' : 'border-zinc-800'
            }`}>
              <div>
                <span className="font-mono text-xs text-zinc-500 block">#{order.id}</span>
                <span className="font-bold text-zinc-100">{order.customerName}</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-sm font-bold shadow-inner ${getFreshnessColorClass(order.createdAt)}`}>
                <Clock className="w-4 h-4" />
                {calculateElapsed(order.createdAt)}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="p-4 flex-1">
              <ul className="space-y-3">
                {order.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-zinc-300">
                    <div className="bg-zinc-800 text-zinc-100 font-bold px-2 py-0.5 rounded text-sm h-fit">
                      {item.quantity}x
                    </div>
                    <div>
                      <span className="font-semibold block">{item.product}</span>
                      {item.props && <span className="text-xs text-orange-400 block break-words mt-0.5 font-medium">{item.props}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer de Ações e Diferencial de Tempo Estimado */}
            <div className="bg-zinc-900 p-4 border-t border-zinc-800 mt-auto flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Estimativa de Entrega:</span>
                <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {order.estimatedDeliveryTime} mins
                </span>
              </div>
              
              <button className="w-full bg-zinc-800 hover:bg-orange-600 hover:text-white text-zinc-300 transition-colors py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm">
                <CheckSquare className="w-4 h-4" />
                Marcar como Pronto
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
