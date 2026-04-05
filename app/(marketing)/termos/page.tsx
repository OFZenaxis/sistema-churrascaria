import Link from 'next/link'
import { Flame, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso · Saiu Delivery',
  robots: 'noindex, nofollow',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 antialiased">
      {/* Header simples */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4 text-white fill-white" strokeWidth={1.5} />
            </div>
            <span className="text-slate-900 font-black text-lg tracking-tight">
              Saiu<span className="text-rose-600">Delivery</span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <p className="text-rose-600 font-bold text-xs uppercase tracking-widest mb-3">Documento Legal</p>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Termos de Uso</h1>
        <p className="text-slate-400 text-sm font-medium mb-12">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        <div className="prose-custom space-y-10">

          {/* Cláusula Principal — Isenção Financeira */}
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg md:text-xl font-black text-amber-900 mb-4">
              Isenção de Responsabilidade Financeira
            </h2>
            <p className="text-amber-800 font-semibold leading-relaxed text-sm md:text-base">
              <strong>O Saiu Delivery atua exclusivamente como provedor de tecnologia (Software as a Service) para gestão de pedidos.</strong> Nós não processamos, não intermediamos, não retemos valores e não nos responsabilizamos por entregas, estornos, chargebacks ou pela qualidade dos produtos oferecidos. Toda e qualquer transação financeira via Pix ou Cartão ocorre de forma direta e exclusiva entre o consumidor final e a conta Mercado Pago do restaurante parceiro.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">1. Aceitação dos Termos</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              Ao acessar e utilizar a plataforma Saiu Delivery, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">2. Descrição do Serviço</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              O Saiu Delivery é uma plataforma SaaS (Software as a Service) que fornece ferramentas tecnológicas para que restaurantes e estabelecimentos alimentícios possam receber pedidos online através de um site próprio, gerenciar seu cardápio, e acompanhar pedidos em tempo real via sistema KDS (Kitchen Display System). A plataforma integra-se à API do Mercado Pago para processar pagamentos, sendo esta integração de responsabilidade exclusiva do estabelecimento contratante.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">3. Responsabilidades do Contratante</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base mb-4">
              O restaurante contratante é inteiramente responsável por:
            </p>
            <ul className="space-y-2">
              {[
                'Qualidade, preparo e entrega dos produtos vendidos',
                'Configuração e manutenção de sua conta no Mercado Pago',
                'Cumprimento das legislações fiscais e trabalhistas aplicáveis',
                'Gestão de reclamações, estornos e chargebacks junto ao Mercado Pago',
                'Veracidade das informações cadastradas na plataforma',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-slate-500 text-sm md:text-base font-medium">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">4. Plano e Pagamento</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              A assinatura é cobrada mensalmente no valor vigente no momento da contratação. O cancelamento pode ser realizado a qualquer momento diretamente no painel administrativo, sem multa ou fidelidade. Oferecemos garantia incondicional de reembolso de 7 dias para novos assinantes.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">5. Limitação de Responsabilidade</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              O Saiu Delivery não se responsabiliza por perdas ou danos decorrentes de: interrupções nos serviços do Mercado Pago, falhas de conectividade à internet, uso indevido da plataforma pelo contratante, ou qualquer dano indireto resultante do uso do sistema.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">6. Contato</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              Para dúvidas sobre estes termos, entre em contato pelo WhatsApp ou pelo e-mail disponível em nosso site.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <Link href="/privacidade" className="text-rose-600 font-bold text-sm hover:text-rose-700 transition-colors">
            Ver também: Política de Privacidade →
          </Link>
        </div>
      </main>
    </div>
  )
}
