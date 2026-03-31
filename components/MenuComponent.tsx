"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ShoppingBag, Check, Loader2, Banknote, CreditCard, QrCode, Flame, MapPin, UtensilsCrossed, ClipboardList } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { submitOrder } from '../app/actions/checkout'
import { getSessionUser } from '../app/actions/auth'
import PhoneLogin from './PhoneLogin'
import AddressPicker, { AddressOption } from './AddressPicker'
import ProductCard from './ProductCard'

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
  imageUrl?: string | null
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

const CATEGORIES = ['TODOS', 'CARNES', 'COMBOS', 'ACOMPANHAMENTOS']

function BottomNav({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { id: 'menu', label: 'Cardápio', icon: <UtensilsCrossed className="w-[22px] h-[22px]" />, path: '/' },
    { id: 'orders', label: 'Pedidos', icon: <ClipboardList className="w-[22px] h-[22px]" />, path: '/orders' },
    { id: 'cart', label: 'Carrinho', icon: <ShoppingBag className="w-[22px] h-[22px]" />, action: onCartClick },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[68px] bg-[#0a0a0a]/85 backdrop-blur-xl border-t border-[#1f1f1f] flex items-stretch z-[100] safe-bottom">
      {tabs.map(tab => {
        const isActive = tab.path ? pathname === tab.path : false
        const isCart = tab.id === 'cart'
        return (
          <button
            key={tab.id}
            onClick={tab.action || (() => tab.path && router.push(tab.path))}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] text-[10px] font-bold tracking-wide transition-all relative ${
              isActive ? 'text-[#E31C1C]' : isCart && cartCount > 0 ? 'text-[#E31C1C]' : 'text-zinc-500'
            }`}
          >
            <span className="relative">
              {tab.icon}
              {isCart && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#E31C1C] text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-md shadow-red-900/40">
                  {cartCount}
                </span>
              )}
            </span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Main Component ──────────────────────────────────────────────
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
  const [activeCategory, setActiveCategory] = useState('TODOS')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [changeFor, setChangeFor] = useState<string>('')

  const [userAddresses, setUserAddresses] = useState<AddressOption[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  const activeProducts = products.filter(p => p.isActive !== false)
  const cuts = activeProducts.filter(p => p.type === 'CUT' || p.type === 'COMBO')
  const sides = activeProducts.filter(p => p.type === 'SIDE')
  const cartCount = cart.length
  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)

  // Filtro por categoria
  const menuItems = activeProducts.filter(p => {
    if (activeCategory === 'TODOS') return p.type === 'CUT' || p.type === 'COMBO'
    if (activeCategory === 'CARNES') return p.type === 'CUT'
    if (activeCategory === 'COMBOS') return p.type === 'COMBO'
    if (activeCategory === 'ACOMPANHAMENTOS') return p.type === 'SIDE'
    return true
  })

  // Top 3 carnes = MAIS PEDIDO
  const cutIds = activeProducts.filter(p => p.type === 'CUT').slice(0, 3).map(p => p.id)
  const isHot = (id: string) => cutIds.includes(id)

  useEffect(() => {
    if (isModalOpen || isLoginOpen || isCheckoutOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, isLoginOpen, isCheckoutOpen])

  const loadUserAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const user = await getSessionUser()
      if (user?.addresses?.length) {
        setUserAddresses(user.addresses as AddressOption[])
        const def = user.addresses.find(a => a.isDefault) || user.addresses[0]
        setSelectedAddressId(def.id)
      } else {
        setUserAddresses([])
        setSelectedAddressId(null)
      }
    } catch (e) {
      console.error('Erro ao carregar endereços', e)
    } finally {
      setLoadingAddresses(false)
    }
  }

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
    } else if (selectedSides.length < selectedProduct.maxSides) {
      setSelectedSides(prev => [...prev, sideId])
    }
  }

  const addToCart = () => {
    if (!selectedProduct) return
    if ((selectedProduct.type === 'CUT' || selectedProduct.type === 'COMBO') && !doneness) {
      alert('Selecione o ponto da carne!')
      return
    }
    setCart(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      product: selectedProduct,
      doneness,
      sides: selectedSides,
      totalPrice: selectedProduct.price
    }])
    closeProductModal()
  }

  const openCheckout = async () => {
    if (cart.length === 0) return
    setCheckoutError('')
    setPaymentMethod('PIX')
    setChangeFor('')
    await loadUserAddresses()
    setIsCheckoutOpen(true)
  }

  const handleConfirmOrder = async () => {
    setIsProcessing(true)
    setCheckoutError('')

    const res = await submitOrder(
      cartTotal,
      paymentMethod,
      paymentMethod === 'CASH' && changeFor ? parseFloat(changeFor) : undefined,
      selectedAddressId || undefined
    )

    setIsProcessing(false)

    if (res.requiresAuth) {
      setIsCheckoutOpen(false)
      setIsLoginOpen(true)
      return
    }
    if ((res as any).requiresAddress) {
      setIsCheckoutOpen(false)
      setIsLoginOpen(true)
      return
    }
    if (res.success && res.orderId) {
      setCart([])
      setIsCheckoutOpen(false)
      router.push('/orders')
    } else {
      setCheckoutError(res.error || 'Erro ao processar pedido.')
    }
  }

  return (
    <>
      {/* ── Overlay Loja Fechada ── */}
      {!isStoreOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/95 text-center px-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#111] border border-[#222] flex items-center justify-center">
              <Flame className="w-10 h-10 text-[#333]" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase">Brasa Descansando</h2>
            <p className="text-zinc-500 text-sm max-w-xs">Nossa grelha está de folga. Voltamos em breve!</p>
            <div className="bg-[#111] border border-[#222] rounded-2xl px-5 py-2.5">
              <p className="text-zinc-600 font-bold text-xs uppercase tracking-wider">Loja fechada no momento</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── PILLS de Categoria ── */}
      <div className="scroll-pills pt-2 pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'CARNES' ? '🥩 ' : cat === 'COMBOS' ? '🎁 ' : cat === 'ACOMPANHAMENTOS' ? '🍟 ' : ''}
            {cat}
          </button>
        ))}
      </div>

      {/* ── TÍTULO da seção ── */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">
          {activeCategory === 'TODOS' ? 'CARNES NA BRASA' : activeCategory}
        </h2>
        <p className="text-zinc-600 text-xs mt-0.5">{menuItems.length} opções disponíveis</p>
      </div>

      {/* ── GRID de Produtos (iFood Style) ── */}
      <div className="px-4 pb-8 grid grid-cols-1 gap-3">
        {menuItems.map((product, idx) => (
          <ProductCard 
            key={product.id}
            product={product}
            isHot={isHot(product.id)}
            isStoreOpen={isStoreOpen}
            onClick={() => openProductModal(product)}
            idx={idx}
          />
        ))}

        {menuItems.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold">Nenhum item nesta categoria</p>
          </div>
        )}
      </div>

      {/* ── Phone Auth Modal ── */}
      <PhoneLogin
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={async () => {
          setIsLoginOpen(false)
          await loadUserAddresses()
          setIsCheckoutOpen(true)
        }}
      />

      {/* ── CHECKOUT MODAL ── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0d0d0d] w-full max-w-lg rounded-t-[28px] border-t border-[#1f1f1f] shadow-2xl flex flex-col max-h-[92vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-[#333] rounded-full" />
              </div>

              <div className="px-5 py-3 flex justify-between items-center border-b border-[#1a1a1a]">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Seu Pedido</h3>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1a] text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* Resumo */}
                <div className="bg-[#111] rounded-2xl p-4 border border-[#1f1f1f]">
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">Itens</p>
                  <div className="space-y-2">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-zinc-200 font-bold block truncate">{item.product.name}</span>
                          {item.doneness && <span className="text-zinc-600 text-xs">Ponto: {item.doneness.replace(/_/g, ' ')}</span>}
                        </div>
                        <span className="text-[#E31C1C] font-black whitespace-nowrap">R$ {item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#1f1f1f] mt-3 pt-3 flex justify-between items-center">
                    <span className="font-black text-white text-sm">TOTAL</span>
                    <span className="font-black text-[#E31C1C] text-2xl">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Endereço */}
                {loadingAddresses ? (
                  <div className="flex items-center gap-3 py-4 text-zinc-600">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E31C1C]" />
                    <span className="text-sm font-medium">Carregando endereços...</span>
                  </div>
                ) : userAddresses.length > 0 ? (
                  <AddressPicker
                    addresses={userAddresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                    onAddNew={() => { setIsCheckoutOpen(false); setIsLoginOpen(true) }}
                  />
                ) : (
                  <div className="bg-[#E31C1C]/5 border border-[#E31C1C]/20 rounded-2xl p-4 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#E31C1C] shrink-0" />
                    <div>
                      <p className="text-red-300 font-bold text-sm">Nenhum endereço cadastrado</p>
                      <button
                        type="button"
                        onClick={() => { setIsCheckoutOpen(false); setIsLoginOpen(true) }}
                        className="text-[#E31C1C] text-xs underline mt-0.5"
                      >
                        Cadastrar agora →
                      </button>
                    </div>
                  </div>
                )}

                {/* Pagamento */}
                <div>
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-3">Forma de Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase min-h-[72px] ${
                          paymentMethod === opt.id
                            ? 'border-[#E31C1C] bg-[#E31C1C]/10 text-[#E31C1C]'
                            : 'border-[#1f1f1f] bg-[#111] text-zinc-600 hover:border-[#2a2a2a]'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Troco */}
                <AnimatePresence>
                  {paymentMethod === 'CASH' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2 block">
                        Troco para quanto? <span className="text-zinc-700 normal-case font-medium">(opcional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">R$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={cartTotal}
                          step="0.01"
                          value={changeFor}
                          onChange={e => setChangeFor(e.target.value)}
                          placeholder={`Mínimo R$ ${cartTotal.toFixed(2)}`}
                          className="input-dark pl-12 min-h-[52px]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {checkoutError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm font-bold text-center bg-red-950/40 border border-red-900/40 p-3 rounded-xl">
                    {checkoutError}
                  </motion.p>
                )}
              </div>

              {/* CTA */}
              <div className="px-5 pb-8 pt-4 border-t border-[#1a1a1a] safe-bottom">
                <button
                  onClick={handleConfirmOrder}
                  disabled={isProcessing || userAddresses.length === 0}
                  className="btn-brasa w-full text-base"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> PROCESSANDO...</>
                  ) : (
                    `🔥 GARANTIR MEU CHURRASCO — R$ ${cartTotal.toFixed(2)}`
                  )}
                </button>
                {userAddresses.length === 0 && (
                  <p className="text-center text-zinc-700 text-xs mt-2">Cadastre um endereço para continuar</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL Ponto da Carne ── */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProductModal}
          >
            <motion.div
              className="bg-[#0d0d0d] w-full max-w-lg rounded-t-[28px] border-t border-[#1f1f1f] overflow-hidden flex flex-col max-h-[90vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-[#333] rounded-full" />
              </div>

              <div className="px-5 pt-1 pb-4 border-b border-[#1a1a1a] relative">
                <button onClick={closeProductModal} className="absolute top-1 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
                {isHot(selectedProduct.id) && <div className="badge-hot mb-2">🔥 MAIS PEDIDO</div>}
                <h3 className="text-2xl font-black text-white pr-10">{selectedProduct.name}</h3>
                {selectedProduct.description && (
                  <p className="text-zinc-500 text-sm mt-1">{selectedProduct.description}</p>
                )}
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">

                {/* Ponto da Carne */}
                {(selectedProduct.type === 'CUT' || selectedProduct.type === 'COMBO') && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-[#E31C1C]/10 text-[#E31C1C] border border-[#E31C1C]/20 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">OBRIGATÓRIO</span>
                      <h4 className="text-base font-black text-white uppercase tracking-tight">O Ponto Ideal</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
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
                          className={`py-4 px-3 rounded-2xl border-2 transition-all font-bold text-sm min-h-[56px] ${
                            doneness === pt.id
                              ? 'border-[#E31C1C] bg-[#E31C1C]/10 text-[#E31C1C]'
                              : 'border-[#1f1f1f] bg-[#111] text-zinc-500 hover:border-[#333] hover:text-zinc-300'
                          }`}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acompanhamentos do Combo */}
                {selectedProduct.type === 'COMBO' && selectedProduct.maxSides && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#1a1a1a] text-zinc-400 border border-[#2a2a2a] text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">OPCIONAL</span>
                        <h4 className="text-base font-black text-white uppercase tracking-tight">Acompanhamentos</h4>
                      </div>
                      <span className="text-xs font-bold bg-[#111] px-3 py-1 rounded-full text-zinc-500 border border-[#1f1f1f]">
                        {selectedSides.length}/{selectedProduct.maxSides}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {sides.map(side => {
                        const isSelected = selectedSides.includes(side.id)
                        const isDisabled = !isSelected && selectedSides.length >= selectedProduct.maxSides!
                        return (
                          <div
                            key={side.id}
                            onClick={() => !isDisabled && handleSelectSide(side.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[56px] ${
                              isSelected ? 'border-[#E31C1C] bg-[#E31C1C]/8'
                              : isDisabled ? 'border-[#1a1a1a] opacity-30 cursor-not-allowed'
                              : 'border-[#1f1f1f] bg-[#111] cursor-pointer hover:border-[#2a2a2a]'
                            }`}
                          >
                            <p className={`font-bold text-base ${isSelected ? 'text-[#E31C1C]' : 'text-zinc-300'}`}>{side.name}</p>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'border-[#E31C1C] bg-[#E31C1C]' : 'border-[#333] bg-transparent'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-8 pt-4 border-t border-[#1a1a1a] safe-bottom">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-500 font-bold text-sm uppercase tracking-wide">Valor</span>
                  <span className="text-[#E31C1C] font-black text-2xl">R$ {selectedProduct.price.toFixed(2)}</span>
                </div>
                <button onClick={addToCart} className="btn-brasa w-full">
                  <Plus className="w-5 h-5" /> ADICIONAR AO PEDIDO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAV ── */}
      <BottomNav cartCount={cartCount} onCartClick={openCheckout} />
    </>
  )
}
