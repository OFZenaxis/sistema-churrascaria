"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
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

type ProductModalProps = {
  product: Product | null
  isOpen: boolean
  isHot?: boolean
  onClose: () => void
  onAddToCart: (item: {
    product: Product,
    optionsText: string,
    totalPrice: number
  }) => void
  storeTheme?: StoreTheme
}

export default function ProductModal({ product, isOpen, isHot, onClose, onAddToCart, storeTheme }: ProductModalProps) {
  const [observation, setObservation] = useState('')
  const { brandColor, phoneBg, phoneCard, phoneText, phoneSubText, phoneBorderRadius } = storeTheme ?? DEFAULT_THEME

  useEffect(() => {
    if (product) {
      setObservation('')
    }
  }, [product])

  if (!product) return null

  const handleAdd = () => {
    onAddToCart({
      product,
      optionsText: observation.trim() || 'Padrão',
      totalPrice: product.price,
    })
  }

  const border = phoneSubText + '33'
  const subtleBg = phoneSubText + '18'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-[28px] overflow-hidden flex flex-col max-h-[92vh] border-t"
            style={{ background: phoneBg, borderColor: border }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full" style={{ background: border }} />
            </div>

            <div className="px-5 pt-2 pb-4 border-b relative" style={{ borderColor: border }}>
              <button
                onClick={onClose}
                className="absolute top-2 right-5 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ background: subtleBg, color: phoneSubText }}
              >
                <X className="w-4 h-4" />
              </button>

              {isHot && (
                <div
                  className="inline-flex mt-1 items-center gap-1 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2 shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  🔥 Destaque
                </div>
              )}

              <h3 className="text-2xl font-black pr-10 leading-tight" style={{ color: phoneText }}>
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: phoneSubText }}>
                  {product.description}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-black uppercase tracking-tight" style={{ color: phoneText }}>
                  Observações
                </h4>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                  style={{ color: phoneSubText, background: subtleBg }}
                >
                  Opcional
                </span>
              </div>
              <textarea
                value={observation}
                onChange={e => setObservation(e.target.value)}
                placeholder="Ex: sem cebola, sem açúcar, molho à parte..."
                maxLength={200}
                rows={4}
                className="w-full rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors border-2"
                style={{
                  background: phoneCard,
                  color: phoneText,
                  borderColor: observation ? brandColor : border,
                  caretColor: brandColor,
                }}
              />
              <p className="text-right text-[10px] mt-1" style={{ color: phoneSubText }}>
                {observation.length}/200
              </p>
            </div>

            {/* Footer / CTA */}
            <div
              className="px-5 pb-[max(env(safe-area-inset-bottom,16px),16px)] pt-4 border-t"
              style={{ background: phoneCard, borderColor: border }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm uppercase tracking-wide" style={{ color: phoneSubText }}>Total</span>
                <span className="font-black text-2xl" style={{ color: brandColor }}>
                  R$ {product.price.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleAdd}
                className="w-full flex justify-between items-center text-white font-black text-sm uppercase px-6 py-4 rounded-xl active:scale-[0.98] transition-all shadow-lg min-h-[56px]"
                style={{ backgroundColor: brandColor, borderRadius: phoneBorderRadius }}
              >
                <span>ADICIONAR</span>
                <span className="bg-black/20 px-2 py-1 rounded text-xs">R$ {product.price.toFixed(2)}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
