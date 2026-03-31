"use client"
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, PowerOff } from 'lucide-react'
import Link from 'next/link'

export default function KDSPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ── Fetch orders (agora via GET, sem senha no body) ──
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()

        // Lógica do sino: toca se tem novo pedido pago
        setOrders(prev => {
          const prevPaid = prev.filter(o => o.paymentStatus === 'PAID' || o.paymentMethod === 'CASH' || o.paymentMethod === 'CARD_MACHINE')
          const newPaid = data.orders.filter((o: any) => o.paymentStatus === 'PAID' || o.paymentMethod === 'CASH' || o.paymentMethod === 'CARD_MACHINE')
          if (newPaid.length > prevPaid.length && audioRef.current) {
             audioRef.current.play().catch(() => {})
          }
          return data.orders
        })
      }
    } catch(e) { /* silencioso */ }
  }

  const fetchStatus = async () => {
     try {
       const res = await fetch('/api/admin/store-status')
       if (res.ok) {
         const data = await res.json()
         setIsOpen(data.isOpen)
       }
     } catch(e) {}
  }

  const toggleStore = async () => {
     try {
       const res = await fetch('/api/admin/store-status', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ isOpen: !isOpen })
       })
       if (res.ok) setIsOpen(!isOpen)
     } catch(e) {}
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      fetchOrders()
    } catch(e) {}
  }

  // Polling a cada 5s + fetch inicial
  useEffect(() => {
    fetchOrders()
    fetchStatus()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#070707] text-zinc-300 flex flex-col">
       <audio ref={audioRef} src="/ding.mp3" preload="auto" />

       {/* Topbar/Navbar */}
       <header className="bg-[#111] border-b border-[#222] px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div>
              <h1 className="text-xl font-black text-white tracking-widest uppercase">COSTA E SOUZA KDS</h1>
              <p className="text-xs text-zinc-500 font-bold hidden sm:block">Monitor de Pedidos em Tempo Real</p>
            </div>
            <nav className="flex gap-6 mt-1 sm:mt-0">
              <Link href="/admin" className="text-zinc-400 hover:text-white pb-1 font-bold transition text-sm sm:text-base">⚙️ Gestão Loja</Link>
              <Link href="/admin/kds" className="text-white border-b-2 border-emerald-500 pb-1 font-bold transition text-sm sm:text-base">🍳 Cozinha (KDS)</Link>
            </nav>
         </div>
         <button onClick={toggleStore} className={`px-4 py-2 font-black rounded-lg uppercase flex items-center gap-2 text-xs transition-colors shrink-0 ${isOpen ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
           <PowerOff className="w-4 h-4" /> {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
         </button>
       </header>

       {/* Kanban Board */}
       <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          <Column title="Recebidos" color="#E31C1C">
            {orders.filter(o => o.status === 'PENDING' && (o.paymentStatus === 'PAID' || o.paymentMethod === 'CASH' || o.paymentMethod === 'CARD_MACHINE')).map(order => (
               <OrderCard key={order.id} order={order} 
                 actionBtn="BOTA NA BRASA 🔥" actionClick={() => updateOrderStatus(order.id, 'PREPARING')} 
                 showPrintBtn />
            ))}
          </Column>

          <Column title="Na Brasa (Preparo)" color="#FFB800">
            {orders.filter(o => o.status === 'PREPARING').map(order => (
               <OrderCard key={order.id} order={order} 
                 actionBtn="MOTOBOY CHEGOU 🛵" actionClick={() => updateOrderStatus(order.id, 'DISPATCHED')} />
            ))}
          </Column>

          <Column title="Saiu para Entrega" color="#10B981">
            {orders.filter(o => o.status === 'DISPATCHED').map(order => (
               <OrderCard key={order.id} order={order} 
                 actionBtn="ENTREGOU ✅" actionClick={() => updateOrderStatus(order.id, 'DELIVERED')} />
            ))}
          </Column>
       </main>
    </div>
  )
}

function Column({ title, children, color }: any) {
  return (
     <div className="flex flex-col bg-[#0f0f0f] rounded-2xl border border-[#1a1a1a] overflow-hidden h-full">
       <div className="p-4 border-b border-[#1a1a1a]" style={{ borderTop: `4px solid ${color}` }}>
          <h2 className="font-black text-white uppercase text-sm">{title} <span className="text-zinc-500 ml-2">({React.Children.count(children)})</span></h2>
       </div>
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {children}
          </AnimatePresence>
       </div>
     </div>
  )
}

function OrderCard({ order, actionBtn, actionClick, showPrintBtn = false }: any) {
  const printOrder = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
      <head>
        <title>Recibo ${order.id}</title>
        <style>
          @page { margin: 0; }
          body { font-family: monospace; font-size: 14px; width: 80mm; padding: 5mm; color: #000; margin: 0 auto; }
          .bold { font-weight: bold; }
          .text-center { text-align: center; }
          h1 { font-size: 20px; font-weight: 900; margin: 0 0 10px 0; text-align: center; }
          .divider { border-bottom: 2px dashed #000; margin: 15px 0; }
          .item { margin-bottom: 15px; }
          .ops { font-weight: 900; font-size: 16px; margin-top: 5px; }
        </style>
      </head>
      <body>
         <h1>COSTA E SOUZA</h1>
         <div class="text-center bold">Pedido: #${order.id.split('-')[0].toUpperCase()}</div>
         <div class="divider"></div>
         <div class="bold">Cliente: ${order.customerName}</div>
         <div class="bold">Endereço:</div>
         <div>${order.deliveryAddress || 'Sem Endereço'}</div>
         <div class="divider"></div>
         
         ${order.items.map((i: any) => `
           <div class="item">
             <div class="bold">${i.quantity}x ${i.product.name}</div>
             ${i.comboSides ? `<div class="ops">* ${i.comboSides.toUpperCase()}</div>` : ''}
           </div>
         `).join('')}

         <div class="divider"></div>
         <div class="bold text-center" style="font-size: 18px;">TOTAL: R$ ${order.totalAmount.toFixed(2)}</div>
         <div class="divider"></div>
         <p class="text-center">Preparado às ${new Date().toLocaleTimeString('pt-BR')}</p>
         <script>
            window.onload = function() { window.print(); window.close(); }
         </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      className="bg-[#161616] p-4 rounded-xl border border-[#262626] flex flex-col gap-3 relative shadow-md">
      
      {showPrintBtn && (
        <button onClick={printOrder} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition">
           <Printer className="w-5 h-5" />
        </button>
      )}

      <div>
        <span className="text-zinc-500 font-bold text-xs uppercase block tracking-widest mb-1">ID: {order.id.split('-')[0]}</span>
        <h3 className="text-white font-black text-lg leading-tight w-10/12">{order.customerName}</h3>
      </div>

      <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1f1f1f]">
         {order.items.map((it: any, i: number) => (
           <div key={i} className="mb-2 last:mb-0">
             <span className="text-zinc-400 font-bold text-sm block mb-1">{it.quantity}x {it.product.name}</span>
             {it.comboSides && (
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-2 mt-2">
                  <span className="text-yellow-400 font-black text-base uppercase block leading-snug">{it.comboSides}</span>
                </div>
             )}
           </div>
         ))}
      </div>

      <div className="text-xs text-zinc-500 mt-1 pb-2 border-b border-[#222]">
         <span className="block mb-1 font-bold">📍 Entrega: <span className="font-normal">{order.deliveryAddress || 'N/A'}</span></span>
      </div>

      <button onClick={actionClick} className="w-full bg-[#111] hover:bg-[#222] border border-[#333] py-3 rounded-lg text-white font-black text-xs uppercase tracking-wider transition-colors">
        {actionBtn}
      </button>

    </motion.div>
  )
}
