"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ShoppingBag, Check, Loader2, Banknote, CreditCard, QrCode, Flame } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { submitOrder } from '../app/actions/checkout'
import PhoneLogin from './PhoneLogin'

const CustomerTracker = dynamic(() => import('./CustomerTracker'), { ssr: false })

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  type: 'CUT' | 'SIDE' | 'BEVERAGE' | 'COMBO'
  maxSides?: number | null
  categoryId?: string
  isActive?: boolean
}

type CartItem = {
  id: string
  product: Product
  doneness?: string
  sides: string[]
  totalPrice: number
}

type PaymentMethod = 'PIX' | 'CARD' | 'CASH'

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'PIX', label: 'Pix', icon: <QrCode className="w-5 h-5" /> },
  { id: 'CARD', label: 'Cartão', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'CASH', label: 'Dinheiro', icon: <Banknote className="w-5 h-5" /> },
]

export default function MenuComponent({ products, isStoreOpen = true }: { products: Product[], isStoreOpen?: boolean }) {
  const router = useRouter()
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [doneness, setDoneness] = useState<string>('')
  const [selectedSides, setSelectedSides] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  // Estado de Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [changeFor, setChangeFor] = useState<string>('')

  const activeProducts = products.filter(p => p.isActive !== false)
  const cuts = activeProducts.filter(p => p.type === 'CUT' || p.type === 'COMBO')
  const sides = activeProducts.filter(p => p.type === 'SIDE')

  useEffect(() => {
    if (isModalOpen || isLoginOpen || isCheckoutOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, isLoginOpen, isCheckoutOpen])

  const openProductModal = (product: Product) => {
    if (!isStoreOpen) return
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

  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)

  const openCheckout = () => {
    if (cart.length === 0) return
    setCheckoutError('')
    setPaymentMethod('PIX')
    setChangeFor('')
    setIsCheckoutOpen(true)
  }

  const handleConfirmOrder = async () => {
    setIsProcessing(true)
    setCheckoutError('')

    const res = await submitOrder(
      cartTotal,
      paymentMethod,
      paymentMethod === 'CASH' && changeFor ? parseFloat(changeFor) : undefined
    )

    setIsProcessing(false)

    if (res.requiresAuth) {
      setIsCheckoutOpen(false)
      setIsLoginOpen(true)
      return
    }

    if (res.success && res.orderId) {
      setCart([])
      setIsCheckoutOpen(false)
      router.push('/orders')
    } else {
      setCheckoutError(res.error || 'Oops! Ocorreu um erro ao processar o pedido.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">

      {/* Overlay Loja Fechada */}
      {!isStoreOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/90 backdrop-blur-lg text-center px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Flame className="w-12 h-12 text-zinc-600" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white mb-3">Brasa Descansando...</h2>
              <p className="text-zinc-400 text-lg max-w-sm">Nossa grelha está de folga no momento. Voltamos em breve com tudo na brasa!</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-3">
              <p className="text-zinc-500 font-bold text-sm">Loja fechada no momento</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Esquerda: Menu principal */}
      <div className="lg:col-span-2 pb-32 lg:pb-0">
        <h2 className="text-3xl font-black mb-8 text-white tracking-tight">Especialidades da Casa</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cuts.map(product => (
            <div 
              key={product.id} 
              className={`bg-[#111] rounded-3xl border border-zinc-800 p-6 flex flex-col justify-between h-full transition-all duration-300 group ${isStoreOpen ? 'cursor-pointer hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-900/10' : 'opacity-60 cursor-not-allowed'}`}
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
                <span className={`font-bold flex items-center text-sm border px-4 py-2 rounded-full transition-colors ${isStoreOpen ? 'text-orange-500 border-orange-500/30 bg-orange-500/10 group-hover:bg-orange-500 group-hover:text-white' : 'text-zinc-600 border-zinc-700 bg-zinc-900'}`}>
                  <Plus className="w-5 h-5 mr-1" /> Montar
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direita: Carrinho Desktop */}
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
                    <p className="text-xs text-zinc-400 mt-1.5 font-medium">Acomp: <span className="text-zinc-300">{item.sides.map(s => activeProducts.find(p => p.id === s)?.name).join(', ')}</span></p>
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
              onClick={openCheckout}
              disabled={cart.length === 0 || isProcessing || !isStoreOpen}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black text-xl py-5 rounded-2xl shadow-xl shadow-orange-900/40 transition-all flex justify-center items-center active:scale-[0.98]"
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Botão Sticky Mobile */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#0a0a0a]/95 to-transparent z-40 pb-6"
          >
            <button 
              onClick={openCheckout}
              disabled={isProcessing}
              className="w-full bg-orange-600 active:bg-orange-700 text-white font-black text-lg py-5 px-6 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.3)] flex justify-between items-center active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/30 p-2 rounded-full"><ShoppingBag className="w-5 h-5 text-zinc-100" /></div>
                <span>{cart.length} itens</span>
              </div>
              <span className="text-xl">Finalizar R$ {cartTotal.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Auth Modal */}
      <PhoneLogin 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSuccess={() => {
          setIsLoginOpen(false)
          setIsCheckoutOpen(true)
        }}
      />

      {/* Modal de Checkout: Pagamento */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center bg-black/85 backdrop-blur-md p-0 lg:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#111] w-full max-w-md rounded-t-[2rem] lg:rounded-[2rem] border-t lg:border border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/60 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">Finalizar Pedido</h3>
                <button onClick={() => setIsCheckoutOpen(false)} className="text-zinc-500 hover:text-white p-2 rounded-full bg-zinc-900 border border-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Resumo */}
                <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-zinc-800">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Resumo</p>
                  <div className="space-y-2">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-zinc-300 font-medium">{item.product.name}</span>
                        <span className="text-orange-400 font-bold">R$ {item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-800 mt-3 pt-3 flex justify-between">
                    <span className="font-black text-white">Total</span>
                    <span className="font-black text-orange-400 text-xl">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-3">Forma de Pagamento</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PAYMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all font-bold text-sm ${
                          paymentMethod === opt.id
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-zinc-800 bg-[#0a0a0a] text-zinc-500 hover:border-zinc-700'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo de Troco */}
                <AnimatePresence>
                  {paymentMethod === 'CASH' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">
                        Troco para quanto? <span className="text-zinc-600 normal-case font-medium">(opcional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                        <input
                          type="number"
                          min={cartTotal}
                          step="0.01"
                          value={changeFor}
                          onChange={e => setChangeFor(e.target.value)}
                          placeholder={`Mínimo R$ ${cartTotal.toFixed(2)}`}
                          className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-white font-bold focus:border-orange-500 focus:outline-none transition-all"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {checkoutError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-sm font-bold text-center bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
                    {checkoutError}
                  </motion.p>
                )}
              </div>

              <div className="p-6 border-t border-zinc-800 pb-8 lg:pb-6">
                <button
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-60 active:scale-[0.98] transition-all text-white font-black text-xl py-5 rounded-2xl shadow-xl shadow-orange-900/40 flex justify-center items-center gap-2"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> Processando...</>
                  ) : (
                    `Confirmar Pedido — R$ ${cartTotal.toFixed(2)}`
                  )}
                </button>
              </div>
            </motion.div>
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

                {selectedProduct.type === 'COMBO' && selectedProduct.maxSides && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex gap-3 items-center">
                        <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-black px-2 py-1 rounded tracking-wider">OPCIONAL</span>
                        <h4 className="text-xl font-bold text-zinc-100">Complementos</h4>
                      </div>
                      <span className="text-sm font-bold bg-zinc-900 px-3 py-1 rounded-full text-zinc-400 border border-zinc-800">
                        {selectedSides.length} / {selectedProduct.maxSides}
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
                            <p className={`font-black text-lg ${isSelected ? 'text-orange-400' : 'text-zinc-200'}`}>{side.name}</p>
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
