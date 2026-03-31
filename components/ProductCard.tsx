"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { Product } from './MenuComponent'

export default function ProductCard({
  product,
  isHot,
  isStoreOpen,
  onClick,
  idx
}: {
  product: Product,
  isHot: boolean,
  isStoreOpen: boolean,
  onClick: () => void,
  idx: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={() => isStoreOpen && onClick()}
      className={`relative bg-[#111] rounded-2xl p-3.5 border border-[#1f1f1f] flex gap-4 transition-all overflow-hidden ${
        isStoreOpen ? 'cursor-pointer hover:border-[#2a2a2a] active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
      }`}
    >
      {/* Imagem (100x100 fixed) */}
      <div className="w-[100px] h-[100px] shrink-0 bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden relative flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[50px] opacity-20 leading-none">🥩</span>
        )}
      </div>

      {/* Informações: Direita */}
      <div className="flex-1 flex flex-col pt-0.5 pb-1 min-w-0 pr-8">
        <div>
          {/* Título com truncate se for muito longo */}
          <h3 className="font-bold text-white text-[15px] leading-snug line-clamp-2 pr-2">
            {product.name}
          </h3>
          {/* Bandeira de Prova Social */}
          {isHot && (
            <div className="inline-flex mt-1 items-center gap-1 bg-[#E31C1C] text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">
              {product.name === 'Marmita Churrasco G' 
                ? '🔥 A MAIS PEDIDA NO JARDIM INGÁ' 
                : '🔥 18 pediram hoje'
              }
            </div>
          )}
          {product.description && (
            <p className="text-zinc-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Preço em destaque */}
        <div className="mt-auto pt-2">
          <span className="text-[#E31C1C] font-black text-[17px] tracking-tight">
            R$ {product.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botão '+' Inferior Direito (Touch Size maior) */}
      <div className="absolute bottom-2.5 right-2.5">
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isStoreOpen 
              ? 'bg-[#E31C1C] text-white hover:bg-[#FF2E2E] active:scale-95 shadow-md shadow-red-900/20' 
              : 'bg-[#222] text-zinc-600'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            if (isStoreOpen) onClick()
          }}
        >
          <Plus className="w-[22px] h-[22px]" />
        </button>
      </div>

      {/* Tag de COMBO absoluta no topo-direito */}
      {product.type === 'COMBO' && (
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-[#333] px-1.5 py-0.5 rounded text-[9px] font-black text-white tracking-widest uppercase">
          Combo
        </div>
      )}
    </motion.div>
  )
}
