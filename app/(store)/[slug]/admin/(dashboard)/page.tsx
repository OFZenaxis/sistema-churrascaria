import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect } from 'next/navigation'
import {
  DollarSign, Receipt, ShoppingBag, Banknote, CreditCard, Coins,
  Smartphone, TrendingUp, Package,
} from 'lucide-react'
import StoreToggle from './StoreToggle'
import { tenantWhere } from '@/lib/tenant'
import { adminPath } from '@/lib/adminPath'
import RevenueChart, { type RevenuePoint } from '@/components/admin/RevenueChart'
import DashboardFilter, { type PeriodValue } from '@/components/admin/DashboardFilter'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// ── Derivar startDate / endDate a partir do period ────────────────────
function getDateRange(period: PeriodValue): { startDate: Date; endDate: Date } {
  // Trabalha sempre em horário local do servidor
  const now = new Date()

  // Início do dia corrente (00:00:00.000)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Fim do dia corrente (23:59:59.999)
  const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  switch (period) {
    case 'today':
      return { startDate: startOfToday, endDate: endOfToday }

    case 'yesterday': {
      const start = new Date(startOfToday); start.setDate(start.getDate() - 1)
      const end   = new Date(endOfToday);   end.setDate(end.getDate() - 1)
      return { startDate: start, endDate: end }
    }

    case '7d': {
      const start = new Date(startOfToday); start.setDate(start.getDate() - 6)
      return { startDate: start, endDate: endOfToday }
    }

    case '30d': {
      const start = new Date(startOfToday); start.setDate(start.getDate() - 29)
      return { startDate: start, endDate: endOfToday }
    }

    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: start, endDate: endOfToday }
    }

    default: {
      const start = new Date(startOfToday); start.setDate(start.getDate() - 6)
      return { startDate: start, endDate: endOfToday }
    }
  }
}

// ── Agrupar pedidos em pontos do gráfico ─────────────────────────────
function buildChartData(
  orders: { totalAmount: number; createdAt: Date }[],
  period: PeriodValue,
  startDate: Date,
  endDate: Date,
): RevenuePoint[] {
  const byHour = period === 'today' || period === 'yesterday'

  if (byHour) {
    // Gera 24 slots de hora para o dia
    const slots: Record<string, number> = {}
    for (let h = 0; h < 24; h++) {
      slots[`${String(h).padStart(2, '0')}:00`] = 0
    }
    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours()
      const key = `${String(h).padStart(2, '0')}:00`
      slots[key] = (slots[key] ?? 0) + o.totalAmount
    })
    // Remove horas futuras se for hoje
    const nowHour = new Date().getHours()
    const isPastOrYesterday = period === 'yesterday'
    return Object.entries(slots)
      .filter(([key]) => isPastOrYesterday || parseInt(key) <= nowHour)
      .map(([label, value]) => ({ label, value }))
  }

  // Agrupamento por dia
  const slots: Record<string, number> = {}
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const key = cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    slots[key] = 0
    cursor.setDate(cursor.getDate() + 1)
  }
  orders.forEach(o => {
    const key = new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    if (key in slots) slots[key] = (slots[key] ?? 0) + o.totalAmount
  })
  return Object.entries(slots).map(([label, value]) => ({ label, value }))
}

// ── O-02: Constantes no escopo do módulo — não recriadas a cada render ───────

// Labels de status para a tabela de pedidos recentes
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:          { label: 'Pendente',   className: 'bg-blue-50 text-blue-700'       },
  PREPARING:        { label: 'Preparando', className: 'bg-amber-50 text-amber-700'     },
  READY_FOR_PICKUP: { label: 'Pronto',     className: 'bg-violet-50 text-violet-700'   },
  DISPATCHED:       { label: 'A Caminho',  className: 'bg-orange-50 text-orange-700'   },
  DELIVERED:        { label: 'Entregue',   className: 'bg-emerald-50 text-emerald-700' },
  CANCELED:         { label: 'Cancelado',  className: 'bg-red-50 text-red-600'         },
}

// Labels de período para o header
const PERIOD_LABEL: Record<PeriodValue, string> = {
  today:     'Hoje',
  yesterday: 'Ontem',
  '7d':      'Últimos 7 dias',
  '30d':     'Últimos 30 dias',
  month:     'Este Mês',
}

// ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])

  const period = (['today', 'yesterday', '7d', '30d', 'month'].includes(sp.period ?? '')
    ? sp.period
    : '7d') as PeriodValue

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true, name: true, isOpen: true, brandColor: true }
  })
  if (!store) redirect(adminPath(slug, '/admin/login'))

  const session = await getLojistaSession(store.id)
  if (!session || session.storeId !== store.id) redirect(adminPath(slug, '/admin/login'))

  const brandColor = store.brandColor ?? '#10b981'

  const { startDate, endDate } = getDateRange(period)

  // baseWhere aplica filtro de período + exclui cancelados
  const baseWhere = {
    storeId: store.id,
    status: { not: 'CANCELED' as const },
    createdAt: { gte: startDate, lte: endDate },
  }

  // recentOrders: sempre os últimos 8 independente de período
  const recentOrdersWhere = { storeId: store.id }

  // W-03: aggregações de categoria e top produtos feitas no banco via $queryRaw,
  // eliminando o carregamento de todos os OrderItems em memória
  type CategoryRaw  = { label: string; value: number }
  type ProductRaw   = { name: string; qty: number; revenue: number }

  const [orders, paymentGroups, recentOrders, categoryRaw, topProductsRaw] = await Promise.all([
    prisma.order.findMany({
      where: baseWhere,
      select: { totalAmount: true, paymentMethod: true, createdAt: true }
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: baseWhere,
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: recentOrdersWhere,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, customerName: true, totalAmount: true, status: true, createdAt: true }
    }),
    prisma.$queryRaw<CategoryRaw[]>`
      SELECT c.name                                               AS label,
             CAST(SUM(oi.quantity * oi."unitPrice") AS FLOAT)    AS value
      FROM   "OrderItem" oi
      JOIN   "Product"  p ON oi."productId" = p.id
      JOIN   "Category" c ON p."categoryId" = c.id
      JOIN   "Order"    o ON oi."orderId"   = o.id
      WHERE  o."storeId"    = ${store.id}
        AND  o.status       != 'CANCELED'
        AND  o."createdAt"  >= ${startDate}
        AND  o."createdAt"  <= ${endDate}
      GROUP  BY c.name
      ORDER  BY value DESC
      LIMIT  5
    `,
    prisma.$queryRaw<ProductRaw[]>`
      SELECT p.name,
             CAST(SUM(oi.quantity) AS INT)                        AS qty,
             CAST(SUM(oi.quantity * oi."unitPrice") AS FLOAT)     AS revenue
      FROM   "OrderItem" oi
      JOIN   "Product" p ON oi."productId" = p.id
      JOIN   "Order"   o ON oi."orderId"   = o.id
      WHERE  o."storeId"    = ${store.id}
        AND  o.status       != 'CANCELED'
        AND  o."createdAt"  >= ${startDate}
        AND  o."createdAt"  <= ${endDate}
      GROUP  BY p.name
      ORDER  BY qty DESC
      LIMIT  5
    `,
  ])

  const totalSales   = orders.reduce((s, o) => s + o.totalAmount, 0)
  const totalOrders  = orders.length
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

  // ── Gráfico ────────────────────────────────────────────────────────
  const chartData = buildChartData(orders, period, startDate, endDate)

  // ── Categorias ────────────────────────────────────────────────────
  // W-03: dados já agregados pelo banco via $queryRaw — sem reduce em memória
  const categoryRows = categoryRaw.map(row => ({
    label:   row.label,
    value:   row.value,
    percent: totalSales > 0 ? Math.round((row.value / totalSales) * 100) : 0,
  }))

  // ── Top Produtos ──────────────────────────────────────────────────
  const topProducts = topProductsRaw

  // ── Pagamentos ────────────────────────────────────────────────────
  const PAYMENT_META: Record<string, { label: string; icon: React.ReactNode; bg: string }> = {
    PIX:          { label: 'Pix',            icon: <Smartphone className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
    CARD_ONLINE:  { label: 'Cartão Online',  icon: <CreditCard  className="w-5 h-5 text-blue-600"    />, bg: 'bg-blue-50'   },
    CARD_MACHINE: { label: 'Cartão Máquina', icon: <CreditCard  className="w-5 h-5 text-violet-600"  />, bg: 'bg-violet-50' },
    CASH:         { label: 'Dinheiro',       icon: <Coins       className="w-5 h-5 text-orange-600"  />, bg: 'bg-orange-50' },
  }
  const paymentRows = paymentGroups
    .filter(g => g.paymentMethod)
    .sort((a, b) => (b._sum.totalAmount ?? 0) - (a._sum.totalAmount ?? 0))
    .map(g => {
      const method = g.paymentMethod!
      const value  = g._sum.totalAmount ?? 0
      const meta   = PAYMENT_META[method] ?? { label: method, icon: <Banknote className="w-5 h-5 text-slate-600" />, bg: 'bg-slate-50' }
      return { method, ...meta, value, percent: totalSales > 0 ? Math.round((value / totalSales) * 100) : 0 }
    })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">

      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {PERIOD_LABEL[period]} — pedidos não cancelados
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Suspense necessário pois DashboardFilter usa useSearchParams */}
          <Suspense>
            <DashboardFilter />
          </Suspense>
          <StoreToggle storeId={store.id} initialOpen={store.isOpen} />
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard
          label="Vendas Totais"
          value={`R$ ${totalSales.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-300" />}
          iconBg="bg-emerald-700"
          isHero
          growth={`${PERIOD_LABEL[period]}`}
        />
        <MetricCard
          label="Ticket Médio"
          value={`R$ ${averageTicket.toFixed(2)}`}
          icon={<Receipt className="w-6 h-6 text-orange-500" />}
          iconBg="bg-orange-50"
          growth={totalOrders > 0 ? `${totalOrders} pedido${totalOrders !== 1 ? 's' : ''} no período` : 'Sem pedidos'}
        />
        <MetricCard
          label="Pedidos"
          value={String(totalOrders)}
          icon={<ShoppingBag className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-50"
          growth={averageTicket > 0 ? `Média R$ ${averageTicket.toFixed(2)}/pedido` : 'Sem pedidos'}
        />
      </div>

      {/* ── Gráfico de Faturamento ────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Faturamento — {PERIOD_LABEL[period]}
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              {period === 'today' || period === 'yesterday'
                ? 'Receita por hora do dia'
                : 'Receita acumulada por dia'}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-black text-slate-900">R$ {totalSales.toFixed(2)}</p>
            <p className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> total do período
            </p>
          </div>
        </div>
        <RevenueChart data={chartData} brandColor={brandColor} />
      </div>

      {/* ── Categorias + Pagamentos ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6">Faturamento por Categoria</h2>
          <div className="space-y-5">
            {categoryRows.length === 0
              ? <p className="text-sm text-slate-400 font-medium">Nenhuma venda no período.</p>
              : categoryRows.map(row => (
                  <CategoryRow key={row.label} label={row.label} value={`R$ ${row.value.toFixed(2)}`} percent={row.percent} brandColor={brandColor} />
                ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6">Vendas por Pagamento</h2>
          <div className="space-y-4">
            {paymentRows.length === 0
              ? <p className="text-sm text-slate-400 font-medium">Nenhuma venda no período.</p>
              : paymentRows.map(row => (
                  <PaymentRow key={row.method} icon={row.icon} bg={row.bg} label={row.label} value={`R$ ${row.value.toFixed(2)}`} percent={row.percent} />
                ))}
          </div>
        </div>
      </div>

      {/* ── Top Produtos + Últimos Pedidos ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Top Produtos</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{PERIOD_LABEL[period]}</p>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {topProducts.length === 0
              ? <p className="text-sm text-slate-400 font-medium">Sem dados de vendas no período.</p>
              : topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700'
                      : i === 1 ? 'bg-slate-100 text-slate-600'
                      : i === 2 ? 'bg-orange-50 text-orange-600'
                      : 'bg-slate-50 text-slate-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs font-medium text-slate-400">{p.qty} unid.</p>
                    </div>
                    <span className="text-sm font-black text-slate-900 whitespace-nowrap">R$ {p.revenue.toFixed(2)}</span>
                  </div>
                ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 border-b border-slate-100 shrink-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Últimos Pedidos</h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Histórico global — independente do período selecionado</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60">
                  {['Pedido', 'Cliente', 'Valor', 'Status', 'Hora'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.length === 0
                  ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400 font-medium">Nenhum pedido registrado ainda.</td></tr>
                  : recentOrders.map(order => (
                      <OrderRow
                        key={order.id}
                        id={`#${order.id.slice(-6).toUpperCase()}`}
                        client={order.customerName}
                        value={`R$ ${order.totalAmount.toFixed(2)}`}
                        status={order.status}
                        time={new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      />
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────

function MetricCard({
  label, value, icon, iconBg, isHero = false, growth,
}: {
  label: string; value: string; icon: React.ReactNode
  iconBg: string; isHero?: boolean; growth?: string
}) {
  return (
    <div className={`rounded-3xl border p-6 md:p-8 hover:shadow-md transition-shadow relative overflow-hidden group ${
      isHero ? 'bg-emerald-900 border-transparent shadow-emerald-900/20' : 'bg-white border-slate-100 shadow-sm'
    }`}>
      {isHero && <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform origin-bottom-left shadow-sm relative z-10 ${iconBg}`}>
        {icon}
      </div>
      <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 relative z-10 ${isHero ? 'text-emerald-100/70' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-4xl font-black tracking-tight relative z-10 ${isHero ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      {growth && (
        <div className={`flex items-center gap-1 text-xs font-bold mt-3 relative z-10 ${isHero ? 'text-emerald-300' : 'text-slate-400'}`}>
          <TrendingUp className="w-3 h-3 shrink-0" />
          {growth}
        </div>
      )}
    </div>
  )
}

function CategoryRow({ label, value, percent, brandColor }: { label: string; value: string; percent: number; brandColor: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-bold text-slate-700 truncate pr-2">{label}</span>
        <span className="text-sm font-black text-slate-900 whitespace-nowrap">{value}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, background: brandColor }} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 mt-1">{percent}% do faturamento</p>
    </div>
  )
}

function PaymentRow({ icon, bg, label, value, percent }: { icon: React.ReactNode; bg: string; label: string; value: string; percent: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-700">{label}</span>
          <span className="text-sm font-black text-slate-900">{value}</span>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-0.5">{percent}% do total</p>
      </div>
    </div>
  )
}

function OrderRow({ id, client, value, status, time }: { id: string; client: string; value: string; status: string; time: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-5 py-3.5"><span className="text-sm font-black text-slate-900">{id}</span></td>
      <td className="px-5 py-3.5"><span className="text-sm font-semibold text-slate-600 truncate max-w-[120px] block">{client}</span></td>
      <td className="px-5 py-3.5"><span className="text-sm font-black text-slate-900 whitespace-nowrap">{value}</span></td>
      <td className="px-5 py-3.5">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg whitespace-nowrap ${cfg.className}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-5 py-3.5"><span className="text-sm font-bold text-slate-400 whitespace-nowrap">{time}</span></td>
    </tr>
  )
}
