import { prisma } from '@/lib/prisma';
import { tenantWhere } from '@/lib/tenant';
import { adminPath } from '@/lib/adminPath';
import { notFound, redirect } from 'next/navigation';
import { PaymentButton } from './PaymentButton';
import { Flame, AlertTriangle, ShieldCheck } from 'lucide-react';

export default async function PagamentoPendendentePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true, name: true, subscriptionStatus: true }
  });

  if (!store) notFound();

  // Se já estiver ativo, não tem porquê estar aqui, manda de volta pro painel!
  if (store.subscriptionStatus === 'ACTIVE') {
    redirect(adminPath(slug, '/admin'));
  }

  const isCanceled = store.subscriptionStatus === 'CANCELED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative z-10 text-center">
        
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <Flame className="w-6 h-6 text-white fill-white" strokeWidth={1.5} />
          </div>
          <span className="text-slate-900 font-black text-2xl tracking-tight">
            Saiu<span className="text-emerald-500">Delivery</span>
          </span>
        </div>

        {/* Status Icon */}
        <div className="mx-auto w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {isCanceled ? 'Sua loja está suspensa' : 'Aguardando Pagamento'}
        </h1>
        
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          {isCanceled 
            ? `Notamos que a assinatura da loja "${store.name}" foi cancelada. Para reativar o seu painel e continuar operando, por favor regularize o seu pagamento.`
            : `Falta muito pouco para liberar a "${store.name}". Para acessar o painel administrativo, você precisa concluir a assinatura mensal sem taxas.`
          }
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Vantagens garantidas:
          </h3>
          <ul className="text-sm text-slate-600 font-medium space-y-2">
            <li className="flex gap-2 items-start"><span className="text-emerald-500 font-bold">✓</span> 0% de comissão por pedido</li>
            <li className="flex gap-2 items-start"><span className="text-emerald-500 font-bold">✓</span> Sistema KDS em tempo real para a cozinha</li>
            <li className="flex gap-2 items-start"><span className="text-emerald-500 font-bold">✓</span> Painel administrativo completo</li>
          </ul>
        </div>

        {/* Client Component with the logic to call /api/pagamentos/checkout */}
        <PaymentButton storeId={store.id} />
        
        <p className="text-xs text-slate-400 font-medium mt-6">
          Pagamento processado de forma segura pela AbacatePay. <br />A ativação da sua loja ocorre de forma instantânea.
        </p>
      </div>
    </div>
  );
}
