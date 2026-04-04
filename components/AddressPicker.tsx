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
  brandColor?: string
  phoneBg?: string
  phoneCard?: string
  phoneText?: string
  phoneSubText?: string
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

export default function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  brandColor = '#10b981',
  phoneBg = '#f8fafc',
  phoneCard = '#ffffff',
  phoneText = '#0f172a',
  phoneSubText = '#64748b',
}: AddressPickerProps) {
  const border = phoneSubText + '33'
  const subtleBg = phoneSubText + '18'

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>
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
            className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-200"
            style={isSelected
              ? { borderColor: brandColor, backgroundColor: brandColor + '15' }
              : { borderColor: border, backgroundColor: phoneCard }
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Ícone */}
                <div
                  className="mt-0.5 p-2 rounded-xl shrink-0 transition-colors"
                  style={isSelected
                    ? { backgroundColor: brandColor + '25', color: brandColor }
                    : { backgroundColor: subtleBg, color: phoneSubText }
                  }
                >
                  {getLabelIcon(addr.label)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="font-black text-base tracking-tight"
                      style={{ color: isSelected ? brandColor : phoneText }}
                    >
                      {getLabelEmoji(addr.label)} {addr.label.toUpperCase()}
                    </span>
                    {addr.isDefault && (
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border"
                        style={{ background: subtleBg, color: phoneSubText, borderColor: border }}
                      >
                        PADRÃO
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold leading-snug" style={{ color: isSelected ? phoneText : phoneSubText }}>
                    {addr.rua}, {addr.numero}
                  </p>
                  <p className="text-xs leading-snug mt-0.5 font-medium" style={{ color: isSelected ? brandColor + 'bb' : phoneSubText + '99' }}>
                    {addr.complemento}
                  </p>
                  <p className="text-xs mt-1" style={{ color: phoneSubText + '88' }}>
                    {addr.bairro} · {addr.cidade}/{addr.estado} · {addr.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </p>
                </div>
              </div>

              {/* Radio */}
              <div
                className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={isSelected
                  ? { borderColor: brandColor, backgroundColor: brandColor }
                  : { borderColor: border, backgroundColor: 'transparent' }
                }
              >
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
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-dashed transition-all font-black text-xs uppercase tracking-wider group min-h-[52px]"
        style={{ borderColor: border, color: phoneSubText }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = brandColor + '66'
          ;(e.currentTarget as HTMLButtonElement).style.color = brandColor
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = brandColor + '08'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = border
          ;(e.currentTarget as HTMLButtonElement).style.color = phoneSubText
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
        }}
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        ADICIONAR NOVO ENDEREÇO
      </button>
    </div>
  )
}
