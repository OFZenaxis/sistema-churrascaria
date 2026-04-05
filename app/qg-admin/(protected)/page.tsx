import { prisma } from '@/lib/prisma'
import { Store, Magnet, DollarSign, Activity, TrendingUp, Clock } from 'lucide-react'

export default async function QGDashboardPage() {
  const [storeCount, leadCount, recentLeads, recentStores] = await Promise.all([
    prisma.store.count(),
    prisma.partialLead.count(),
    prisma.partialLead.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, email: true, createdAt: true } }),
    prisma.store.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, slug: true, createdAt: true } }),
  ])

  const mrr = storeCount * 97
  const conversionRate = leadCount > 0 ? Math.round((storeCount / leadCount) * 100) : 0

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Saiu Delivery</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Visão operacional em tempo real.{' '}
          <span className="text-emerald-500 font-bold">● Sistema Online</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Store}
          label="Lojas Ativas"
          value={storeCount.toString()}
          sub="tenants cadastrados"
          accent="emerald"
        />
        <KPICard
          icon={Magnet}
          label="Leads Capturados"
          value={leadCount.toString()}
          sub="cadastros incompletos"
          accent="blue"
        />
        <KPICard
          icon={DollarSign}
          label="MRR Estimado"
          value={`R$ ${mrr.toLocaleString('pt-BR')}`}
          sub="lojas × R$ 97/mês"
          accent="rose"
        />
        <KPICard
          icon={TrendingUp}
          label="Conversão"
          value={`${conversionRate}%`}
          sub="leads → lojas pagas"
          accent="amber"
        />
      </div>

      {/* Status + Activity Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        {/* System Status */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status do Sistema</p>
            <Activity className="w-4 h-4 text-slate-600" />
          </div>
          <div className="space-y-3">
            {[
              { label: 'API / Next.js',     status: 'online' },
              { label: 'Banco de Dados',    status: 'online' },
              { label: 'Autenticação HMAC', status: 'online' },
              { label: 'Webhook MercadoPago', status: 'online' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">{label}</span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Últimos Leads</p>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-slate-600 text-sm font-medium">Nenhum lead ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 text-[10px] font-black">{(lead.name?.[0] ?? '?').toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-semibold truncate">{lead.name ?? '—'}</p>
                    <p className="text-slate-600 text-[11px] font-medium truncate">{lead.email ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stores */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Últimas Lojas</p>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          {recentStores.length === 0 ? (
            <p className="text-slate-600 text-sm font-medium">Nenhuma loja ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentStores.map((store, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-emerald-400 text-[10px] font-black">{store.name[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-semibold truncate">{store.name}</p>
                    <p className="text-slate-600 text-[11px] font-mono truncate">{store.slug}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
type Accent = 'emerald' | 'blue' | 'rose' | 'amber'

const ACCENT_MAP: Record<Accent, { bg: string; border: string; icon: string; value: string }> = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', value: 'text-emerald-400' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: 'text-blue-400',    value: 'text-blue-400'    },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: 'text-rose-400',    value: 'text-rose-400'    },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400',   value: 'text-amber-400'   },
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  accent: Accent
}) {
  const a = ACCENT_MAP[accent]
  return (
    <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{label}</p>
        <div className={`w-8 h-8 rounded-lg ${a.bg} border ${a.border} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${a.icon}`} />
        </div>
      </div>
      <p className={`text-3xl font-black tracking-tight mb-1 ${a.value}`}>{value}</p>
      <p className="text-slate-600 text-xs font-medium">{sub}</p>
    </div>
  )
}
