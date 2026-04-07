'use client'

import { useState } from 'react'

const FORMAT: Intl.NumberFormatOptions = { style: 'currency', currency: 'BRL' }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', FORMAT)
}

export default function EconomyCalculator() {
  const [faturamento, setFaturamento] = useState(20000)

  const taxaMensal = faturamento * 0.2
  const economiaMensal = taxaMensal - 97
  const economiaAnual = economiaMensal * 12

  return (
    <section className="py-14 md:py-24 px-5 bg-slate-900 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#3DAA6E]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[#3DAA6E] font-bold text-xs md:text-sm uppercase tracking-widest mb-3">Calculadora de Economia</p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight text-balance">
            Quanto você está perdendo agora mesmo?
          </h2>
        </div>

        {/* Slider */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Faturamento mensal via apps
            </label>
            <span className="text-white font-black text-lg md:text-2xl tracking-tight">
              {fmt(faturamento)}
            </span>
          </div>

          <input
            type="range"
            min={5000}
            max={150000}
            step={1000}
            value={faturamento}
            onChange={e => setFaturamento(Number(e.target.value))}
            className="w-full h-2 rounded-full outline-none cursor-pointer"
            style={{ accentColor: '#3DAA6E' }}
          />

          <div className="flex justify-between mt-2 text-slate-500 text-xs font-medium">
            <span>R$ 5.000</span>
            <span>R$ 150.000</span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Taxa mensal */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Taxa mensal nos apps
            </p>
            <p className="text-rose-400 font-black text-2xl md:text-3xl tracking-tight">
              {fmt(taxaMensal)}
            </p>
            <p className="text-slate-500 text-xs font-medium mt-1">20% do faturamento</p>
          </div>

          {/* Economia mensal */}
          <div className="bg-[#3DAA6E]/10 border border-[#3DAA6E]/30 rounded-2xl p-5 text-center">
            <p className="text-[#3DAA6E]/70 text-[10px] font-bold uppercase tracking-widest mb-2">
              Economia mensal
            </p>
            <p
              className="font-black text-2xl md:text-3xl tracking-tight"
              style={{ color: economiaMensal > 0 ? '#3DAA6E' : '#f87171' }}
            >
              {fmt(economiaMensal)}
            </p>
            <p className="text-slate-500 text-xs font-medium mt-1">taxa − R$ 97/mês</p>
          </div>

          {/* Economia anual */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
              Economia em 12 meses
            </p>
            <p
              className="font-black text-2xl md:text-3xl tracking-tight"
              style={{ color: economiaAnual > 0 ? '#3DAA6E' : '#f87171' }}
            >
              {fmt(economiaAnual)}
            </p>
            <p className="text-slate-500 text-xs font-medium mt-1">por ano no seu bolso</p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs font-medium mt-6">
          Cálculo baseado na taxa média de 20% cobrada por iFood e similares.
        </p>
      </div>
    </section>
  )
}
