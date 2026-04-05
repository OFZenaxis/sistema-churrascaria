"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Printer, Power, Loader2, ChefHat, AlertTriangle, CheckCircle2, Lock, LockOpen, MonitorOff, RefreshCw } from 'lucide-react'
import { useSidebar } from '../SidebarContext'
import { fetchKdsOrders, updateOrderStatus, toggleKdsStoreStatus } from '@/app/actions/admin'

// ── Types ─────────────────────────────────────────────────────────────────────

type KdsItem = {
  id: string
  quantity: number
  productName: string
  observation?: string
}

type KdsOrder = {
  id: string
  orderCode: string   // últimos 6 chars do UUID — exibido como referência
  customerName: string
  deliveryAddress: string
  items: KdsItem[]
  status: 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP'
  createdAt: Date
  paymentMethod: string
  totalAmount: number
}

// ── Tipos derivados do retorno de fetchKdsOrders (BUG-010) ───────────────────
// Evita `any` mantendo a tipagem 100% sincronizada com o que o servidor retorna.
type RawKdsOrder = Awaited<ReturnType<typeof fetchKdsOrders>>['orders'][number]
type RawKdsItem = RawKdsOrder['items'][number]

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapOrder(raw: RawKdsOrder): KdsOrder {
  return {
    id: raw.id,
    orderCode: raw.id.slice(-6).toUpperCase(),
    customerName: raw.customerName ?? 'Cliente',
    deliveryAddress: raw.deliveryAddress ?? '',
    status: raw.status as KdsOrder['status'],
    createdAt: new Date(raw.createdAt),
    paymentMethod: raw.paymentMethod ?? 'PIX',
    totalAmount: raw.totalAmount ?? 0,
    items: (raw.items ?? []).map((item: RawKdsItem) => ({
      id: item.id,
      quantity: item.quantity,
      productName: item.product?.name ?? 'Produto',
      observation: item.comboSides ?? undefined,
    })),
  }
}

const POLL_INTERVAL_MS = 8_000

// ── Fullscreen helpers — W-08: fallbacks para Safari/iOS (webkit prefix) ─────

function requestFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
  }
  return (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el)
}

function exitFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>
  }
  return (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)
}

function getFullscreenElement() {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null
  }
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KDSPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([])
  const [isOpen, setIsOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [togglingStore, setTogglingStore] = useState(false)
  const [showPinPad, setShowPinPad] = useState(false)
  const [unlockError, setUnlockError] = useState(false)
  const [noPinAlert, setNoPinAlert] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  // BUG-008: detecta falhas consecutivas de polling e exibe banner de aviso
  const [hasPollingError, setHasPollingError] = useState(false)
  const consecutiveErrorsRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevCountRef = useRef(0)

  const { isKitchenMode, setIsKitchenMode, kitchenPin } = useSidebar()

  // Live clock
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }, 10_000)
    return () => clearInterval(t)
  }, [])

  // ── Fetch & Polling ──────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    // W-09: setIsLoading(false) no finally garante que o spinner nunca trava em erro de rede
    try {
      const result = await fetchKdsOrders()
      if (!result.success) {
        // BUG-008: acumula falhas; banner aparece após 2 ciclos consecutivos
        consecutiveErrorsRef.current += 1
        if (consecutiveErrorsRef.current >= 2) setHasPollingError(true)
        return
      }
      // Sucesso — reseta contador e remove banner
      consecutiveErrorsRef.current = 0
      setHasPollingError(false)
      const mapped = result.orders.map(mapOrder)
      // Toca ding se chegou pedido novo
      if (mapped.length > prevCountRef.current && prevCountRef.current >= 0) {
        audioRef.current?.play().catch(() => {})
      }
      prevCountRef.current = mapped.length
      setOrders(mapped)
      setIsOpen(result.isOpen)
    } catch {
      consecutiveErrorsRef.current += 1
      if (consecutiveErrorsRef.current >= 2) setHasPollingError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Primeira carga
    loadOrders()
    // Polling
    const t = setInterval(loadOrders, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [loadOrders])

  // ── Kitchen mode ─────────────────────────────────────────────────────
  const enterKitchenMode = useCallback(async () => {
    if (!kitchenPin) {
      setNoPinAlert(true)
      setTimeout(() => setNoPinAlert(false), 4000)
      return
    }
    setIsKitchenMode(true)
    try {
      await requestFullscreen()
      setIsFullscreen(true)
    } catch { /* fullscreen opcional */ }
  }, [setIsKitchenMode, kitchenPin])

  const tryUnlock = useCallback(() => {
    setUnlockError(false)
    setShowPinPad(true)
  }, [])

  const handlePinSubmit = (pin: string) => {
    if (kitchenPin && pin === kitchenPin) {
      setIsKitchenMode(false)
      setShowPinPad(false)
      if (getFullscreenElement()) exitFullscreen()?.catch(() => {})
    } else {
      setUnlockError(true)
      setTimeout(() => setUnlockError(false), 1000)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!getFullscreenElement())
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  // ── Order actions — connected to DB ──────────────────────────────────
  const STATUS_ADVANCE: Record<KdsOrder['status'], string> = {
    PENDING: 'PREPARING',
    PREPARING: 'READY_FOR_PICKUP',
    READY_FOR_PICKUP: 'DISPATCHED',
  }

  const showActionError = (msg: string) => {
    setActionError(msg)
    setTimeout(() => setActionError(null), 4000)
  }

  const advanceStatus = useCallback(async (orderId: string, currentStatus: KdsOrder['status']) => {
    const next = STATUS_ADVANCE[currentStatus]
    if (!next) return

    // W-05: snapshot capturado via functional setter para rollback se a API falhar
    let snapshot: KdsOrder[] = []
    if (next === 'DISPATCHED') {
      setOrders(prev => { snapshot = prev; return prev.filter(o => o.id !== orderId) })
    } else {
      setOrders(prev => {
        snapshot = prev
        return prev.map(o => o.id === orderId ? { ...o, status: next as KdsOrder['status'] } : o)
      })
    }

    try {
      await updateOrderStatus(orderId, next)
      loadOrders()
    } catch {
      setOrders(snapshot)
      showActionError('Falha ao atualizar o pedido. Revertendo — tente novamente.')
    }
  }, [loadOrders])

  const archiveOrder = useCallback(async (orderId: string) => {
    let snapshot: KdsOrder[] = []
    setOrders(prev => { snapshot = prev; return prev.filter(o => o.id !== orderId) })

    try {
      await updateOrderStatus(orderId, 'DISPATCHED')
      loadOrders()
    } catch {
      setOrders(snapshot)
      showActionError('Falha ao arquivar o pedido. Revertendo — tente novamente.')
    }
  }, [loadOrders])

  // ── Toggle store open/closed ─────────────────────────────────────────
  const toggleStore = async () => {
    setTogglingStore(true)
    const result = await toggleKdsStoreStatus()
    if (result.success) setIsOpen(result.isOpen)
    setTogglingStore(false)
  }

  const pending   = orders.filter(o => o.status === 'PENDING')
  const preparing = orders.filter(o => o.status === 'PREPARING')
  const ready     = orders.filter(o => o.status === 'READY_FOR_PICKUP')

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-100">
      <audio ref={audioRef} src="/ding.mp3" preload="auto" />

      {/* ── Pin Pad Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showPinPad && (
          <PinPadModal
            onClose={() => setShowPinPad(false)}
            onSubmit={handlePinSubmit}
            error={unlockError}
            isKitchenMode={isKitchenMode}
          />
        )}
      </AnimatePresence>

      {/* ── Alerta: PIN não configurado ──────────────────────────── */}
      <AnimatePresence>
        {noPinAlert && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 font-bold text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-amber-100"
          >
            <span className="text-lg">⚠️</span>
            <span>Nenhum PIN configurado. Vá em <strong>Configurações → Segurança da Cozinha</strong> para definir um.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast de erro de ação (rollback W-05) ───────────────── */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-red-50 border border-red-300 text-red-800 font-bold text-sm px-5 py-3.5 rounded-2xl shadow-lg"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            {actionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BUG-008: Banner de falha de polling ──────────────────── */}
      <AnimatePresence>
        {hasPollingError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="shrink-0 flex items-center gap-3 bg-amber-50 border-b border-amber-200 text-amber-800 font-bold text-sm px-6 py-2.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Falha de conexão com o servidor. Tentando reconectar...</span>
            <button
              onClick={loadOrders}
              className="ml-auto text-xs font-black underline underline-offset-2 hover:text-amber-900 transition-colors"
            >
              Tentar agora
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlay Anti-ESC (Kitchen Mode ativo fora do fullscreen) */}
      <AnimatePresence>
        {isKitchenMode && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950 select-none"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <Lock className="w-10 h-10 text-slate-300" />
            </div>
            <h1 className="text-white text-4xl font-black tracking-tight mb-3">Modo Cozinha Ativo</h1>
            <p className="text-slate-500 text-base font-medium mb-12 text-center max-w-sm">
              A tela saiu do modo tela cheia. Escolha uma opção para continuar.
            </p>
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <button
                onClick={() => {
                  requestFullscreen()?.then(() => setIsFullscreen(true)).catch(() => {})
                }}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/30 transition-all"
              >
                ↑  Retornar ao Fullscreen
              </button>
              <button
                onClick={() => { setUnlockError(false); setShowPinPad(true) }}
                className="w-full py-5 border-2 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white font-black text-base rounded-2xl transition-all"
              >
                🔓  Desbloquear com PIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating unlock button ───────────────────────────────── */}
      <AnimatePresence>
        {isKitchenMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={tryUnlock}
            title="Desbloquear tela"
            className={`fixed bottom-5 right-5 z-[999] flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-sm shadow-xl transition-all ${
              unlockError
                ? 'bg-red-600 text-white animate-shake'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white backdrop-blur-sm'
            }`}
          >
            <Lock className="w-4 h-4" />
            {unlockError ? 'Senha incorreta' : 'Desbloquear'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── KDS Header ───────────────────────────────────────────── */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-none">Monitor da Cozinha</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              KDS · polling a cada {POLL_INTERVAL_MS / 1000}s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 font-bold text-sm">
            <Clock className="w-4 h-4" />
            {clock}
          </div>

          {/* Refresh manual */}
          <button
            onClick={loadOrders}
            title="Atualizar agora"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {/* Store toggle */}
          <button
            onClick={toggleStore}
            disabled={togglingStore}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${
              isOpen
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-400'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {togglingStore
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Power className="w-4 h-4" />}
            {isOpen ? 'Aberta' : 'Fechada'}
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {/* Kitchen Mode toggle */}
          <button
            onClick={isKitchenMode ? tryUnlock : enterKitchenMode}
            title={!kitchenPin && !isKitchenMode ? 'Configure um PIN em Configurações para usar o Modo Cozinha' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${
              isKitchenMode
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 hover:bg-amber-400'
                : kitchenPin
                  ? 'bg-slate-900 text-white hover:bg-slate-700 shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isKitchenMode
              ? <><LockOpen className="w-4 h-4" /> Desbloquear</>
              : <><MonitorOff className="w-4 h-4" /> Travar Tela</>}
          </button>
        </div>
      </header>

      {/* ── Loading inicial ──────────────────────────────────────── */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-bold text-sm">Carregando pedidos...</span>
        </div>
      )}

      {/* ── Kanban ────────────────────────────────────────────────── */}
      {!isLoading && (
        <main className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <KanbanColumn
            title="Pendentes"
            count={pending.length}
            accent="bg-amber-400"
            emptyText="Nenhum pedido aguardando."
          >
            <AnimatePresence>
              {pending.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => advanceStatus(order.id, order.status)}
                  onArchive={() => archiveOrder(order.id)}
                />
              ))}
            </AnimatePresence>
          </KanbanColumn>

          <KanbanColumn
            title="Em Preparo"
            count={preparing.length}
            accent="bg-orange-500"
            emptyText="Cozinha livre no momento."
          >
            <AnimatePresence>
              {preparing.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => advanceStatus(order.id, order.status)}
                  onArchive={() => archiveOrder(order.id)}
                />
              ))}
            </AnimatePresence>
          </KanbanColumn>

          <KanbanColumn
            title="Prontos para Entrega"
            count={ready.length}
            accent="bg-emerald-500"
            emptyText="Nenhum pedido pronto."
          >
            <AnimatePresence>
              {ready.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => advanceStatus(order.id, order.status)}
                  onArchive={() => archiveOrder(order.id)}
                />
              ))}
            </AnimatePresence>
          </KanbanColumn>
        </main>
      )}
    </div>
  )
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  title,
  count,
  accent,
  emptyText,
  children,
}: {
  title: string
  count: number
  accent: string
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col bg-slate-200/60 rounded-2xl overflow-hidden h-full">
      <div className="shrink-0 px-4 pt-4 pb-3 flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${accent} shrink-0`} />
        <h2 className="font-black text-slate-700 text-sm uppercase tracking-wide flex-1">{title}</h2>
        <span className={`text-xs font-black px-2.5 py-1 rounded-full text-white ${count > 0 ? accent : 'bg-slate-400'}`}>
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3">
        {count === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-bold text-center">{emptyText}</p>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Order Card ────────────────────────────────────────────────────────────────

const PAYMENT_LABEL: Record<string, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CARD_MACHINE: 'Maquininha',
  CARD_ONLINE: 'Cartão Online',
}

const PAYMENT_COLOR: Record<string, string> = {
  PIX: 'bg-emerald-100 text-emerald-700',
  CASH: 'bg-blue-100 text-blue-700',
  CARD_MACHINE: 'bg-purple-100 text-purple-700',
  CARD_ONLINE: 'bg-indigo-100 text-indigo-700',
}

const ACTION_CONFIG = {
  PENDING: {
    label: '▶  Começar Preparo',
    className: 'bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-amber-900 font-black shadow-md shadow-amber-400/30',
  },
  PREPARING: {
    label: '✓  Marcar como Pronto',
    className: 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black shadow-md shadow-emerald-500/30',
  },
  READY_FOR_PICKUP: {
    label: '→  Despachar para Entrega',
    className: 'border-2 border-slate-300 text-slate-600 hover:bg-slate-100 active:scale-[0.98] font-black',
  },
} as const

function OrderCard({
  order,
  onAction,
  onArchive,
}: {
  order: KdsOrder
  onAction: () => void
  onArchive: () => void
}) {
  const action = ACTION_CONFIG[order.status]
  const paymentLabel = PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod
  const paymentColor = PAYMENT_COLOR[order.paymentMethod] ?? 'bg-slate-100 text-slate-600'

  const printOrder = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Pedido #${order.orderCode}</title>
      <style>
        @page{margin:0}body{font-family:monospace;font-size:14px;width:80mm;padding:5mm;color:#000;margin:0 auto}
        h1{font-size:22px;font-weight:900;text-align:center;margin:0 0 8px}
        .center{text-align:center}.bold{font-weight:bold}
        .divider{border-bottom:2px dashed #000;margin:12px 0}
        .item{margin-bottom:12px}.obs{font-weight:900;font-size:15px;margin-top:4px;background:#fff3cd;padding:4px}
      </style></head><body>
        <h1>PEDIDO #${order.orderCode}</h1>
        <div class="center bold">${new Date().toLocaleTimeString('pt-BR')}</div>
        <div class="divider"></div>
        <div class="bold">Cliente: ${order.customerName}</div>
        <div>${order.deliveryAddress}</div>
        <div class="divider"></div>
        ${order.items.map(i => `
          <div class="item">
            <div class="bold">${i.quantity}x ${i.productName}</div>
            ${i.observation ? `<div class="obs">⚠ ${i.observation.toUpperCase()}</div>` : ''}
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="bold center" style="font-size:18px">TOTAL: R$ ${order.totalAmount.toFixed(2)}</div>
        <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden flex flex-col"
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-slate-900 leading-none">#{order.orderCode}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${paymentColor}`}>
              {paymentLabel}
            </span>
          </div>
          <p className="text-base font-bold text-slate-700 truncate">{order.customerName}</p>
          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{order.deliveryAddress}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ElapsedTimer createdAt={order.createdAt} />
          <button
            onClick={printOrder}
            title="Imprimir comanda"
            className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-3 flex-1">
        {order.items.map(item => (
          <div key={item.id}>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 font-black text-base w-5 shrink-0">{item.quantity}×</span>
              <span className="text-slate-900 font-black text-lg leading-tight">{item.productName}</span>
            </div>
            {item.observation && (
              <div className="mt-1.5 ml-7 flex items-start gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-rose-700 font-bold text-sm leading-snug">{item.observation}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total</span>
        <span className="text-base font-black text-slate-800">R$ {order.totalAmount.toFixed(2)}</span>
      </div>

      {/* Action button */}
      <div className="px-3 pb-3 pt-2">
        <button
          onClick={onAction}
          className={`w-full py-4 rounded-xl text-sm transition-all ${action.className}`}
        >
          {action.label}
        </button>
      </div>
    </motion.div>
  )
}

// ── Elapsed Timer ─────────────────────────────────────────────────────────────

function ElapsedTimer({ createdAt }: { createdAt: Date }) {
  const [isMounted, setIsMounted] = useState(false)
  const [elapsed, setElapsed] = useState(() => getElapsed(createdAt))

  useEffect(() => {
    setIsMounted(true)
    setElapsed(getElapsed(createdAt))
    const t = setInterval(() => setElapsed(getElapsed(createdAt)), 10_000)
    return () => clearInterval(t)
  }, [createdAt])

  const isLate = isMounted && elapsed.totalMinutes >= 20
  const className = `flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg ${
    isLate ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
  }`

  if (!isMounted) {
    return (
      <div className={className}>
        <Clock className="w-3 h-3" />
        00:00
      </div>
    )
  }

  return (
    <div className={className}>
      <Clock className="w-3 h-3" />
      {elapsed.label}
    </div>
  )
}

function getElapsed(createdAt: Date) {
  const totalSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)
  const label = hours > 0
    ? `${hours}h${String(minutes).padStart(2, '0')}m`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return { label, totalMinutes }
}

// ── Pin Pad Modal ─────────────────────────────────────────────────────────────

function PinPadModal({
  onClose,
  onSubmit,
  error,
  isKitchenMode,
}: {
  onClose: () => void
  onSubmit: (pin: string) => void
  error: boolean
  isKitchenMode: boolean
}) {
  const [pin, setPin] = useState('')

  const handleKeyPress = (key: string) => {
    if (pin.length < 6) setPin(prev => prev + key)
  }
  const handleBackspace = () => setPin(prev => prev.slice(0, -1))
  const handleConfirm = () => { if (pin.length >= 4) onSubmit(pin) }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key)
      else if (e.key === 'Backspace') handleBackspace()
      else if (e.key === 'Enter' && pin.length >= 4) handleConfirm()
      else if (e.key === 'Escape' && !isKitchenMode) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, isKitchenMode])

  useEffect(() => { if (error) setPin('') }, [error])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md"
    >
      <div className="mb-10 flex flex-col items-center">
        <h2 className="text-white font-bold text-xl mb-8">Desbloquear Cozinha</h2>
        <div className={`flex gap-4 ${error ? 'animate-shake' : ''}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? 'bg-red-500 scale-110'
                    : 'bg-emerald-500 scale-125 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <div className="h-7 mt-4 flex items-center justify-center">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 font-black text-sm tracking-wide"
              >
                PIN incorreto — tente novamente
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(String(num))}
            className="w-20 h-20 flex items-center justify-center rounded-full text-3xl font-light text-white bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/50 transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-20 h-20 flex items-center justify-center rounded-full text-sm font-bold text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/50 transition-colors uppercase tracking-wider"
        >
          Sair
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="w-20 h-20 flex items-center justify-center rounded-full text-3xl font-light text-white bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/50 transition-colors"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-20 h-20 flex items-center justify-center rounded-full text-2xl font-light text-slate-300 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/50 transition-colors"
        >
          ⌫
        </button>
      </div>

      <div className="h-16 mt-8">
        <AnimatePresence>
          {pin.length >= 4 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleConfirm}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
            >
              Confirmar
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
