"use client"

import React, { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, CheckCircle2, DollarSign, Clock, LayoutDashboard, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { acceptRide, finishRide } from '../actions/driver'
import { updateMotoboyLocation } from '../actions/tracker'

type Ride = {
  id: string
  address: string
  neighborhood: string
  distance: string
  payout: number
  status: 'READY_FOR_PICKUP' | 'DISPATCHED' | 'DELIVERED'
  timeElapsed: string
}

export default function MotoboyClient({ 
  availableRides, 
  myRides, 
  completedRidesTotal, 
  totalEarned 
}: { 
  availableRides: Ride[], 
  myRides: Ride[],
  completedRidesTotal: number,
  totalEarned: number
}) {
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (myRides.length === 0) return

    let watchId: number

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          myRides.forEach(ride => {
            // ping the server
            updateMotoboyLocation(ride.id, latitude, longitude).catch(console.error)
          })
        },
        (error) => {
          console.error("Erro GPS:", error.message)
          alert("Por favor, ative o GPS no seu dispositivo para o rastreamento funcionar.")
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }

    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [myRides])

  const handleAccept = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      await acceptRide(id)
      setProcessingId(null)
    })
  }

  const handleFinish = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      await finishRide(id)
      setProcessingId(null)
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto font-sans antialiased text-zinc-100 pb-24 selection:bg-orange-500/30">
      
      {/* Header Premium do App */}
      <header className="bg-[#111] border-b border-zinc-900 sticky top-0 z-40 shadow-xl">
        <div className="px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-zinc-900 p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-orange-500 font-black text-2xl tracking-tighter">DRIVER</span>
              <span className="text-zinc-500 font-bold ml-1 text-sm tracking-widest">APP</span>
            </div>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 font-bold text-sm">Online</span>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="px-6 pb-5 pt-2 grid grid-cols-2 gap-4">
          <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-zinc-800 shadow-inner">
            <p className="text-zinc-500 text-xs font-bold mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Hoje</p>
            <p className="text-2xl font-black text-white">{completedRidesTotal} <span className="text-sm font-medium text-zinc-500">entregas</span></p>
          </div>
          <div className="bg-orange-500/5 rounded-2xl p-4 border border-orange-500/20 shadow-inner overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl" />
            <p className="text-orange-500/70 text-xs font-bold mb-1 flex items-center gap-1 relative z-10"><DollarSign className="w-3 h-3" /> Ganhos</p>
            <p className="text-2xl font-black text-orange-400 relative z-10">R$ {totalEarned.toFixed(2)}</p>
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-8 max-w-2xl mx-auto">

        {/* Minhas Corridas Ativas */}
        {myRides.length > 0 && (
          <section>
            <h2 className="text-sm font-black text-emerald-400 tracking-widest uppercase mb-4 px-2 flex items-center gap-2">
              <Navigation className="w-4 h-4" /> Em Andamento
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {myRides.map(ride => (
                  <motion.div 
                    key={ride.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-zinc-900 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl shadow-emerald-900/10 overflow-hidden relative"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="pr-4">
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded">#{ride.id.slice(0,5)}...</span>
                        <h3 className="font-bold text-zinc-100 text-xl mt-2">{ride.neighborhood}</h3>
                        <p className="text-zinc-400 text-sm mt-1 flex items-start gap-1">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
                          <span className="line-clamp-2">{ride.address}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-2xl text-emerald-400">R$ {ride.payout.toFixed(2)}</p>
                        <p className="text-xs text-zinc-500 font-bold mt-1 bg-zinc-800/50 px-2 py-1 rounded inline-block">{ride.distance}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleFinish(ride.id)}
                      disabled={isPending}
                      className="relative z-10 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.98] transition-all text-white font-black text-xl py-5 rounded-2xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] mt-2 flex justify-center items-center gap-2"
                    >
                      {processingId === ride.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Entregue</>}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Corridas Disponíveis */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-black text-zinc-400 tracking-widest uppercase shadow-sm">
              Novas Entregas
            </h2>
            {availableRides.length > 0 && (
              <span className="bg-orange-500 text-black text-xs font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-orange-500/20">
                {availableRides.length} na fila
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {availableRides.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="bg-[#111] border border-dashed border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center shadow-inner"
                >
                  <div className="bg-zinc-900 p-4 rounded-full mb-4">
                    <Navigation className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 font-bold">Buscando novas corridas...</p>
                </motion.div>
              ) : (
                availableRides.map(ride => (
                  <motion.div 
                    key={ride.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#111] border border-zinc-800 rounded-3xl p-5 shadow-xl hover:border-orange-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex-1 pr-4">
                        <div className="flex gap-2 items-center mb-2">
                          <span className="text-zinc-500 font-mono text-xs font-bold">#{ride.id.slice(0,5)}...</span>
                          <span className="text-orange-400/80 text-[10px] font-black uppercase flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded tracking-wider border border-orange-500/20">
                            <Clock className="w-3 h-3" /> {ride.timeElapsed} wait
                          </span>
                        </div>
                        <h3 className="font-bold text-zinc-100 text-lg">{ride.neighborhood}</h3>
                        <p className="text-zinc-400 text-sm mt-1 line-clamp-1">{ride.address}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-2xl text-orange-400 pb-1">R$ {ride.payout.toFixed(2)}</p>
                        <p className="text-xs text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">{ride.distance}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAccept(ride.id)}
                      disabled={isPending}
                      className="w-full bg-orange-600 disabled:opacity-50 flex items-center justify-center active:bg-orange-700 active:scale-[0.98] transition-all text-white font-black text-lg py-4 rounded-xl shadow-[0_8px_30px_rgb(234,88,12,0.2)]"
                    >
                      {processingId === ride.id ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Aceitar Corrida'}
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>
    </div>
  )
}
