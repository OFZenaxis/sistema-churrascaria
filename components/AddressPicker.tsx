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
  if (label === 'Casa') return <Home className="w-4 h-4" />
  if (label === 'Trabalho') return <Briefcase className="w-4 h-4" />
  return <MapPin className="w-4 h-4" />
}

function getLabelEmoji(label: string) {
  if (label === 'Casa') return '🏠'
  if (label === 'Trabalho') return '💼'
  return '📍'
}

export default function AddressPicker({ addresses, selectedId, onSelect, onAddNew }: AddressPickerProps) {
  return (
    <div className="space-y-2.5">
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">
        Endereço de Entrega
      </p>

      {addresses.map((addr, idx) => {
        const isSelected = selectedId === addr.id
        return (
          <motion.button
            key={addr.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelect(addr.id)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
              isSelected
                ? 'border-[#E31C1C] bg-[#E31C1C]/6 shadow-lg shadow-red-950/20'
                : 'border-[#1f1f1f] bg-[#111] hover:border-[#2a2a2a]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Ícone */}
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 transition-colors ${
                  isSelected ? 'bg-[#E31C1C]/20 text-[#E31C1C]' : 'bg-[#1a1a1a] text-zinc-600'
                }`}>
                  {getLabelIcon(addr.label)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  {/* ── LABEL EM DESTAQUE ── */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`font-black text-base tracking-tight ${isSelected ? 'text-[#E31C1C]' : 'text-white'}`}>
                      {getLabelEmoji(addr.label)} {addr.label.toUpperCase()}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1a1a1a] text-zinc-500 uppercase tracking-wider border border-[#2a2a2a]">
                        PADRÃO
                      </span>
                    )}
                  </div>

                  {/* Endereço */}
                  <p className={`text-sm font-bold leading-snug ${isSelected ? 'text-zinc-200' : 'text-zinc-400'}`}>
                    {addr.rua}, {addr.numero}
                  </p>
                  <p className={`text-xs leading-snug mt-0.5 font-medium ${isSelected ? 'text-[#E31C1C]/70' : 'text-zinc-600'}`}>
                    {addr.complemento}
                  </p>
                  <p className="text-zinc-700 text-xs mt-1">
                    {addr.bairro} · {addr.cidade}/{addr.estado} · {addr.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                </div>
              </div>

              {/* Radio */}
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                isSelected ? 'border-[#E31C1C] bg-[#E31C1C]' : 'border-[#333] bg-transparent'
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
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#222] text-zinc-700 hover:border-[#E31C1C]/40 hover:text-[#E31C1C] hover:bg-[#E31C1C]/5 transition-all font-black text-xs uppercase tracking-wider group min-h-[52px]"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        ADICIONAR NOVO ENDEREÇO
      </button>
    </div>
  )
}
