"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { Product, StoreTheme } from './MenuComponent'

const DEFAULT_THEME: StoreTheme = {
  brandColor: '#10b981',
  phoneBg: '#f8fafc',
  phoneCard: '#ffffff',
  phoneText: '#0f172a',
  phoneSubText: '#64748b',
  phoneBorderRadius: '12px',
  layoutStyle: 'list',
  fontFamily: 'sans',
}

export default function ProductCard({
  product,
  isHot,
  isStoreOpen,
  onClick,
  idx,
  storeTheme,
}: {
  product: Product
  isHot: boolean
  isStoreOpen: boolean
  onClick: () => void
  idx: number
  storeTheme?: StoreTheme
}) {
  const { brandColor, phoneCard, phoneText, phoneSubText, phoneBorderRadius } = storeTheme ?? DEFAULT_THEME
  const border = phoneSubText + '22'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      onClick={() => isStoreOpen && onClick()}
      className={`relative rounded-2xl p-3.5 border flex gap-4 transition-all overflow-hidden ${
        isStoreOpen
          ? 'cursor-pointer active:scale-[0.98]'
          : 'opacity-60 cursor-not-allowed grayscale-[0.2]'
      }`}
      style={{ background: phoneCard, borderColor: border }}
    >
      {/* Imagem (100x100 fixed) */}
      <div
        className="w-[100px] h-[100px] shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center border"
        style={{ background: brandColor + '15', borderColor: border }}
      >
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[44px] leading-none select-none" style={{ opacity: 0.25, filter: 'grayscale(1)' }}>🍽️</span>
        )}
      </div>

      {/* Informações: Direita */}
      <div className="flex-1 flex flex-col pt-0.5 pb-1 min-w-0 pr-8">
        <div>
          <h3 className="font-bold text-[15px] leading-snug line-clamp-2 pr-2" style={{ color: phoneText }}>
            {product.name}
          </h3>

          {isHot && (
            <div
              className="inline-flex mt-1.5 items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: brandColor + '20', color: brandColor }}
            >
              🔥 Destaque
            </div>
          )}

          {product.description && (
            <p className="text-[11px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: phoneSubText }}>
              {product.description}
            </p>
          )}
        </div>

        {/* Preço */}
        <div className="mt-auto pt-2.5">
          <span className="font-black text-[17px] tracking-tight" style={{ color: brandColor }}>
            R$ {product.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botão '+' */}
      <div className="absolute bottom-3 right-3">
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isStoreOpen ? 'text-white active:scale-95 shadow-md' : 'text-slate-400'
          }`}
          style={isStoreOpen
            ? { backgroundColor: brandColor }
            : { backgroundColor: phoneSubText + '33' }
          }
          onClick={(e) => { e.stopPropagation(); if (isStoreOpen) onClick() }}
        >
          <Plus className="w-[22px] h-[22px]" />
        </button>
      </div>
    </motion.div>
  )
}
