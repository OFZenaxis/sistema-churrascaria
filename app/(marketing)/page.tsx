import Link from 'next/link'
import {
  Flame,
  ArrowRight,
  CheckCircle2,
  Globe,
  MonitorCheck,
  Banknote,
  TrendingUp,
  ShieldCheck,
  QrCode,
  Zap,
  ChevronDown,
  X,
  Minus,
  MessageSquare,
  Unlock,
  HandCoins,
  Users,
  RefreshCcw,
} from 'lucide-react'

// ─── Sub-components ──────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/75 border-b border-slate-200/80 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center shadow-sm">
            <Flame className="w-4.5 h-4.5 text-white fill-white" strokeWidth={1.5} />
          </div>
          <span className="text-slate-900 font-black text-lg tracking-tight">
            Saiu<span className="text-rose-600">Delivery</span>
          </span>
        </div>

        {/* Nav + CTA */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Preço</a>
          </nav>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-rose-600/30"
          >
            Criar Minha Loja <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-5 text-center relative overflow-hidden">
      {/* Subtle background gradient + grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-rose-100/60 via-orange-50/40 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8 shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          A revolução do delivery independente
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight text-balance mb-6 md:mb-8">
          Pare de trabalhar{' '}
          <span className="relative inline-block">
            <span className="relative z-10">para os aplicativos.</span>
            <span className="absolute inset-x-0 bottom-1 h-3 bg-rose-200/70 rounded-sm -z-0" />
          </span>
          <br />
          <span className="text-emerald-600">O lucro do seu delivery</span>
          <br />
          deve ser 100% seu.
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12 text-balance">
          Tenha seu site de pedidos próprio, Pix caindo direto na sua conta e sistema de cozinha KDS.{' '}
          <span className="text-slate-700 font-semibold">Pagando apenas uma mensalidade fixa.</span>
        </p>

        {/* CTA Group */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/cadastro"
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all text-white font-black text-base md:text-lg px-8 md:px-10 py-4 md:py-5 rounded-2xl shadow-2xl shadow-rose-600/30 group border border-rose-500/50"
          >
            Quero parar de pagar taxas
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Sem pegadinhas. Setup em 5 minutos.
          </p>
        </div>

        {/* CSS Mockup Tangível */}
        <div className="mt-16 mx-auto max-w-[360px] animate-fade-up relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-rose-500/20 blur-2xl rounded-[3rem]" />
          <div className="relative bg-white/70 backdrop-blur-xl border border-white p-5 md:p-6 rounded-[2rem] shadow-2xl shadow-slate-900/10 text-left">
            <div className="flex justify-between items-start mb-5 gap-2">
              <div>
                <span className="bg-emerald-100/80 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border border-emerald-200/50">Novo Pedido</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-3 tracking-tight">Mesa 7</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">2x Picanha na Brasa, Coca-Cola</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl md:text-2xl font-black text-emerald-600 tracking-tight">R$ 145<span className="text-sm md:text-base text-emerald-500 font-bold">,90</span></span>
                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-wider bg-slate-100 inline-block px-2 py-0.5 rounded">Via Pix</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.97] transition-all text-white font-black text-base md:text-lg py-3 md:py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 border border-emerald-400/50">
              <CheckCircle2 className="w-5 h-5" /> Aceitar Pedido
            </button>
          </div>
        </div>

        {/* Social Proof Numbers */}
        <div className="mt-16 md:mt-20 grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto border-t border-slate-200/50 pt-8 md:pt-10">
          {[
            { value: 'R$ 0', label: 'Taxa / pedido', color: 'text-emerald-600' },
            { value: '5min', label: 'Para ir ao ar', color: 'text-rose-600' },
            { value: '100%', label: 'Seu lucro', color: 'text-slate-900' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl md:text-3xl font-black ${color} tracking-tight`}>{value}</p>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BentoGrid() {
  return (
    <section id="features" className="py-14 md:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-rose-600 font-bold text-xs md:text-sm uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight text-balance">
            Tudo que você precisa,<br className="hidden md:block" />nada que você não precisa.
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">

          {/* Card 1 — GRANDE: Pix Transparente (col-span-2, row-span-1) */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
                <QrCode className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3">
                Pix Transparente Nativo
              </h3>
              <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed mb-6 max-w-sm">
                O dinheiro do seu cliente vai direto para a sua conta. Sem intermediários, sem esperar 30 dias, sem taxa de repasse.
              </p>
              <div className="flex flex-col md:flex-row items-stretch gap-4">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">iFood / Rappi</p>
                  <p className="text-xl md:text-2xl font-black text-rose-500">- R$ 5.400<span className="text-xs md:text-sm font-semibold text-slate-400">/mês</span></p>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">Em taxas e comissões</p>
                </div>
                <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-[10px] md:text-xs text-emerald-700 font-semibold uppercase tracking-widest mb-1">Saiu Delivery</p>
                  <p className="text-xl md:text-2xl font-black text-emerald-600">R$ 0<span className="text-xs md:text-sm font-semibold text-emerald-500">/pedido</span></p>
                  <p className="text-[10px] md:text-xs text-emerald-600 mt-0.5 font-medium">Zero taxas de comissão</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — MÉDIO: Domínio próprio */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow overflow-hidden relative group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-5">
                <Globe className="w-5 h-5 md:w-6 md:h-6 text-rose-400" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight mb-2">
                Domínio com a Sua Marca
              </h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 flex-1">
                Use nosso link grátis ou conecte seu domínio próprio. Sua marca, sua identidade.
              </p>
              <div className="flex flex-col gap-2">
                <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 font-mono text-[11px] md:text-sm truncate border border-slate-700/50">
                  <span className="text-slate-500">https://</span>
                  <span className="text-rose-400 font-bold whitespace-nowrap">pizzadojoao.com.br</span>
                </div>
                <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 font-mono text-[11px] md:text-sm truncate border border-slate-700/50">
                  <span className="text-slate-500">https://</span>
                  <span className="text-rose-400 font-bold whitespace-nowrap">pizzadojoao</span>
                  <span className="text-slate-400">.saiudelivery...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 — MÉDIO: KDS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-40 h-40 bg-orange-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-5">
                <MonitorCheck className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-2">
                Cozinha Sincronizada
                <span className="ml-2 text-[10px] md:text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg align-middle">KDS</span>
              </h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Pedido confirmado pelo cliente? A cozinha já viu. Sem papéis, sem grito, sem pedido perdido. Tudo em tempo real.
              </p>
              <p className="mt-3 text-[11px] text-orange-600 font-semibold bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 leading-relaxed">
                <strong>KDS (Kitchen Display System):</strong> Uma tela inteligente para a sua cozinha organizar os pedidos sem precisar de papel ou impressora.
              </p>
              <div className="mt-5 flex items-center gap-2">
                {['PENDENTE', 'PREPARO', 'PRONTO'].map((status, i) => (
                  <div key={status} className={`flex-1 text-center py-2 rounded-xl text-[10px] md:text-xs font-black truncate px-1 ${
                    i === 1
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {status}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4 — LARGO: Zero Taxa (col-span-2) */}
          <div className="md:col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-6 md:p-8 shadow-lg shadow-emerald-600/25 overflow-hidden relative group">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-40 h-40 text-white" strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                <Banknote className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-3xl font-black text-white tracking-tight mb-2">
                Zero Taxa por Pedido. Ponto Final.
              </h3>
              <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed mb-6 max-w-md">
                Um restaurante faturando R$ 30.000/mês paga até{' '}
                <strong className="text-white">R$ 6.000 em comissões</strong> nos apps.
                No Saiu Delivery, você paga{' '}
                <strong className="text-white">R$ 97 fixos</strong> e fica com o resto.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {['Sem comissão por pedido', 'Sem taxa de repasse', 'Sem fidelidade forçada'].map(item => (
                  <div key={item} className="flex items-center gap-1.5 bg-white/15 text-white text-xs md:text-sm font-semibold px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-200 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function SetupSteps() {
  const steps = [
    { num: '1', label: 'Crie sua conta', desc: 'Cadastro em 2 minutos, sem cartão de crédito para começar.' },
    { num: '2', label: 'Cadastre o cardápio', desc: 'Adicione produtos, preços e fotos pelo painel admin.' },
    { num: '3', label: 'Receba no Pix', desc: 'Compartilhe seu link e o dinheiro cai direto na sua conta.' },
  ]

  return (
    <section className="py-14 md:py-20 px-5 bg-stone-50/80 border-y border-slate-200/60">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-rose-600 font-bold text-xs md:text-sm uppercase tracking-widest mb-3">Simples assim</p>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            Setup em 5 minutos. Sério.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex flex-col md:flex-row items-center flex-1">
              {/* Step card */}
              <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-6 text-center md:text-left shadow-sm w-full">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-lg flex items-center justify-center mb-4 mx-auto md:mx-0 shadow-md shadow-rose-600/25">
                  {step.num}
                </div>
                <p className="font-black text-slate-900 text-base mb-1">{step.label}</p>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{step.desc}</p>
              </div>
              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center py-2 md:py-0 md:px-3 shrink-0">
                  <ArrowRight className="w-5 h-5 text-slate-300 rotate-90 md:rotate-0" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all text-white font-black text-base px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/30 group"
          >
            Criar Minha Loja
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function InlineCTA() {
  return (
    <div className="py-10 md:py-14 px-5 flex justify-center bg-white border-y border-slate-100">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-xl w-full">
        <p className="text-slate-600 font-semibold text-sm md:text-base text-center sm:text-left text-balance flex-1">
          Pronto para parar de pagar taxas? Comece agora com <strong className="text-rose-600">garantia de 7 dias.</strong>
        </p>
        <Link
          href="/cadastro"
          className="shrink-0 inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md shadow-rose-600/25 group whitespace-nowrap"
        >
          Criar Minha Loja <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

function FoundersProgram() {
  return (
    <section className="py-14 md:py-24 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-rose-600 font-bold text-xs md:text-sm uppercase tracking-widest mb-3">Programa Exclusivo</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight text-balance">
            Seja um dos 50 Primeiros Fundadores.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Card principal — Proposta dos Fundadores */}
          <div className="md:col-span-2 bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/60 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-200/30 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 shadow-md shadow-rose-600/20">
                <Users className="w-3 h-3" /> 50 vagas · Acesso antecipado
              </div>
              <p className="text-slate-700 text-lg md:text-xl font-semibold leading-relaxed mb-6 text-balance">
                Estamos liberando as primeiras <strong className="text-rose-600">50 licenças da versão 1.0</strong> a preço de custo. Garanta{' '}
                <strong className="text-emerald-600">R$ 97/mês vitalícios</strong> (sem reajustes) e ganhe uma linha direta de suporte VIP no WhatsApp direto com os criadores da plataforma.{' '}
                <span className="text-slate-500 font-medium">Sem robôs, apenas resolução de problemas reais.</span>
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all text-white font-black text-sm px-6 py-3 rounded-xl shadow-lg shadow-rose-600/25 group"
              >
                Garantir Minha Vaga de Fundador
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Stats cards */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 bg-emerald-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-emerald-600/20">
              <p className="text-emerald-200 text-xs md:text-sm font-bold uppercase tracking-widest">Economia média*</p>
              <div className="mt-4 md:mt-0">
                <p className="text-4xl md:text-5xl font-black tracking-tight">R$ 4.200</p>
                <p className="text-emerald-200 text-xs md:text-sm font-medium mt-1">por mês vs. apps</p>
              </div>
              <p className="text-emerald-300/70 text-[10px] mt-3 leading-relaxed">
                *Baseado na economia de taxas em um restaurante que fatura R$ 20.000/mês nos aplicativos.
              </p>
            </div>
            <div className="flex-1 bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between">
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest">Setup</p>
              <div className="mt-4 md:mt-0">
                <p className="text-4xl md:text-5xl font-black tracking-tight text-rose-400">5 min</p>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">para ir ao ar</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function ComparisonTable() {
  return (
    <section className="py-14 md:py-28 px-5 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <p className="text-rose-600 font-bold text-xs md:text-sm uppercase tracking-widest mb-3">A Verdade Sobre o Mercado</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight text-balance">
            Por que somos diferentes?
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 items-center">
          
          {/* Card 1: Sistemas Isca */}
          <div className="bg-stone-50 border border-slate-200 rounded-3xl p-6 md:p-8 opacity-90 flex flex-col h-full z-0 order-last lg:order-none">
            <div className="text-center mb-8">
              <X className="w-8 h-8 text-rose-300 mx-auto mb-3" />
              <h3 className="text-xl font-black tracking-tight text-slate-700 mb-2">Sistemas "Isca"</h3>
              <p className="text-slate-500 font-medium text-sm">Grátis com limites cruéis.</p>
            </div>
            
            <ul className="flex-1 flex flex-col">
              {[
                'Trava sua loja em 75 pedidos',
                'Sem tela de cozinha',
                'Suporte demora semanas',
                'Taxas ocultas'
              ].map((item, i, arr) => (
                <li key={i} className={`flex items-center gap-3 py-4 ${i !== arr.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <X className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-semibold text-slate-500 text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Saiu Delivery (Destaque Central) */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl shadow-emerald-900/20 lg:-translate-y-4 lg:scale-105 z-10 relative border border-slate-800 flex flex-col h-full order-first lg:order-none">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 whitespace-nowrap">
              🔥 ESCOLHA INTELIGENTE
            </div>
            <div className="text-center mb-8 mt-2">
              <Flame className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-2xl font-black tracking-tight text-white mb-2">Saiu Delivery</h3>
              <p className="text-slate-400 font-medium text-sm">A revolução do SaaS Independente.</p>
            </div>
            
            <ul className="flex-1 flex flex-col">
              {[
                'Mensalidade R$ 97 Fixa',
                'Pedidos 100% Ilimitados',
                'Painel de Cozinha (KDS) Incluso',
                'Suporte Humano WhatsApp',
                'Cancele com 1 Clique'
              ].map((item, i, arr) => (
                <li key={i} className={`flex items-center gap-3 py-4 ${i !== arr.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
             <Link
              href="/cadastro"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-black text-sm md:text-base px-6 py-4 rounded-xl shadow-lg shadow-emerald-500/25 group"
            >
              Criar Loja Agora
            </Link>
          </div>

          {/* Card 3: Sistemas Caros */}
          <div className="bg-stone-50 border border-slate-200 rounded-3xl p-6 md:p-8 opacity-90 flex flex-col h-full z-0 order-last lg:order-none">
            <div className="text-center mb-8">
              <Minus className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-black tracking-tight text-slate-700 mb-2">Sistemas Caros</h3>
              <p className="text-slate-500 font-medium text-sm">Plataformas antigas e caras.</p>
            </div>
            
            <ul className="flex-1 flex flex-col">
              {[
                'R$ 300 a R$ 500/mês',
                'KDS cobrado à parte',
                'Robôs que não resolvem',
                'Retenção abusiva'
              ].map((item, i, arr) => (
                <li key={i} className={`flex items-center gap-3 py-4 ${i !== arr.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <Minus className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-500 text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}

function GuaranteeSection() {
  return (
    <section className="py-14 md:py-24 px-5 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-rose-400 font-bold text-xs md:text-sm uppercase tracking-widest mb-3">Garantia Anti-Armadilha</p>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight text-balance">
            Você no controle. Sempre.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          <div className="bg-slate-800/50 border border-emerald-500/20 rounded-3xl p-8 hover:bg-slate-800 transition-colors relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5 md:mb-6">
                <RefreshCcw className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
                Garantia Incondicional
              </div>
              <h3 className="text-lg md:text-xl font-black text-white mb-3">7 Dias ou Seu Dinheiro de Volta</h3>
              <p className="text-slate-400 font-medium leading-relaxed text-sm md:text-base">
                Assine agora e teste o sistema. Se não for o melhor painel que você já usou, devolvemos <strong className="text-white">100% do seu dinheiro com 1 clique.</strong> Sem perguntas, sem burocracia.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-5 md:mb-6">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mb-3">Suporte de Verdade</h3>
            <p className="text-slate-400 font-medium leading-relaxed text-sm md:text-base">
              Seu restaurante não pode parar. Suporte rápido e humano pelo WhatsApp, falando direto com os especialistas que resolvem.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-colors">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5 md:mb-6">
              <HandCoins className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-white mb-3">Seu Dinheiro é Seu</h3>
            <p className="text-slate-400 font-medium leading-relaxed text-sm md:text-base">
              O Pix cai na sua conta bancária na hora. Zero taxas de liquidação, zero antecipação forçada, zero letrinhas ocultas sobre sua venda.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const faqs = [
    { q: 'Preciso ter CNPJ para assinar?', a: 'Não, aceitamos CPF. Você pode começar a vender hoje mesmo usando seu CPF e conta bancária pessoal para receber os pagamentos via Pix.' },
    { q: 'Vocês cobram alguma taxa sobre a venda?', a: 'Zero. O valor integral dos pedidos pagos via Pix cai diretamente na sua conta. Você paga apenas a nossa assinatura mensal fixa.' },
    { q: 'É difícil de configurar?', a: 'Setup em 5 minutos. Nosso painel é super intuitivo. Basta cadastrar seus produtos no nosso cardápio fácil e você já terá seu link próprio para vender.' },
    { q: 'O cliente precisa baixar aplicativo?', a: 'Não, ele pede direto pelo navegador acessando o seu link próprio (ex: sua-loja.saiudelivery.com.br). Sem barreiras corporativas, garantindo conversão máxima para o seu negócio.' },
  ]

  return (
    <section className="py-14 md:py-24 px-5 bg-stone-50/50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-rose-600 font-bold text-xs md:text-sm uppercase tracking-widest mb-3">Dúvidas Frequentes</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight text-balance">
            Tudo limpo e transparente.
          </h2>
        </div>
        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer p-5 md:p-6 font-bold text-slate-900 text-sm md:text-lg hover:text-rose-600 transition-colors gap-4">
                {faq.q}
                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-open:bg-rose-50 transition-colors">
                  <ChevronDown className="w-5 h-5 text-slate-400 group-open:text-rose-500 group-open:-rotate-180 transition-transform" />
                </div>
              </summary>
              <div className="px-5 md:px-6 pb-5 md:pb-6 text-slate-500 font-medium leading-relaxed text-sm md:text-base">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingTeaser() {
  const features = [
    'Site de pedidos com domínio próprio',
    'Pix direto na sua conta — zero intermediários',
    'Sistema KDS para cozinha em tempo real',
    'Painel admin completo com métricas',
    'Suporte via WhatsApp',
    'Sem contrato de fidelidade',
  ]

  return (
    <section id="pricing" className="py-14 md:py-24 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-2">

            {/* Left — Value prop */}
            <div className="p-6 md:p-14 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
              <p className="text-rose-600 font-bold text-xs md:text-sm uppercase tracking-widest mb-4">Plano único</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">R$ 97</span>
                <span className="text-slate-400 font-semibold pb-1 md:pb-2 text-sm md:text-base">/mês</span>
              </div>
              <p className="text-slate-400 font-medium mb-8 text-sm md:text-base">
                Enquanto você paga <span className="line-through text-rose-400 font-bold">R$ 4.200+</span> em taxas por mês nos apps.
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 w-full justify-center bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all text-white font-black text-base px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/30 group"
              >
                Começar agora
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-center text-slate-400 text-[10px] md:text-xs font-medium mt-3">
                Garantia incondicional de 7 dias · Cancele quando quiser · Sem multa.
              </p>
            </div>

            {/* Right — Feature list */}
            <div className="p-6 md:p-14">
              <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest mb-6">O que está incluído</p>
              <ul className="space-y-4">
                {features.map(feature => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-600" />
                    </div>
                    <span className="text-slate-700 font-medium text-sm md:text-base leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

function CTAFooter() {
  return (
    <section id="cta" className="py-16 md:py-28 px-5 bg-rose-600 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-black/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-white/15 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 md:mb-8">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Sem risco. Sem fidelidade.
        </div>
        <h2 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tight text-balance mb-4 md:mb-6 w-full">
          Chega de dividir seu lucro com os apps.
        </h2>
        <p className="text-rose-100 text-base md:text-xl font-medium mb-10 md:mb-12 text-balance max-w-xl mx-auto">
          Junte-se aos restaurantes que já decidiram que <strong className="text-white">o dinheiro deles é deles.</strong>
        </p>
        <Link
          href="/cadastro"
          className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-rose-50 active:scale-[0.98] transition-all text-rose-600 font-black text-base md:text-lg px-8 md:px-12 py-4 md:py-5 rounded-2xl shadow-2xl shadow-black/20 group"
        >
          Criar Minha Loja Agora
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="text-rose-200/80 text-[11px] md:text-sm font-medium mt-5 text-balance">
          Setup em 5 minutos · R$ 97/mês · Cancele quando quiser
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 md:py-12 px-5 pb-24 md:pb-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center">
            <Flame className="w-4 h-4 text-white fill-white" strokeWidth={1.5} />
          </div>
          <span className="text-white font-black text-base tracking-tight">
            Saiu<span className="text-rose-500">Delivery</span>
          </span>
        </div>

        <p className="text-xs md:text-sm text-center text-slate-500">
          © {new Date().getFullYear()} Saiu Delivery · SaaS Multi-Tenant Independente
        </p>

        <div className="flex items-center flex-wrap justify-center gap-4 md:gap-5 text-xs md:text-sm font-medium">
          <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
          <a href="#" className="hover:text-white transition-colors">Contato</a>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <div className="bg-stone-50 min-h-screen text-slate-900 antialiased overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <BentoGrid />
        <InlineCTA />
        <SetupSteps />
        <FoundersProgram />
        <ComparisonTable />
        <GuaranteeSection />
        <FAQ />
        <PricingTeaser />
        <InlineCTA />
        <CTAFooter />
      </main>
      <Footer />
    </div>
  )
}
