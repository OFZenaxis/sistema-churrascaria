"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ShoppingBag, Check, Loader2, Banknote, CreditCard, QrCode, Flame, MapPin, UtensilsCrossed, ClipboardList } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { submitOrder, estimateDeliveryFee } from '../app/actions/checkout'
import { getSessionUser } from '../app/actions/auth'
import PhoneLogin from './PhoneLogin'
import AddressPicker, { AddressOption } from './AddressPicker'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'

const CustomerTracker = dynamic(() => import('./CustomerTracker'), { ssr: false })

export type StoreTheme = {
  brandColor: string
  phoneBg: string
  phoneCard: string
  phoneText: string
  phoneSubText: string
  phoneBorderRadius: string
  layoutStyle: 'list' | 'grid' | 'featured'
  fontFamily: 'sans' | 'serif' | 'rounded'
}

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

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  categoryName: string
  maxSides?: number | null
  isActive?: boolean
  imageUrl?: string | null
}

type CartItem = {
  id: string
  product: Product
  quantity: number
  optionsText?: string
  displayPrice: number  // Apenas para exibição local, NÃO enviado ao backend
}

type PaymentMethod = 'PIX' | 'CARD_ONLINE' | 'CARD_MACHINE' | 'CASH'

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'PIX', label: 'Pagar agora via PIX', icon: <QrCode className="w-5 h-5" />, desc: 'ONLINE' },
  { id: 'CARD_ONLINE', label: 'Cartão de Crédito', icon: <CreditCard className="w-5 h-5" />, desc: 'ONLINE' },
  { id: 'CARD_MACHINE', label: 'Cartão na Entrega', icon: <CreditCard className="w-5 h-5" />, desc: 'MOTOBOY' },
  { id: 'CASH', label: 'Dinheiro', icon: <Banknote className="w-5 h-5" />, desc: 'MOTOBOY' },
]


function BottomNav({
  cartCount, onCartClick, onAccountClick, slug, brandColor = '#10b981', phoneBg = '#ffffff', phoneSubText = '#64748b',
}: {
  cartCount: number; onCartClick: () => void; onAccountClick: () => void; slug: string;
  brandColor?: string; phoneBg?: string; phoneSubText?: string;
}) {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { id: 'menu',    label: 'Cardápio', icon: <UtensilsCrossed className="w-[22px] h-[22px]" />, path: `/${slug}` },
    { id: 'cart',    label: 'Carrinho', icon: <ShoppingBag     className="w-[22px] h-[22px]" />, action: onCartClick },
    { id: 'account', label: 'Conta',    icon: <ClipboardList   className="w-[22px] h-[22px]" />, action: onAccountClick },
  ]

  return (
    <nav
      className="w-full shrink-0 border-t z-40"
      style={{
        background: phoneBg + 'f2',
        borderColor: phoneSubText + '22',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as React.CSSProperties}
    >
      <div className="flex items-stretch min-h-[60px] pt-1.5 pb-[max(env(safe-area-inset-bottom,10px),10px)]">
        {tabs.map(tab => {
          const isActive = tab.path ? pathname === tab.path : false
          const isCart = tab.id === 'cart'
          const highlight = isActive || (isCart && cartCount > 0)
          return (
            <button
              key={tab.id}
              onClick={tab.action || (() => tab.path && router.push(tab.path))}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] text-[10px] font-bold tracking-wide transition-all relative"
              style={{ color: highlight ? brandColor : phoneSubText }}
            >
              <span className="relative">
                {tab.icon}
                {isCart && cartCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-md"
                    style={{ backgroundColor: brandColor }}
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
              {highlight && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ backgroundColor: brandColor }} />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── ProductList helper (renderiza items por layoutStyle) ──────────────────
type ProductListProps = {
  items: Product[]; hotIds: Set<string>; isStoreOpen: boolean;
  openProductModal: (p: Product) => void;
  storeTheme: StoreTheme;
}
function ProductList({ items, hotIds, isStoreOpen, openProductModal, storeTheme }: ProductListProps) {
  const { brandColor, phoneBg, phoneCard, phoneText, phoneSubText, phoneBorderRadius, layoutStyle, fontFamily } = storeTheme
  if (layoutStyle === 'grid') return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((product, idx) => (
        <motion.button
          key={product.id} type="button"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
          onClick={() => isStoreOpen && openProductModal(product)}
          disabled={!isStoreOpen}
          className="text-left flex flex-col overflow-hidden active:scale-95 disabled:opacity-50"
          style={{ background: phoneCard, borderRadius: phoneBorderRadius }}
        >
          <div className="w-full aspect-square relative flex items-center justify-center overflow-hidden" style={{ background: brandColor + '18' }}>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-4xl opacity-30">🍽️</span>}
            {hotIds.has(product.id) && <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">🔥 Destaque</div>}
          </div>
          <div className="p-3 flex flex-col gap-1 flex-1">
            <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: phoneText }}>{product.name}</p>
            {product.description && <p className="text-[10px] leading-snug line-clamp-2" style={{ color: phoneSubText }}>{product.description}</p>}
            <div className="flex items-center justify-between mt-auto pt-2">
              <span className="text-sm font-black" style={{ color: brandColor }}>R$ {Number(product.price).toFixed(2)}</span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black shadow" style={{ backgroundColor: brandColor }}>+</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
  if (layoutStyle === 'featured') return (
    <div className="flex flex-col gap-4">
      {items.map((product, idx) => (
        <motion.button
          key={product.id} type="button"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
          onClick={() => isStoreOpen && openProductModal(product)}
          disabled={!isStoreOpen}
          className="text-left w-full overflow-hidden shadow-sm active:scale-[0.99] disabled:opacity-50"
          style={{ background: phoneCard, borderRadius: phoneBorderRadius }}
        >
          <div className="w-full h-40 relative overflow-hidden flex items-center justify-center" style={{ background: brandColor + '22' }}>
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-6xl opacity-25">🍽️</span>}
            {hotIds.has(product.id) && <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">🔥 Mais Pedido</div>}
          </div>
          <div className="p-4 flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className={`font-black text-base leading-snug truncate ${fontFamily === 'serif' ? 'font-serif' : ''}`} style={{ color: phoneText }}>{product.name}</p>
              {product.description && <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: phoneSubText }}>{product.description}</p>}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className="font-black text-lg" style={{ color: brandColor }}>R$ {Number(product.price).toFixed(2)}</span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-black shadow" style={{ backgroundColor: brandColor }}>+</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  )
  // default: list
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((product, idx) => (
        <ProductCard
          key={product.id} product={product}
          isHot={hotIds.has(product.id)} isStoreOpen={isStoreOpen}
          onClick={() => openProductModal(product)} idx={idx}
          storeTheme={{ brandColor, phoneBg, phoneCard, phoneText, phoneSubText, phoneBorderRadius, layoutStyle, fontFamily }}
        />
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export default function MenuComponent({ products, isStoreOpen = true, storeId, slug, storeTheme = DEFAULT_THEME, isLoggedIn = false }: { products: Product[], isStoreOpen?: boolean, storeId: string, slug: string, storeTheme?: StoreTheme, isLoggedIn?: boolean }) {
  const { brandColor, phoneBg, phoneCard, phoneText, phoneSubText, phoneBorderRadius, layoutStyle, fontFamily } = storeTheme
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
  const [activeCategory, setActiveCategory] = useState(
    products.filter(p => p.isActive !== false)[0]?.categoryId ?? ''
  )

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [changeFor, setChangeFor] = useState<string>('')

  const [userAddresses, setUserAddresses] = useState<AddressOption[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCategoryId, setVisibleCategoryId] = useState('')

  // ── Frete dinâmico ────────────────────────────────────────────────
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null)
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)

  const activeProducts = products.filter(p => p.isActive !== false)
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)
  const cartTotal = cart.reduce((acc, item) => acc + item.displayPrice * item.quantity, 0)
  const orderTotal = cartTotal + (deliveryFee ?? 0)
  const changeForVal = parseFloat(changeFor)
  const changeForError = paymentMethod === 'CASH' && changeFor.trim() !== '' && !isNaN(changeForVal) && changeForVal < orderTotal

  // Categorias dinâmicas derivadas dos produtos ativos — sem hardcode
  const categories = [...new Map(
    activeProducts.map(p => [p.categoryId, { id: p.categoryId, name: p.categoryName }])
  ).values()]


  // Primeiro produto de cada categoria = badge "mais pedido"
  const hotIds = new Set(categories.map(c =>
    activeProducts.find(p => p.categoryId === c.id)?.id
  ).filter(Boolean) as string[])

  // Sugestões de upsell: produtos fora do carrinho, ordenados do mais barato, máx 6
  const cartProductIds = new Set(cart.map(i => i.product.id))
  const upsellProducts = activeProducts
    .filter(p => !cartProductIds.has(p.id))
    .sort((a, b) => a.price - b.price)
    .slice(0, 6)

  useEffect(() => {
    if (isModalOpen || isLoginOpen || isCheckoutOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, isLoginOpen, isCheckoutOpen])

  // Calcula o frete sempre que o checkout estiver aberto e o endereço mudar
  useEffect(() => {
    if (!isCheckoutOpen || !selectedAddressId) {
      setDeliveryFee(null)
      setDeliveryFeeError(null)
      return
    }
    let cancelled = false
    setIsCalculatingFee(true)
    setDeliveryFee(null)
    setDeliveryFeeError(null)
    estimateDeliveryFee(selectedAddressId, storeId).then(result => {
      if (cancelled) return
      if (result.outOfRange) {
        setDeliveryFeeError(result.error ?? 'Fora do raio de entrega.')
        setDeliveryFee(null)
      } else {
        setDeliveryFee(result.fee)
        setDeliveryFeeError(null)
      }
      setIsCalculatingFee(false)
    }).catch(() => {
      if (!cancelled) setIsCalculatingFee(false)
    })
    return () => { cancelled = true }
  }, [selectedAddressId, isCheckoutOpen, storeId])

  const loadUserAddresses = async () => {
    setLoadingAddresses(true)
    try {
      // Awaited<ReturnType<...>> resolve o tipo completo incluindo a relação addresses
      // sem depender de @ts-ignore ou any
      type SessionUser = Awaited<ReturnType<typeof getSessionUser>>
      const user: SessionUser = await getSessionUser(storeId)
      if (user?.addresses?.length) {
        setUserAddresses(user.addresses as AddressOption[])
        const def = user.addresses.find(a => a.isDefault) ?? user.addresses[0]
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

  const handleAddToCart = (itemData: { product: Product, optionsText: string, totalPrice: number }) => {
    setCart(prev => [...prev, {
      id: crypto.randomUUID(),
      product: itemData.product,
      quantity: 1,
      optionsText: itemData.optionsText,
      displayPrice: itemData.totalPrice
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
      })),
      paymentMethod === 'CASH' && changeFor ? parseFloat(changeFor) : undefined,
      selectedAddressId || undefined,
      storeId // 🔒 storeId do tenant propagado até o checkout
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
        router.push(`/${slug}/pagamento/${res.orderId}?method=${paymentMethod}`)
      } else {
        router.push(`/${slug}/pedido/${res.orderId}`)
      }
    } else {
      setCheckoutError(res.error || 'Erro ao processar pedido.')
    }
  }

  // ScrollSpy: detecta qual seção está visível e destaca na nav
  useEffect(() => {
    if (categories.length === 0) return
    const ids = categories.map(c => c.id)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setVisibleCategoryId(entry.target.id)
        })
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el) })
    if (!visibleCategoryId && ids[0]) setVisibleCategoryId(ids[0])
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.map(c => c.id).join(',')])

  const scrollToCategory = (catId: string) => {
    setVisibleCategoryId(catId)
    const el = document.getElementById(catId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Produtos filtrados pela busca (null = sem busca ativa = mostrar tudo por categoria)
  const searchResults = searchQuery.trim()
    ? activeProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : null


  return (
    <>
      {/* ── Overlay Loja Fechada ── */}
      {!isStoreOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center px-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border" style={{ background: phoneBg, borderColor: phoneSubText + '33' }}>
              <Flame className="w-10 h-10" style={{ color: phoneSubText }} />
            </div>
            <h2 className="text-3xl font-black uppercase" style={{ color: '#fff' }}>Loja Fechada</h2>
            <p className="text-sm max-w-xs" style={{ color: '#ffffff99' }}>Estamos indisponíveis no momento. Voltamos em breve!</p>
            <div className="rounded-2xl px-5 py-2.5 border" style={{ background: phoneBg + 'dd', borderColor: phoneSubText + '33' }}>
              <p className="font-bold text-xs uppercase tracking-wider" style={{ color: phoneSubText }}>Fora do horário de atendimento</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Layout principal: flex col preenche h-full do <main> ── */}
      <div className="flex flex-col h-full">

      {/* ── STICKY HEADER: Categorias + Busca ── */}
      <div className="sticky top-0 z-40 border-b shadow-sm shrink-0" style={{ background: phoneBg, borderColor: phoneSubText + '22' }}>
        {/* Categorias scroll horizontal */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pt-3 pb-0 gap-5">
          {categories.map(cat => {
            const isActive = visibleCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="whitespace-nowrap font-bold text-sm transition-all pb-2.5 border-b-2 shrink-0"
                style={{
                  borderColor: isActive ? brandColor : 'transparent',
                  color: isActive ? brandColor : phoneSubText,
                }}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Barra de busca */}
        <div className="px-4 pb-3 pt-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base select-none pointer-events-none">🔍</span>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2 text-sm font-medium rounded-xl border outline-none transition-all"
              style={{
                background: phoneCard,
                color: phoneText,
                borderColor: searchQuery ? brandColor : phoneSubText + '33',
                caretColor: brandColor,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black px-1.5 py-0.5 rounded-md"
                style={{ color: brandColor, background: brandColor + '18' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── PRODUTOS (scrollable) ── */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ background: phoneBg }}>

        {/* Modo busca: lista plana filtrada */}
        {searchResults !== null && (
          <div className="px-4 pt-4">
            <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: phoneSubText }}>
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{searchQuery}"
            </p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16" style={{ color: phoneSubText }}>
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-bold">Nenhum produto encontrado</p>
                <p className="text-xs mt-1 font-medium">Tente outro termo</p>
              </div>
            ) : (
              <ProductList
                items={searchResults}
                hotIds={hotIds}
                isStoreOpen={isStoreOpen}
                openProductModal={openProductModal}
                storeTheme={storeTheme}
              />
            )}
          </div>
        )}

        {/* Modo normal: todas as categorias com seções ScrollSpy */}
        {searchResults === null && categories.map(cat => {
          const catProducts = activeProducts.filter(p => p.categoryId === cat.id)
          if (catProducts.length === 0) return null
          return (
            <section
              key={cat.id}
              id={cat.id}
              style={{ scrollMarginTop: '108px' }}
            >
              <div className="px-5 pt-6 pb-3">
                <h2
                  className={`text-lg font-black tracking-tight ${fontFamily === 'serif' ? 'font-serif' : ''}`}
                  style={{ color: phoneText }}
                >
                  {cat.name}
                </h2>
                <p className="text-xs mt-0.5 font-medium" style={{ color: phoneSubText }}>
                  {catProducts.length} {catProducts.length === 1 ? 'opção' : 'opções'}
                </p>
              </div>
              <div className="px-4 pb-2">
                <ProductList
                  items={catProducts}
                  hotIds={hotIds}
                  isStoreOpen={isStoreOpen}
                  openProductModal={openProductModal}
                  storeTheme={storeTheme}
                />
              </div>
            </section>
          )
        })}
      </div>

      {/* ── BOTTOM NAV (colada no fundo do container) ── */}
      <BottomNav
        cartCount={cartCount}
        onCartClick={openCheckout}
        onAccountClick={() => isLoggedIn ? router.push(`/${slug}/orders`) : setIsLoginOpen(true)}
        slug={slug}
        brandColor={brandColor}
        phoneBg={phoneBg}
        phoneSubText={phoneSubText}
      />

      </div>{/* /flex flex-col h-full */}

      {/* ── Phone Auth Modal ── */}
      <PhoneLogin
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        storeId={storeId}
        storeTheme={storeTheme}
        onSuccess={async () => {
          setIsLoginOpen(false)
          await loadUserAddresses()
          setIsCheckoutOpen(true)
        }}
      />

      {/* ── CHECKOUT DRAWER ── */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-t-[28px] border-t shadow-2xl flex flex-col max-h-[92vh]"
              style={{ background: phoneBg, borderColor: phoneSubText + '22' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: phoneSubText + '44' }} />
              </div>

              <div className="px-5 py-3 flex justify-between items-center border-b" style={{ borderColor: phoneSubText + '22' }}>
                <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: phoneText }}>Seu Pedido</h3>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: phoneSubText + '22', color: phoneSubText }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5 pb-6">

                {/* Resumo */}
                <div className="rounded-2xl p-4 border" style={{ background: phoneCard, borderColor: phoneSubText + '22' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>Itens</p>
                  <div className="space-y-2">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block truncate leading-tight mb-0.5" style={{ color: phoneText }}>{item.product.name}</span>
                          {item.optionsText && <span className="text-[11px] block pr-4 leading-snug" style={{ color: phoneSubText }}>{item.optionsText}</span>}
                        </div>
                        <span className="font-black whitespace-nowrap pt-0.5" style={{ color: brandColor }}>R$ {(item.displayPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Subtotal + frete */}
                  <div className="border-t mt-3 pt-3 space-y-2" style={{ borderColor: phoneSubText + '22' }}>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold" style={{ color: phoneSubText }}>Subtotal</span>
                      <span className="font-black" style={{ color: phoneText }}>R$ {cartTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold flex items-center gap-1.5" style={{ color: phoneSubText }}>
                        <MapPin className="w-3.5 h-3.5" /> Entrega
                      </span>
                      {isCalculatingFee ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: phoneSubText }} />
                      ) : deliveryFeeError ? (
                        <span className="text-red-500 font-black text-xs">{deliveryFeeError}</span>
                      ) : deliveryFee !== null ? (
                        <span className="font-black" style={{ color: deliveryFee === 0 ? '#22c55e' : phoneText }}>
                          {deliveryFee === 0 ? 'Grátis 🎁' : `R$ ${deliveryFee.toFixed(2)}`}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: phoneSubText }}>Selecione um endereço</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: phoneSubText + '22' }}>
                      <span className="font-black text-sm" style={{ color: phoneText }}>TOTAL</span>
                      <span className="font-black text-2xl" style={{ color: brandColor }}>
                        R$ {(cartTotal + (deliveryFee ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Upsell Carousel ── */}
                {upsellProducts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>
                      Aproveite e leve também
                    </p>
                    <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-1 px-1">
                      {upsellProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setIsCheckoutOpen(false)
                            setTimeout(() => openProductModal(product), 150)
                          }}
                          className="min-w-[130px] flex-shrink-0 rounded-2xl border p-2.5 text-left transition-transform active:scale-95"
                          style={{ background: phoneCard, borderColor: phoneSubText + '22' }}
                        >
                          {/* Imagem */}
                          <div
                            className="h-16 w-full rounded-xl overflow-hidden flex items-center justify-center"
                            style={{ background: brandColor + '15' }}
                          >
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-2xl select-none" style={{ opacity: 0.3 }}>🍽️</span>
                            )}
                          </div>

                          {/* Nome */}
                          <p className="text-xs font-bold mt-2 line-clamp-1 leading-tight" style={{ color: phoneText }}>
                            {product.name}
                          </p>

                          {/* Rodapé: preço + botão */}
                          <div className="flex items-center justify-between mt-1.5 gap-1">
                            <span className="text-xs font-black" style={{ color: brandColor }}>
                              R$ {product.price.toFixed(2)}
                            </span>
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: brandColor }}
                            >
                              <Plus className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Endereço */}
                {loadingAddresses ? (
                  <div className="flex items-center gap-3 py-4" style={{ color: phoneSubText }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: brandColor }} />
                    <span className="text-sm font-medium">Carregando endereços...</span>
                  </div>
                ) : userAddresses.length > 0 ? (
                  <AddressPicker
                    addresses={userAddresses}
                    selectedId={selectedAddressId}
                    onSelect={setSelectedAddressId}
                    onAddNew={() => { setIsCheckoutOpen(false); setIsLoginOpen(true) }}
                    brandColor={brandColor}
                    phoneBg={phoneBg}
                    phoneCard={phoneCard}
                    phoneText={phoneText}
                    phoneSubText={phoneSubText}
                  />
                ) : (
                  <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: brandColor + '10', borderColor: brandColor + '33' }}>
                    <MapPin className="w-5 h-5 shrink-0" style={{ color: brandColor }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: phoneText }}>Nenhum endereço cadastrado</p>
                      <button
                        type="button"
                        onClick={() => { setIsCheckoutOpen(false); setIsLoginOpen(true) }}
                        className="text-xs underline mt-0.5"
                        style={{ color: brandColor }}
                      >
                        Cadastrar agora →
                      </button>
                    </div>
                  </div>
                )}

                {/* Pagamento */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: phoneSubText }}>Forma de Pagamento</p>
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_OPTIONS.map(opt => {
                      const isSelected = paymentMethod === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentMethod(opt.id)}
                          className="flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all font-black text-xs uppercase min-h-[80px]"
                          style={isSelected
                            ? { borderColor: brandColor, background: brandColor + '18', color: brandColor }
                            : { borderColor: phoneSubText + '33', background: phoneCard, color: phoneSubText }
                          }
                        >
                          {opt.icon}
                          <span>{opt.label}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: phoneSubText }}>{opt.desc}</span>
                        </button>
                      )
                    })}
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
                      <label className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: phoneSubText }}>
                        Troco para quanto? <span className="normal-case font-medium">(opcional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: phoneSubText }}>R$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={orderTotal}
                          step="0.01"
                          value={changeFor}
                          onChange={e => setChangeFor(e.target.value)}
                          placeholder={`Mínimo R$ ${orderTotal.toFixed(2)}`}
                          className="w-full pl-12 min-h-[52px] rounded-xl border-2 px-4 py-3 text-sm font-medium outline-none transition-colors"
                          style={{
                            background: phoneCard,
                            color: phoneText,
                            borderColor: changeForError ? '#ef4444' : phoneSubText + '33',
                            caretColor: brandColor,
                          }}
                        />
                      </div>
                      {changeForError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-xs font-bold mt-1.5"
                        >
                          Valor mínimo para troco: R$ {orderTotal.toFixed(2)}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {checkoutError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm font-bold text-center bg-red-50 border border-red-200 p-3 rounded-xl">
                    {checkoutError}
                  </motion.p>
                )}
              </div>

              {/* CTA */}
              <div className="px-5 pb-8 pt-4 border-t" style={{ borderColor: phoneSubText + '22' }}>
                <button
                  onClick={handleConfirmOrder}
                  disabled={isProcessing || userAddresses.length === 0 || !!deliveryFeeError || isCalculatingFee || changeForError}
                  className="w-full flex items-center justify-center gap-2 text-white font-black text-base uppercase px-6 py-4 rounded-xl active:scale-[0.98] transition-all shadow-lg min-h-[56px] disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> PROCESSANDO...</>
                  ) : (
                    `Finalizar Pedido — R$ ${orderTotal.toFixed(2)}`
                  )}
                </button>
                {userAddresses.length === 0 && (
                  <p className="text-center text-xs mt-2" style={{ color: phoneSubText }}>Cadastre um endereço para continuar</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRODUTO MODAL ── */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        isHot={selectedProduct ? hotIds.has(selectedProduct.id) : false}
        onClose={closeProductModal}
        onAddToCart={handleAddToCart}
        storeTheme={storeTheme}
      />

    </>
  )
}
