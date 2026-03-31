"use client"

import React, { useEffect, useState } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getOrderLocation } from '@/app/actions/tracker'
import { Navigation, Compass } from 'lucide-react'

// You must define NEXT_PUBLIC_MAPBOX_TOKEN in your .env
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

type TrackerProps = {
  orderId: string
  onDelivered?: () => void
}

export default function CustomerTracker({ orderId, onDelivered }: TrackerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [viewState, setViewState] = useState({
    longitude: -47.9292, // Default Brasilia/Luziania bounding box
    latitude: -15.7801,
    zoom: 14
  })

  const [orderStatus, setOrderStatus] = useState<string>('PENDING')

  useEffect(() => {
    let interval: NodeJS.Timeout

    const fetchLocation = async () => {
      const res = await getOrderLocation(orderId)
      if (res.success && res.data) {
        setOrderStatus(res.data.status)
        
        if (res.data.status === 'DELIVERED') {
          onDelivered?.()
          return
        }

        // @ts-ignore
        if (res.data && res.data.driverLat && res.data.driverLng) {
          // @ts-ignore
          setLocation({ lat: res.data.driverLat, lng: res.data.driverLng })
          
          setViewState(prev => ({
            ...prev,
            // @ts-ignore
            latitude: res.data.driverLat as number,
            // @ts-ignore
            longitude: res.data.driverLng as number,
          }))
        }
      }
    }

    fetchLocation()
    interval = setInterval(fetchLocation, 4000)

    return () => clearInterval(interval)
  }, [orderId, onDelivered])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-64 sm:h-80 w-full bg-zinc-900 rounded-2xl flex items-center justify-center flex-col text-zinc-500 border border-zinc-800 p-6 text-center">
        <Compass className="w-8 h-8 mb-2 opacity-50" />
        <p className="font-medium text-sm">Mapbox Token ausente.</p>
        <p className="text-xs mt-1">Configure o NEXT_PUBLIC_MAPBOX_TOKEN no .env</p>
      </div>
    )
  }

  // Tela de "Pedido Sendo Preparado"
  if (orderStatus !== 'DISPATCHED' && orderStatus !== 'DELIVERED') {
    return (
      <div className="h-64 sm:h-80 w-full bg-[#111] rounded-2xl flex items-center justify-center flex-col text-zinc-500 border border-zinc-800 p-6 text-center shadow-inner">
        <div className="w-12 h-12 rounded-full border-t-2 border-l-2 border-orange-500 animate-spin mb-4" />
        <h3 className="text-xl font-black text-white mb-2">Pedido Sendo Preparado</h3>
        <p className="text-sm text-zinc-400">Aguardando o motoboy aceitar a corrida.</p>
      </div>
    )
  }

  return (
    <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden relative shadow-lg shadow-black/50 border border-zinc-800">
      
      {!location && (
        <div className="absolute inset-0 z-10 bg-[#111] flex flex-col items-center justify-center text-zinc-500">
          <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-orange-500 animate-spin mb-4" />
          <p className="font-bold text-sm tracking-widest uppercase text-orange-500">Sincronizando GPS...</p>
        </div>
      )}

      {/* Mapbox */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
      >
        {location && (
          <Marker 
            longitude={location.lng} 
            latitude={location.lat}
            anchor="bottom"
          >
            <div className="relative group cursor-pointer">
              {/* O Pulsar do Radar */}
              <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-md animate-ping" />
              
              {/* Ícone da Moto */}
              <div className="bg-orange-500 p-2.5 rounded-full shadow-[0_0_20px_rgba(234,88,12,0.6)] relative z-10 transform transition-transform group-hover:scale-110">
                <Navigation className="w-4 h-4 text-white transform rotate-45" />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Overlay UI (Status flutuante sobre o mapa) */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-center">
        <div className="bg-[#111]/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-700/50 shadow-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-zinc-200">Pedido à Caminho</span>
        </div>
      </div>
    </div>
  )
}
