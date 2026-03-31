"use client"

import React, { useState, useTransition, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, CheckCircle2, DollarSign, Clock, LayoutDashboard, Loader2, Map as MapIcon } from 'lucide-react'
import Link from 'next/link'
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
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
  customerLat?: number | null
  customerLng?: number | null
  customerPhone?: string | null
  customerName?: string | null
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
  const [motoboyCoords, setMotoboyCoords] = useState<{lat: number, lng: number} | null>(null)
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null)
  
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const activeRide = myRides.find(r => r.status === 'DISPATCHED')

  // GPS Watch
  useEffect(() => {
    let watchId: number

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMotoboyCoords({ lat: latitude, lng: longitude })
          
          if (activeRide) {
            updateMotoboyLocation(activeRide.id, latitude, longitude).catch(console.error)
          }
        },
        (error) => {
          console.error("Erro GPS:", error.message)
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }

    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [activeRide])

  // Fetch Mapbox Directions when moto and customer coords exist
  useEffect(() => {
    async function fetchRoute() {
      if (!motoboyCoords || !activeRide?.customerLat || !activeRide?.customerLng || !token) return
      
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${motoboyCoords.lng},${motoboyCoords.lat};${activeRide.customerLng},${activeRide.customerLat}?geometries=geojson&access_token=${token}`
        const res = await fetch(url)
        const data = await res.json()
        
        if (data.routes && data.routes.length > 0) {
          setRouteGeoJSON(data.routes[0].geometry)
        }
      } catch (err) {
        console.error("Erro ao buscar rota Mapbox", err)
      }
    }

    fetchRoute()
    // Atualiza a rota a cada 30 segundos
    const int = setInterval(fetchRoute, 30000)
    return () => clearInterval(int)
  }, [motoboyCoords, activeRide, token])

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
      setRouteGeoJSON(null) // limpa rota do mapa
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto font-sans antialiased text-zinc-100 flex flex-col">
      
      {/* MAPA FULLSCREEN se tiver corrida ativa (Efeito Waze) */}
      <div className={`relative transition-all duration-700 w-full ${activeRide ? 'h-[50vh]' : 'h-[0vh] overflow-hidden'}`}>
        {motoboyCoords && token && (
          <Map
            initialViewState={{
              longitude: motoboyCoords.lng,
              latitude: motoboyCoords.lat,
              zoom: 14
            }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={token}
          >
            {/* Marcador Motoboy */}
            <Marker longitude={motoboyCoords.lng} latitude={motoboyCoords.lat}>
               <div className="bg-orange-500 p-2 rounded-full absolute -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(234,88,12,1)] border-2 border-white">
                 <Navigation className="w-5 h-5 text-white fill-white" />
               </div>
            </Marker>

            {/* Marcador Cliente */}
            {activeRide?.customerLng && activeRide?.customerLat && (
              <Marker longitude={activeRide.customerLng} latitude={activeRide.customerLat}>
                 <div className="bg-blue-500 p-2 rounded-full absolute -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg">
                   <MapPin className="w-4 h-4 text-white" />
                 </div>
              </Marker>
            )}

            {/* Linha de Rota (Mapbox Source) */}
            {routeGeoJSON && (
              <Source id="route-source" type="geojson" data={{ type: 'Feature', geometry: routeGeoJSON, properties: {} } as any}>
                <Layer 
                  id="route-line" 
                  type="line" 
                  paint={{
                    'line-color': '#f97316',
                    'line-width': 6,
                    'line-opacity': 0.8
                  }} 
                  layout={{
                    'line-join': 'round',
                    'line-cap': 'round'
                  }}
                />
              </Source>
            )}
          </Map>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />
      </div>

      <div className="flex-1 overflow-y-auto pb-24 relative z-10">
        <header className="bg-[#111] border-b border-zinc-900 sticky top-0 z-40 shadow-xl rounded-t-[2rem] mt-[-2rem] pt-6">
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
          {activeRide && (
            <section>
              <h2 className="text-sm font-black text-emerald-400 tracking-widest uppercase mb-4 px-2 flex items-center gap-2">
                <Navigation className="w-4 h-4" /> Em Rota
              </h2>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl shadow-emerald-900/10 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="pr-4">
                    <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded">#{activeRide.id.slice(0,5)}...</span>
                    <h3 className="font-bold text-zinc-100 text-xl mt-2">{activeRide.neighborhood}</h3>
                    <p className="text-zinc-400 text-sm mt-1 flex items-start gap-1">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
                      <span className="line-clamp-2">{activeRide.address}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-2xl text-emerald-400">R$ {activeRide.payout.toFixed(2)}</p>
                    <p className="text-xs text-zinc-500 font-bold mt-1 bg-zinc-800/50 px-2 py-1 rounded inline-block">{activeRide.distance}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-2 relative z-10">
                  <button 
                    onClick={() => {
                      if (activeRide.customerPhone) {
                        const phone = activeRide.customerPhone.replace(/\D/g, '')
                        const countryPhone = phone.startsWith('55') ? phone : `55${phone}`
                        const msg = encodeURIComponent(`Olá ${activeRide.customerName || 'cliente'}! Sou o entregador e já estou a caminho com seu pedido. Em breve chego! 🏍️🔥`)
                        window.open(`https://wa.me/${countryPhone}?text=${msg}`)
                      }
                    }}
                    className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold py-4 rounded-xl flex justify-center items-center gap-1 transition-colors border border-emerald-500/30 text-sm"
                  >
                    <span>💬</span> WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                        if (activeRide.customerLat && activeRide.customerLng) {
                           window.open(`https://waze.com/ul?ll=${activeRide.customerLat},${activeRide.customerLng}&navigate=yes`)
                        } else {
                           alert('Coordenadas do cliente não encontradas.')
                        }
                    }}
                    className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors border border-blue-500/30"
                  >
                    <MapIcon className="w-5 h-5"/> Waze
                  </button>
                  <button 
                    onClick={() => handleFinish(activeRide.id)}
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.98] transition-all text-white font-black py-4 rounded-xl shadow-[0_8px_30px_rgb(16,185,129,0.3)] flex justify-center items-center gap-2"
                  >
                    {processingId === activeRide.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Entregue</>}
                  </button>
                </div>
              </motion.div>
            </section>
          )}

          {!activeRide && (
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
                      key="empty"
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
          )}

        </main>
      </div>
    </div>
  )
}
