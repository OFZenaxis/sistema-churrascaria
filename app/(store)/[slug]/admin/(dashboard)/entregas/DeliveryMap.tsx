"use client"

import { useEffect, useRef, useState } from 'react'
import Map, { Source, Layer, Marker, NavigationControl, MapRef } from 'react-map-gl/mapbox'
import { circle } from '@turf/turf'
import 'mapbox-gl/dist/mapbox-gl.css'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// Estilos dos anéis: índice 0 = mais interno (33%), índice 2 = limite máximo (100%)
const RING_STYLES = [
  { fill: '#10b981', fillOpacity: 0.13, stroke: '#10b981', strokeOpacity: 0.55, dashed: true  },
  { fill: '#f59e0b', fillOpacity: 0.10, stroke: '#f59e0b', strokeOpacity: 0.55, dashed: true  },
  { fill: '#ef4444', fillOpacity: 0.07, stroke: '#ef4444', strokeOpacity: 0.70, dashed: false },
] as const

function styleForIndex(idx: number, total: number) {
  const baseIdx = idx - (3 - total)
  return RING_STYLES[Math.max(0, baseIdx)] ?? RING_STYLES[2]
}

function autoZoom(maxKm: number): number {
  if (maxKm <= 1)  return 14
  if (maxKm <= 2)  return 13
  if (maxKm <= 4)  return 12
  if (maxKm <= 8)  return 11
  if (maxKm <= 16) return 10
  if (maxKm <= 32) return  9
  return 8
}

export default function DeliveryMap({
  lat,
  lng,
  steps,
  onMarkerDragEnd,
}: {
  lat: number
  lng: number
  steps: number[]
  onMarkerDragEnd?: (lat: number, lng: number) => void
}) {
  const mapRef = useRef<MapRef>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Fly to quando as coords mudam por fora (live preview / salvar)
  // Não causa remount — apenas anima a câmera para o novo centro
  useEffect(() => {
    mapRef.current?.flyTo({ center: [lng, lat], duration: 900, essential: true })
  }, [lat, lng])

  const total = steps.length
  const maxKm = steps[steps.length - 1] ?? 10
  const zoom  = autoZoom(maxKm)

  // Anéis: do maior ao menor para os internos ficarem por cima
  const ringsReversed = [...steps]
    .map((km, idx) => ({ km, idx }))
    .reverse()
    .map(({ km, idx }) => ({
      sourceId: `delivery-ring-${idx}`,
      geojson: circle([lng, lat], km, { units: 'kilometers', steps: 80 }),
      style: styleForIndex(idx, total),
    }))

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={TOKEN}
      initialViewState={{ longitude: lng, latitude: lat, zoom }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      reuseMaps
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {ringsReversed.map(({ sourceId, geojson, style }) => (
        <Source key={sourceId} id={sourceId} type="geojson" data={geojson}>
          <Layer
            id={`${sourceId}-fill`}
            type="fill"
            paint={{ 'fill-color': style.fill, 'fill-opacity': style.fillOpacity }}
          />
          <Layer
            id={`${sourceId}-line`}
            type="line"
            paint={{
              'line-color': style.stroke,
              'line-opacity': style.strokeOpacity,
              'line-width': 2,
              ...(style.dashed ? { 'line-dasharray': [4, 4] } : {}),
            }}
          />
        </Source>
      ))}

      {/* Marcador arrastável */}
      <Marker
        longitude={lng}
        latitude={lat}
        anchor="center"
        draggable
        onDragStart={() => setIsDragging(true)}
        onDragEnd={e => {
          setIsDragging(false)
          const { lng: newLng, lat: newLat } = e.lngLat
          onMarkerDragEnd?.(newLat, newLng)
        }}
      >
        <div className="relative flex items-center justify-center" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          {/* Anel pulsante — congela durante o drag para não distrair */}
          {!isDragging && (
            <span
              className="absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-50 animate-ping"
              style={{ animationDuration: '2s' }}
            />
          )}
          {/* Pin central */}
          <div
            className={`relative w-9 h-9 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-blue-500 scale-110' : 'bg-emerald-500'
            }`}
            style={{ transform: isDragging ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s, background-color 0.15s' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      </Marker>
    </Map>
  )
}
