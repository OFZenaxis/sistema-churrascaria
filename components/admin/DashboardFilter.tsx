"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronDown, Check } from 'lucide-react'

const OPTIONS = [
  { value: 'today',     label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d',        label: 'Últimos 7 dias' },
  { value: '30d',       label: 'Últimos 30 dias' },
  { value: 'month',     label: 'Este Mês' },
] as const

export type PeriodValue = typeof OPTIONS[number]['value']

export default function DashboardFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = (searchParams.get('period') ?? '7d') as PeriodValue

  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const currentLabel = OPTIONS.find(o => o.value === current)?.label ?? 'Últimos 7 dias'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filtrar período: ${currentLabel}`}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
      >
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
        <span>{currentLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Selecionar período" className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
          {OPTIONS.map(option => {
            const isActive = option.value === current
            return (
              <button
                key={option.value}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  router.push(`?period=${option.value}`)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50/50 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                {option.label}
                {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
