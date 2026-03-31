"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Home, Briefcase, MapPin, Plus, CheckCircle2 } from 'lucide-react'

export type AddressOption = {
  id: string
  label: string
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  isDefault: boolean
}

type AddressPickerProps = {
  addresses: AddressOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddNew: () => void
}

function getLabelIcon(label: string) {
  if (label === 'Casa') return <Home className="w-5 h-5" />
  if (label === 'Trabalho') return <Briefcase className="w-5 h-5" />
  return <MapPin className="w-5 h-5" />
}

function getLabelEmoji(label: string) {
  if (label === 'Casa') return '🏠'
  if (label === 'Trabalho') return '💼'
  return '📍'
}

export default function AddressPicker({ addresses, selectedId, onSelect, onAddNew }: AddressPickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-3">
        Endereço de Entrega
      </p>

      {addresses.map((addr, idx) => {
        const isSelected = selectedId === addr.id
        return (
          <motion.button
            key={addr.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onSelect(addr.id)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 group ${
              isSelected
                ? 'border-orange-500 bg-orange-500/8 shadow-lg shadow-orange-900/10'
                : 'border-zinc-800 bg-[#0a0a0a] hover:border-zinc-700 hover:bg-zinc-900/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Ícone do tipo */}
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'
                }`}>
                  {getLabelIcon(addr.label)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  {/* Label em negrito + emoji */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-black text-base tracking-tight ${
                      isSelected ? 'text-orange-400' : 'text-white'
                    }`}>
                      {getLabelEmoji(addr.label)} {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                        Padrão
                      </span>
                    )}
                  </div>

                  {/* Endereço completo */}
                  <p className="text-zinc-300 text-sm font-medium leading-snug">
                    {addr.rua}, {addr.numero}
                  </p>
                  <p className={`text-sm leading-snug ${isSelected ? 'text-orange-300/80' : 'text-zinc-500'}`}>
                    {addr.complemento}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {addr.bairro} · {addr.cidade}/{addr.estado} · CEP {addr.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                </div>
              </div>

              {/* Radio visual */}
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                isSelected
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-zinc-700 bg-transparent'
              }`}>
                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </div>
          </motion.button>
        )
      })}

      {/* Botão Novo Endereço */}
      <button
        type="button"
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/5 transition-all font-bold text-sm group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        Adicionar novo endereço
      </button>
    </div>
  )
}
