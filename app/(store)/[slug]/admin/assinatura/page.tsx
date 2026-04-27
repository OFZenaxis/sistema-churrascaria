import { prisma } from '@/lib/prisma'
import { tenantWhere } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { getSubscriptionData, getSubscriptionHistory } from '@/app/actions/abacatepay'
import CancelSubscriptionButton from './CancelSubscriptionButton'
import { 
  ShieldCheck, 
  CreditCard, 
  CalendarDays, 
  Receipt,
  AlertCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AssinaturaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true, name: true, subscriptionStatus: true }
  })

  if (!store) notFound()

  // Busca dados na AbacatePay
  const { success, data: subData, error } = await getSubscriptionData(store.id)
  const { history = [] } = await getSubscriptionHistory(store.id)

  const isPending = store.subscriptionStatus === 'PENDING'
  const isCanceled = store.subscriptionStatus === 'CANCELED'
  const isActive = store.subscriptionStatus === 'ACTIVE'

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
            <Flame className="w-8 h-8 text-emerald-500" />
            Gestão da Assinatura
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Acompanhe o status e faturas do plano profissional da loja <strong className="text-slate-700">{store.name}</strong>.
          </p>
        </div>
      </div>

      {/* ERRO NA API */}
      {error && !isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-800 font-bold text-lg mb-1">Atenção ao sincronizar dados</h3>
            <p className="text-amber-700 font-medium text-sm">
              Não conseguimos nos comunicar com o gateway de pagamentos no momento ({error}). <br />
              Seu status local de assinatura está: <strong>{store.subscriptionStatus}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className={`col-span-1 lg:col-span-2 rounded-3xl p-8 border ${
          isActive ? 'bg-emerald-50 border-emerald-100' :
          isPending ? 'bg-amber-50 border-amber-100' :
          'bg-rose-50 border-rose-100'
        } relative overflow-hidden`}>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-emerald-500 text-white' :
                isPending ? 'bg-amber-500 text-white' :
                'bg-rose-500 text-white'
              }`}>
                {isActive ? <CheckCircle2 className="w-6 h-6" /> :
                 isPending ? <Clock className="w-6 h-6" /> :
                 <Ban className="w-6 h-6" />}
              </div>
              <div>
                <p className={`text-sm font-bold uppercase tracking-widest ${
                  isActive ? 'text-emerald-600' :
                  isPending ? 'text-amber-600' :
                  'text-rose-600'
                }`}>Status do Plano</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {isActive ? 'Ativo e Operante' :
                   isPending ? 'Aguardando Pagamento' :
                   'Assinatura Cancelada'}
                </h2>
              </div>
            </div>

            {subData && (
              <div className="grid grid-cols-2 gap-6 bg-white/60 p-5 rounded-2xl border border-white/40">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Valor Mensal
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subData.amount ? subData.amount / 100 : 97)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> Próxima Cobrança
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {subData.nextChargeAt ? new Date(subData.nextChargeAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não agendada'}
                  </p>
                </div>
              </div>
            )}
            
            {!subData && isPending && (
              <p className="text-slate-600 font-medium">Sua loja aguarda o primeiro pagamento para ser liberada.</p>
            )}
          </div>
          
          {/* Bg Decoration */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/40 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Action Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              SaaS Delivery
            </h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
              Acesso irrestrito a todos os recursos da plataforma, incluindo cardápio digital, gestão de pedidos, e sistema de painel de cozinha (KDS).
            </p>
          </div>

          <div className="space-y-4">
            {isActive && (
              <>
                <CancelSubscriptionButton storeId={store.id} />
                <p className="text-xs text-slate-400 font-medium text-center">
                  Deseja atualizar seu cartão? <a href="#" className="underline hover:text-slate-600">Fale com o suporte.</a>
                </p>
              </>
            )}
            {(isPending || isCanceled) && (
              <Link 
                href="/admin/pagamento"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Ativar Plano
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <Receipt className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Histórico de Faturas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 font-bold text-slate-500 text-sm">Data do Pagamento</th>
                <th className="px-8 py-4 font-bold text-slate-500 text-sm">Valor</th>
                <th className="px-8 py-4 font-bold text-slate-500 text-sm">Status</th>
                <th className="px-8 py-4 font-bold text-slate-500 text-sm text-right">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length > 0 ? (
                history.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 font-medium text-slate-700">
                      {new Date(invoice.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-4 font-black text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.paidAmount ? invoice.paidAmount / 100 : invoice.amount / 100)}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'REFUNDED' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {invoice.status === 'PAID' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {invoice.status === 'PAID' ? 'Pago' : invoice.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {invoice.receiptUrl ? (
                        <a 
                          href={invoice.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Ver Recibo <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">Indisponível</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-500 font-medium">
                    Nenhum histórico de pagamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
