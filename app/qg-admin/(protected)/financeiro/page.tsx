import { prisma } from '@/lib/prisma'
import { DollarSign, TrendingUp } from 'lucide-react'

export default async function QGFinanceiroPage() {
  const storeCount = await prisma.store.count()
  const mrr = storeCount * 97
  const arr = mrr * 12

  return (
    <div className="px-8 py-8">
      <div className="mb-10">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Saiu Delivery</p>
        <h1 className="text-3xl font-black text-white tracking-tight">Financeiro</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Projeções baseadas nos tenants ativos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MRR</p>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-rose-400">R$ {mrr.toLocaleString('pt-BR')}</p>
          <p className="text-slate-600 text-xs font-medium mt-1">{storeCount} lojas × R$ 97</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ARR</p>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">R$ {arr.toLocaleString('pt-BR')}</p>
          <p className="text-slate-600 text-xs font-medium mt-1">Receita anual recorrente estimada</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta 20 Lojas</p>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{Math.min(storeCount, 20)}/20</p>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((storeCount / 20) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-8 text-center">
        <p className="text-slate-600 font-semibold text-sm">Integração com Mercado Pago para MRR real em breve.</p>
      </div>
    </div>
  )
}
