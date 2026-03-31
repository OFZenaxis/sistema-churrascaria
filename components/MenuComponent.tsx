"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ShoppingBag, Check, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { submitOrder } from '../app/actions/checkout'

const CustomerTracker = dynamic(() => import('./CustomerTracker'), { ssr: false })

type Product = {
  id: string
  name: string
  description: string
  price: number
  type: 'CUT' | 'SIDE' | 'BEVERAGE' | 'COMBO'
  maxSides?: number
  categoryId?: string
}

// O MOCK_PRODUCTS que assemelha-se ao do banco
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Picanha Angus (500g)', description: 'Extremamente macio e suculento.', price: 129.9, type: 'CUT' },
  { id: '2', name: 'Bife Ancho (400g)', description: 'Extraído do lombo do boi.', price: 95.0, type: 'CUT' },
  { id: '7', name: 'Maminha na Manteiga (500g)', description: 'Sabor característico da manteiga.', price: 85.0, type: 'CUT' },
  { id: '3', name: 'Combo Picanha Padrão', description: '1 Picanha + 3 Acompanhamentos à escolha.', price: 159.0, type: 'COMBO', maxSides: 3 },
  { id: '4', name: 'Arroz Biro-Biro', description: 'O clássico arroz.', price: 15.9, type: 'SIDE' },
  { id: '5', name: 'Fritas Rústicas', description: 'Batatas com corte artesanal.', price: 18.0, type: 'SIDE' },
  { id: '6', name: 'Farofa de Ovos', description: 'Receita da Casa.', price: 12.9, type: 'SIDE' },
  { id: '8', name: 'Salada de Maionese', description: 'A tradicional recita caseira.', price: 14.5, type: 'SIDE' },
]

type CartItem = {
  id: string
  product: Product
  doneness?: string
  sides: string[]
  totalPrice: number
}

export default function MenuComponent() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [doneness, setDoneness] = useState<string>('') 
  const [selectedSides, setSelectedSides] = useState<string[]>([])
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const cuts = MOCK_PRODUCTS.filter(p => p.type === 'CUT' || p.type === 'COMBO')
  const sides = MOCK_PRODUCTS.filter(p => p.type === 'SIDE')

  // Bloqueia scroll do fundo
  useEffect(() => {
    if (isModalOpen || activeOrderId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, activeOrderId])

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setDoneness('')
    setSelectedSides([])
    setIsModalOpen(true)
  }

  const closeProductModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }

  const handleSelectSide = (sideId: string) => {
    if (!selectedProduct?.maxSides) return

    if (selectedSides.includes(sideId)) {
      setSelectedSides(prev => prev.filter(id => id !== sideId))
    } else {
      if (selectedSides.length < selectedProduct.maxSides) {
        setSelectedSides(prev => [...prev, sideId])
      } else {
        alert(`Você só pode escolher até ${selectedProduct.maxSides} acompanhamentos.`)
      }
    }
  }

  const addToCart = () => {
    if (!selectedProduct) return
    if ((selectedProduct.type === 'CUT' || selectedProduct.type === 'COMBO') && !doneness) {
      alert('Por favor, selecione o ponto da carne obrigatoriamente!')
      return
    }
    if (selectedProduct.type === 'COMBO' && selectedSides.length === 0) {
       alert('Por favor, selecione ao menos um acompanhamento!')
       return 
    }

    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      product: selectedProduct,
      doneness: doneness,
      sides: selectedSides,
      totalPrice: selectedProduct.price
    }

    setCart(prev => [...prev, newItem])
    closeProductModal()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setIsProcessing(true)

    const cartTotalAmount = cart.reduce((acc, item) => acc + item.totalPrice, 0)
    const res = await submitOrder(cartTotalAmount)
    
    setIsProcessing(false)
    if (res.success && res.orderId) {
      setCart([])
      setActiveOrderId(res.orderId)
    } else {
      alert("Oops! Ocorreu um erro ao processar o pedido.")
    }
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      
      {/* Tracker Modal GPS */}
      <AnimatePresence>
        {activeOrderId && (
          <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111] w-full max-w-xl rounded-[2rem] border border-zinc-800 overflow-hidden shadow-2xl flex flex-col relative"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <button 
                onClick={() => setActiveOrderId(null)}
                className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full text-zinc-400 hover:text-white border border-zinc-700/50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-2">
                <CustomerTracker 
                  orderId={activeOrderId} 
                  onDelivered={() => {
                    setTimeout(() => setActiveOrderId(null), 5000)
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Esquerda: Menu principal - Ocupa 2/3 no Desktop */}
      <div className="lg:col-span-2 pb-32 lg:pb-0">
        <h2 className="text-3xl font-black mb-8 text-white tracking-tight">Especialidades da Casa</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cuts.map(product => (
            <div 
              key={product.id} 
              className="bg-[#111] rounded-3xl border border-zinc-800 p-6 cursor-pointer hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-900/10 transition-all duration-300 group flex flex-col justify-between h-full"
              onClick={() => openProductModal(product)}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-2xl text-zinc-100">{product.name}</h3>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2">{product.description}</p>
              </div>
              
              <div className="mt-8 flex items-end justify-between">
                <span className="font-black text-orange-400 text-2xl">R$ {product.price.toFixed(2)}</span>
                <span className="text-orange-500 font-bold flex items-center text-sm border border-orange-500/30 px-4 py-2 rounded-full bg-orange-500/10 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5 mr-1" /> Montar
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direita: Carrinho Desktop Fixo */}
      <div className="hidden lg:block relative">
        <div className="bg-[#111] p-6 rounded-3xl border border-zinc-800 shadow-xl sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
            <div className="bg-orange-500/20 p-3 rounded-xl text-orange-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-white">Seu Pedido</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-emerald-500/50 mb-4 flex justify-center"><ShoppingBag className="w-16 h-16" /></p>
                <p className="text-zinc-500 text-lg">Sua sacola está vazia.</p>
                <p className="text-zinc-600 text-sm mt-2">Escolha seu prato para começar.</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-zinc-100 pr-2">{item.product.name}</span>
                    <span className="font-black text-orange-400 whitespace-nowrap">R$ {item.totalPrice.toFixed(2)}</span>
                  </div>
                  {item.doneness && <p className="text-xs text-zinc-400 font-medium">Ponto: <span className="text-zinc-300">{item.doneness.replace(/_/g, ' ')}</span></p>}
                  {item.sides.length > 0 && (
                    <p className="text-xs text-zinc-400 mt-1.5 font-medium">Acomp: <span className="text-zinc-300">{item.sides.map(s => MOCK_PRODUCTS.find(p => p.id === s)?.name).join(', ')}</span></p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-6 mt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <span className="text-zinc-400 font-bold">Total</span>
              <span className="text-3xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black text-xl py-5 rounded-2xl shadow-xl shadow-orange-900/40 transition-all flex justify-center items-center active:scale-[0.98]"
            >
              {isProcessing ? (
                <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Emitindo...</>
              ) : (
                'Finalizar Pedido'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Botão Sticky Mobile (Finalizar Pedido Destaque) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#0a0a0a]/95 to-transparent z-40 pb-6"
          >
            <button 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-orange-600 active:bg-orange-700 text-white font-black text-lg py-5 px-6 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.3)] flex justify-between items-center active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/30 p-2 rounded-full"><ShoppingBag className="w-5 h-5 text-zinc-100" /></div>
                <span>{cart.length} itens</span>
              </div>
              {isProcessing ? (
                <><Loader2 className="w-6 h-6 animate-spin" /></>
              ) : (
                <span className="text-xl">Finalizar R$ {cartTotal.toFixed(2)}</span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Premium Ponto e Acompanhamentos */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/80 backdrop-blur-md p-0 lg:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProductModal}
          >
            <motion.div 
              className="bg-[#0a0a0a] lg:bg-[#111] w-full max-w-2xl rounded-t-[2rem] lg:rounded-[2rem] border-t lg:border border-zinc-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-zinc-900 border-b border-zinc-800 relative">
                <button 
                  onClick={closeProductModal}
                  className="absolute top-6 right-6 bg-black/40 p-2 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="mt-2 pr-12">
                  <h3 className="text-3xl font-black text-white">{selectedProduct.name}</h3>
                  <p className="text-zinc-400 mt-2">{selectedProduct.description}</p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto w-full flex-1">
                {/* Ponto Obrigatório */}
                {(selectedProduct.type === 'CUT' || selectedProduct.type === 'COMBO') && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] font-black px-2 py-1 rounded tracking-wider">OBRIGATÓRIO</span>
                      <h4 className="text-xl font-bold text-zinc-100">O Ponto Ideal</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: '1_MAL_PASSADO', label: 'Mal passado' },
                        { id: '2_PONTO_PARA_MAL', label: 'Ponto para mal' },
                        { id: '3_AO_PONTO', label: 'Ao Ponto' },
                        { id: '4_PONTO_PARA_BEM', label: 'Ponto para bem' },
                        { id: '5_BEM_PASSADO', label: 'Bem passado' }
                      ].map(pt => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setDoneness(pt.id)}
                          className={`py-5 px-3 rounded-2xl border-2 transition-all font-bold text-sm shadow-sm ${
                            doneness === pt.id 
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-zinc-800 bg-[#151515] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-[#1a1a1a]'
                          }`}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combos Extras */}
                {selectedProduct.type === 'COMBO' && selectedProduct.maxSides && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex gap-3 items-center">
                        <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-black px-2 py-1 rounded tracking-wider">OPCIONAL</span>
                        <h4 className="text-xl font-bold text-zinc-100">Complementos</h4>
                      </div>
                      <span className="text-sm font-bold bg-zinc-900 px-3 py-1 rounded-full text-zinc-400 border border-zinc-800">
                        <span className={selectedSides.length === selectedProduct.maxSides ? 'text-zinc-100' : 'text-zinc-100'}>{selectedSides.length}</span> / {selectedProduct.maxSides}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sides.map(side => {
                        const isSelected = selectedSides.includes(side.id)
                        const isDisabled = !isSelected && selectedSides.length >= selectedProduct.maxSides!

                        return (
                          <div 
                            key={side.id}
                            onClick={() => !isDisabled && handleSelectSide(side.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-500/10' 
                                : isDisabled 
                                  ? 'border-zinc-800/50 bg-[#111] opacity-40 cursor-not-allowed'
                                  : 'border-zinc-800 bg-[#151515] hover:border-zinc-700'
                            }`}
                          >
                            <div className="pr-4">
                              <p className={`font-black text-lg ${isSelected ? 'text-orange-400' : 'text-zinc-200'}`}>{side.name}</p>
                            </div>
                            <div className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-700 bg-zinc-900'
                            }`}>
                              {isSelected && <Check className="w-4 h-4 font-black" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Adicionar (Fixo Inferior) */}
              <div className="p-4 lg:p-6 border-t border-zinc-800 bg-[#0a0a0a] lg:bg-[#111] shrink-0 pb-8 lg:pb-6">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-zinc-400 font-bold">Total do prato</span>
                  <span className="text-2xl font-black text-orange-400">R$ {selectedProduct.price.toFixed(2)}</span>
                </div>
                <button
                  onClick={addToCart}
                  className="w-full bg-zinc-100 hover:bg-white active:scale-[0.98] transition-all text-black font-black text-xl py-5 rounded-2xl shadow-xl shadow-zinc-900/20 flex justify-center items-center gap-2"
                >
                  <Plus className="w-6 h-6" /> ADICIONAR À SACOLA
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
