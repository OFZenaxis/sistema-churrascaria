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
import ProductModal from './ProductModal'

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
  quantity: number
  optionsText?: string
  upsellIds?: string[]
  displayPrice: number  // Apenas para exibição local, NÃO enviado ao backend
}

type PaymentMethod = 'PIX' | 'CARD_ONLINE' | 'CARD_MACHINE' | 'CASH'

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'PIX', label: 'Pagar agora via PIX', icon: <QrCode className="w-5 h-5" />, desc: 'ONLINE' },
  { id: 'CARD_ONLINE', label: 'Cartão de Crédito', icon: <CreditCard className="w-5 h-5" />, desc: 'ONLINE' },
  { id: 'CARD_MACHINE', label: 'Cartão na Entrega', icon: <CreditCard className="w-5 h-5" />, desc: 'MOTOBOY' },
  { id: 'CASH', label: 'Dinheiro', icon: <Banknote className="w-5 h-5" />, desc: 'MOTOBOY' },
]

const CATEGORIES = [
  { id: 'MARMITAS', label: 'Marmitas', img: '🥩', type: 'COMBO' },
  { id: 'BEBIDAS', label: 'Bebidas', img: '🥤', type: 'BEVERAGE' },
  { id: 'ADICIONAIS', label: 'Adicionais', img: '🍟', type: 'SIDE' }
]

function BottomNav({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { id: 'menu', label: 'Cardápio', icon: <UtensilsCrossed className="w-[22px] h-[22px]" />, path: '/' },
    { id: 'orders', label: 'Pedidos', icon: <ClipboardList className="w-[22px] h-[22px]" />, path: '/orders' },
    { id: 'cart', label: 'Carrinho', icon: <ShoppingBag className="w-[22px] h-[22px]" />, action: onCartClick },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 min-h-[64px] pt-1.5 pb-[max(env(safe-area-inset-bottom,12px),12px)] bg-[#0a0a0a]/85 backdrop-blur-xl border-t border-[#1f1f1f] flex items-stretch z-[100]">
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
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [changeFor, setChangeFor] = useState<string>('')

  const [userAddresses, setUserAddresses] = useState<AddressOption[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  const activeProducts = products.filter(p => p.isActive !== false)
  const cuts = activeProducts.filter(p => p.type === 'CUT' || p.type === 'COMBO')
  const sides = activeProducts.filter(p => p.type === 'SIDE')
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotal = cart.reduce((acc, item) => acc + item.displayPrice * item.quantity, 0)

  // Filtro por categoria (agora baseado nos novos tipos/mix Marmita-First)
  const menuItems = activeProducts.filter(p => {
    if (activeCategory === 'MARMITAS') return p.type === 'COMBO'
    if (activeCategory === 'BEBIDAS') return p.type === 'BEVERAGE'
    if (activeCategory === 'ADICIONAIS') return p.type === 'SIDE'
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
      // @ts-ignore: Relation tipagem pendente no retorno server-action
      if (user?.addresses?.length) {
        // @ts-ignore
        setUserAddresses(user.addresses as AddressOption[])
        // @ts-ignore
        const def = user.addresses.find((a: any) => a.isDefault) || user.addresses[0]
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
    setIsModalOpen(true)
  }

  const closeProductModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedProduct(null), 300)
  }

  const handleAddToCart = (itemData: { product: Product, optionsText: string, totalPrice: number, upsellIds?: string[] }) => {
    setCart(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      product: itemData.product,
      quantity: 1,
      optionsText: itemData.optionsText,
      upsellIds: itemData.upsellIds || [],
      displayPrice: itemData.totalPrice  // Apenas para exibição
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

    // 🔒 Envia apenas IDs + quantidades. O backend calcula o preço seguro.
    const res = await submitOrder(
      paymentMethod,
      cart.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        optionsText: i.optionsText,
        upsellIds: i.upsellIds,
      })),
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
      
      if (paymentMethod === 'PIX' || paymentMethod === 'CARD_ONLINE') {
        router.push(`/pagamento/${res.orderId}?method=${paymentMethod}`)
      } else {
        router.push(`/pedido/${res.orderId}`)
      }
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

      {/* ── STORIES DE CATEGORIA (Instagram Style) ── */}
      <div className="story-nav">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id
          return (
            <div 
              key={cat.id} 
              className={`story-item ${!isActive ? 'inactive' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <div className="story-ring">
                <div className="story-img-container shadow-inner">
                  {cat.img}
                </div>
              </div>
              <span className="story-label">
                {cat.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── TÍTULO da seção ── */}
      <div className="px-5 pt-3 pb-2">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          {CATEGORIES.find(c => c.id === activeCategory)?.label || 'Cardápio'}
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
                          <span className="text-zinc-200 font-bold block truncate leading-tight mb-0.5">{item.product.name}</span>
                          {item.optionsText && <span className="text-zinc-500 text-[11px] block pr-4 leading-snug">{item.optionsText}</span>}
                        </div>
                        <span className="text-[#E31C1C] font-black whitespace-nowrap pt-0.5">R$ {(item.displayPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#1f1f1f] mt-3 pt-3 flex justify-between items-center">
                    <span className="font-black text-white text-sm">TOTAL</span>
                    <span className="font-black text-[#E31C1C] text-2xl">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Gamification Barra Progress: R$ 100 para frete grátis */}
                  <div className="mt-4 bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Entrega</span>
                      <span className="text-[11px] font-black text-[#E31C1C] uppercase">
                        {cartTotal >= 100 ? 'Frete Grátis Liberado! 🎁' : `Faltam R$ ${(100 - cartTotal).toFixed(2)} para grátis`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (cartTotal / 100) * 100)}%` }}
                        className={`h-full ${cartTotal >= 100 ? 'bg-green-500' : 'bg-[#E31C1C]'}`}
                      />
                    </div>
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
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all font-black text-xs uppercase min-h-[80px] ${
                          paymentMethod === opt.id
                            ? 'border-[#E31C1C] bg-[#E31C1C]/10 text-[#E31C1C]'
                            : 'border-[#1f1f1f] bg-[#111] text-zinc-600 hover:border-[#2a2a2a]'
                        }`}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{opt.desc}</span>
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

      {/* ── NOVO MARMITA BUILDER MODAL ── */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
        onAddToCart={handleAddToCart}
      />

      {/* ── BOTTOM NAV ── */}
      <BottomNav cartCount={cartCount} onCartClick={openCheckout} />
    </>
  )
}
