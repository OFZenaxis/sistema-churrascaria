"use client"

import { useState, useTransition, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, Bike, CircleDollarSign, Ruler,
  Loader2, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react'
import { saveDeliverySettings } from '@/app/actions/admin'

// SSR desabilitado — mapbox-gl usa APIs de browser
const DeliveryMap = dynamic(() => import('./DeliveryMap'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────

type DeliveryConfig = {
  storeAddress: string
  storeLat: number | null
  storeLng: number | null
  baseDeliveryFee: number
  deliveryFeePerKm: number
  maxDeliveryRadius: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNum(raw: string): number {
  return parseFloat(raw.replace(',', '.')) || 0
}

function fmtBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Gera até 3 distâncias de simulação a partir do raio máximo.
 * - 33%, 66%, 100% do raio (Math.ceil, sem duplicatas, > 0)
 * - Exemplo: max=15 → [5, 10, 15] | max=5 → [2, 4, 5] | max=1 → [1]
 */
function calcSteps(maxKm: number): number[] {
  if (maxKm <= 0) return []
  const candidates = [
    Math.ceil(maxKm * 0.33),
    Math.ceil(maxKm * 0.66),
    Math.round(maxKm * 10) / 10,
  ]
  const seen = new Set<number>()
  return candidates.filter(v => {
    if (v <= 0 || seen.has(v)) return false
    seen.add(v)
    return true
  })
}

// Rótulos e cores para os steps (alinhados pelo final — o último é sempre a borda limite)
const STEP_STYLE = [
  { label: '33%', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: '66%', badge: 'bg-amber-100  text-amber-700  border-amber-200'  },
  { label: '100%',badge: 'bg-rose-100   text-rose-700   border-rose-200'   },
] as const

function stepStyle(idx: number, total: number) {
  const baseIdx = idx - (3 - total)
  return STEP_STYLE[Math.max(0, baseIdx)] ?? STEP_STYLE[2]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MoneyInput({
  label, hint, value, onChange, icon: Icon,
}: {
  label: string; hint?: string; value: string
  onChange: (v: string) => void; icon: React.ElementType
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none select-none">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9,\.]/g, ''))}
          placeholder="0,00"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-4 py-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ZonasClient({
  storeId,
  initial,
}: {
  storeId: string
  initial: DeliveryConfig
}) {
  const [address, setAddress]       = useState(initial.storeAddress)
  const [baseFeeInput, setBaseFee]  = useState(initial.baseDeliveryFee  === 0 ? '' : String(initial.baseDeliveryFee))
  const [perKmInput,   setPerKm]    = useState(initial.deliveryFeePerKm === 0 ? '' : String(initial.deliveryFeePerKm))
  const [radiusInput,  setRadius]   = useState(String(initial.maxDeliveryRadius))

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial.storeLat && initial.storeLng ? { lat: initial.storeLat, lng: initial.storeLng } : null
  )

  const [saveStatus,  setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg,    setErrorMsg]   = useState<string | null>(null)
  const [geocodeWarn, setGeocodeWarn] = useState<string | null>(null)
  const [pending,     startTransition] = useTransition()

  // ── Raio com debounce para o mapa atualizar suavemente ao digitar ──────────
  // O-05: debounce atualiza apenas estado local (sem requisição em flight);
  // clearTimeout na cleanup cancela o timer antes de disparar — correto e suficiente.
  const [debouncedRadius, setDebouncedRadius] = useState(parseNum(radiusInput))
  useEffect(() => {
    const t = setTimeout(() => setDebouncedRadius(parseNum(radiusInput)), 350)
    return () => clearTimeout(t)
  }, [radiusInput])

  // ── Steps calculados (simulador + anéis do mapa) ──────────────────────────
  const simulatorSteps = useMemo(() => calcSteps(debouncedRadius), [debouncedRadius])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    setErrorMsg(null)
    setGeocodeWarn(null)
    setSaveStatus('idle')

    const baseDeliveryFee  = parseNum(baseFeeInput)
    const deliveryFeePerKm = parseNum(perKmInput)
    const maxDeliveryRadius = parseNum(radiusInput)

    if (maxDeliveryRadius <= 0) { setErrorMsg('O raio máximo deve ser maior que zero.'); return }

    startTransition(async () => {
      const result = await saveDeliverySettings(
        { storeAddress: address, baseDeliveryFee, deliveryFeePerKm, maxDeliveryRadius },
        storeId
      )
      if (!result.success) { setSaveStatus('error'); setErrorMsg(result.error ?? 'Erro desconhecido.'); return }
      if (result.coords)        setCoords(result.coords)
      if (result.geocodeWarning) setGeocodeWarn(result.geocodeWarning)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3500)
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Card: Localização da Loja ──────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Localização da Loja</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Origem do cálculo de distância para cada entrega
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Endereço */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Endereço Completo
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Ex: Rua das Acácias, 320, Centro, Aparecida de Goiânia, GO, Brasil
            </p>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                placeholder="Rua, número, bairro, cidade, estado..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Status das coordenadas */}
          <AnimatePresence mode="wait">
            {coords ? (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800">Coordenadas confirmadas</p>
                  <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800">
                  Coordenadas não definidas — salve o endereço para geocodificar via Mapbox
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Mapa de Raio de Entrega ─────────────────────────────── */}
          <AnimatePresence>
            {coords && simulatorSteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 280 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="rounded-xl overflow-hidden border border-slate-200 shadow-sm"
              >
                <DeliveryMap
                  lat={coords.lat}
                  lng={coords.lng}
                  steps={simulatorSteps}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Card: Tarifação ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Tarifação Dinâmica</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Taxa = Valor Base + (Distância KM × Valor por KM)
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5">
            <MoneyInput
              label="Valor Base"
              hint="Cobrado em qualquer distância"
              value={baseFeeInput}
              onChange={setBaseFee}
              icon={CircleDollarSign}
            />
            <MoneyInput
              label="Valor por KM"
              hint="Acréscimo por cada KM percorrido"
              value={perKmInput}
              onChange={setPerKm}
              icon={Bike}
            />
          </div>
        </div>
      </div>

      {/* ── Card: Raio de Cobertura ────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Raio Máximo de Entrega</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Pedidos fora deste raio são automaticamente recusados
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            Distância Máxima
          </label>
          <div className="relative max-w-[200px]">
            <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              inputMode="decimal"
              value={radiusInput}
              onChange={e => setRadius(e.target.value.replace(/[^0-9,.]/g, ''))}
              placeholder="10"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-12 py-3 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
              KM
            </span>
          </div>
        </div>
      </div>

      {/* ── Simulador Dinâmico ─────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide">Simulador de Frete</h3>
          {debouncedRadius > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              — raio de {debouncedRadius} KM
            </span>
          )}
        </div>

        {simulatorSteps.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-2">
            Defina um raio máximo para ver a simulação.
          </p>
        ) : (
          <div className={`grid gap-4 ${simulatorSteps.length === 3 ? 'grid-cols-3' : simulatorSteps.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {simulatorSteps.map((km, idx) => {
              const fee = parseNum(baseFeeInput) + km * parseNum(perKmInput)
              const style = stepStyle(idx, simulatorSteps.length)
              return (
                <div
                  key={km}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{km} KM</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{fmtBrl(fee)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Avisos / Erros ─────────────────────────────────────────── */}
      <AnimatePresence>
        {geocodeWarn && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-semibold">{geocodeWarn}</p>
          </motion.div>
        )}
        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-red-600 text-sm font-semibold"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Botão Salvar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-60"
        >
          {pending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando e geocodificando...</>
            : saveStatus === 'success'
              ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</>
              : 'Salvar Configurações'}
        </button>

        <AnimatePresence>
          {saveStatus === 'success' && !geocodeWarn && (
            <motion.p
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="text-emerald-600 text-sm font-bold"
            >
              Mapa atualizado via Mapbox
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
