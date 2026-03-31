"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, CheckCircle2 } from 'lucide-react'
import type { Product } from './MenuComponent'

type ProductModalProps = {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: { 
    product: Product, 
    optionsText: string, 
    totalPrice: number,
    upsellIds?: string[]
  }) => void
}

const REMOVAL_OPTIONS = ['Cebola', 'Feijão Tropeiro', 'Mandioca', 'Vinagrete']
const MIX_PREFERENCES = [
  'Mix Padrão (Assado, Frango, Linguiça)', 
  'Caprichar na Carne Assada', 
  'Mais Linguiça', 
  'Só Frango',
  'Sem Frango'
]
const UPSELLS = [
  { id: 'u1', name: 'Carne Assada Extra', price: 10.0 },
  { id: 'u2', name: 'Linguiça Toscana Extra', price: 4.0 },
  { id: 'u3', name: 'Ovo Frito', price: 3.0 }
]

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [removals, setRemovals] = useState<string[]>([])
  const [mixPref, setMixPref] = useState<string>(MIX_PREFERENCES[0])
  const [upsells, setUpsells] = useState<string[]>([]) // Array of upsell IDs

  // Reset state when a new product is selected
  useEffect(() => {
    if (product) {
      setRemovals([])
      setMixPref(MIX_PREFERENCES[0])
      setUpsells([])
    }
  }, [product])

  if (!product) return null

  // Calc total price
  const upsellTotal = upsells.reduce((acc, upId) => {
    const u = UPSELLS.find(x => x.id === upId)
    return acc + (u ? u.price : 0)
  }, 0)
  const totalPrice = product.price + upsellTotal

  const handleToggleRemoval = (opt: string) => {
    setRemovals(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  const handleToggleUpsell = (id: string) => {
    setUpsells(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id])
  }

  const handleAdd = () => {
    // Build options text to send to cart
    let optsArray = []
    if (mixPref !== MIX_PREFERENCES[0]) optsArray.push(`Preferência: ${mixPref}`)
    if (removals.length > 0) optsArray.push(`Sem: ${removals.join(', ')}`)
    if (upsells.length > 0) {
      const upNames = upsells.map(uId => UPSELLS.find(x => x.id === uId)?.name)
      optsArray.push(`Extras: ${upNames.join(', ')}`)
    }
    const finalOptsText = optsArray.length > 0 ? optsArray.join(' | ') : 'Padrão'

    onAddToCart({
      product,
      optionsText: finalOptsText,
      totalPrice,
      upsellIds: upsells  // IDs dos extras selecionados, validados server-side
    })
  }

  const isMarmita = product.type === 'COMBO' && product.name.toLowerCase().includes('marmita')

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/85 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[#0f0f0f] w-full max-w-lg rounded-t-[28px] border-t border-[#222] overflow-hidden flex flex-col max-h-[92vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-[#333] rounded-full" />
            </div>

            <div className="px-5 pt-2 pb-4 border-b border-[#1a1a1a] relative">
              <button 
                onClick={onClose} 
                className="absolute top-2 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-zinc-500 hover:bg-[#222] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              {product.name === 'Marmita Churrasco G' && (
                <div className="inline-flex mt-1 items-center gap-1 bg-[#E31C1C] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2 shadow-sm shadow-red-900/30">
                  🔥 A MAIS PEDIDA
                </div>
              )}
              
              <h3 className="text-2xl font-black text-white pr-10 leading-tight">{product.name}</h3>
              {product.description && (
                <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-8">

              {isMarmita ? (
                <>
                  {/* Seção 1: Remoções */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-base font-black text-white uppercase tracking-tight">Deseja remover algo?</h4>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-[#1a1a1a] px-2 py-1 rounded">Opcional</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {REMOVAL_OPTIONS.map(opt => {
                        const isRemoved = removals.includes(opt)
                        return (
                          <button
                            key={opt}
                            onClick={() => handleToggleRemoval(opt)}
                            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                              isRemoved 
                                ? 'border-[#E31C1C] bg-[#E31C1C]/10 text-white' 
                                : 'border-[#1f1f1f] bg-[#111] text-zinc-400 hover:border-[#333]'
                            }`}
                          >
                            <span className="text-xs font-bold">{opt}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isRemoved ? 'border-[#E31C1C] bg-[#E31C1C]' : 'border-[#333] bg-transparent'
                            }`}>
                              {isRemoved && <Minus className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Seção 2: Preferência de Mix */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-base font-black text-white uppercase tracking-tight">Preferência do Mix</h4>
                      <span className="text-[10px] font-bold text-[#E31C1C] uppercase tracking-widest bg-[#E31C1C]/10 px-2 py-1 rounded">1 Obrigatório</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {MIX_PREFERENCES.map(pref => {
                        const isSelected = mixPref === pref
                        return (
                          <button
                            key={pref}
                            onClick={() => setMixPref(pref)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all min-h-[56px] ${
                              isSelected 
                                ? 'border-[#E31C1C] bg-[#E31C1C]/10' 
                                : 'border-[#1f1f1f] bg-[#111] hover:border-[#333]'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? 'border-[#E31C1C] bg-[#E31C1C]' : 'border-[#333] bg-transparent'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                            </div>
                            <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{pref}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Seção 3: Up-sells */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-base font-black text-white uppercase tracking-tight text-yellow-500">Turbine sua Marmita</h4>
                      <span className="text-[20px]">🚀</span>
                    </div>
                    <div className="space-y-2">
                      {UPSELLS.map(up => {
                        const isSelected = upsells.includes(up.id)
                        return (
                          <button
                            key={up.id}
                            onClick={() => handleToggleUpsell(up.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all min-h-[60px] ${
                              isSelected 
                                ? 'border-yellow-500/50 bg-yellow-500/10' 
                                : 'border-[#1f1f1f] bg-[#111] hover:border-[#333]'
                            }`}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className={`text-sm font-bold ${isSelected ? 'text-yellow-500' : 'text-zinc-300'}`}>{up.name}</span>
                              <span className="text-xs font-black text-yellow-600/70">+ R$ {up.price.toFixed(2)}</span>
                            </div>
                            
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-[#333] bg-transparent'
                            }`}>
                              {isSelected ? <CheckCircle2 className="w-4 h-4 text-black" /> : <Plus className="w-3.5 h-3.5 text-zinc-500" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Para itens que não são Marmita (Bebidas, Adicionais puros, etc) */
                <div className="py-6 text-center text-zinc-500">
                  <p>Adicione diretamente ao pedido.</p>
                </div>
              )}

            </div>

            {/* Footer / CTA */}
            <div className="px-5 pb-[max(env(safe-area-inset-bottom,16px),16px)] pt-4 border-t border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-500 font-bold text-sm uppercase tracking-wide">Total</span>
                <span className="text-[#E31C1C] font-black text-2xl">R$ {totalPrice.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleAdd} 
                className="w-full flex justify-between items-center bg-[#E31C1C] text-white font-black text-sm uppercase px-6 py-4 rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-red-900/30 min-h-[56px]"
              >
                <span>{isMarmita ? 'GARANTIR MINHA MARMITA' : 'ADICIONAR'}</span>
                {totalPrice > 0 && <span className="bg-black/20 px-2 py-1 rounded text-xs">R$ {totalPrice.toFixed(2)}</span>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
