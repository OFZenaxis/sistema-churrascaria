import Link from 'next/link'
import { Flame, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade · Saiu Delivery',
  robots: 'noindex, nofollow',
}

export default function PrivacidadePage() {
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
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Política de Privacidade</h1>
        <p className="text-slate-400 text-sm font-medium mb-12">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-10">

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">1. Dados que Coletamos</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base mb-4">
              Coletamos apenas os dados estritamente necessários para a operação da plataforma:
            </p>
            <ul className="space-y-2">
              {[
                'Lojistas: nome, e-mail, telefone, CNPJ/CPF (para cadastro e faturamento)',
                'Clientes finais: nome, telefone e endereço (para entrega de pedidos)',
                'Dados de uso: logs de acesso para diagnóstico técnico e segurança',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-slate-500 text-sm md:text-base font-medium">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">2. Como Usamos Seus Dados</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              Os dados coletados são utilizados exclusivamente para: operar a plataforma, processar pedidos, enviar notificações relacionadas ao serviço e garantir a segurança da conta. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">3. Armazenamento e Segurança</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              Os dados são armazenados em servidores seguros (Supabase/PostgreSQL) com criptografia em trânsito (HTTPS/TLS) e em repouso. Utilizamos autenticação HMAC para sessões e nunca armazenamos senhas em texto plano.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">4. Cookies</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              Utilizamos cookies de sessão estritamente necessários para manter o usuário autenticado. Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">5. Seus Direitos (LGPD)</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base mb-4">
              Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
            </p>
            <ul className="space-y-2">
              {[
                'Acessar os dados pessoais que temos sobre você',
                'Solicitar a correção de dados incorretos',
                'Solicitar a exclusão dos seus dados ao cancelar a conta',
                'Revogar o consentimento a qualquer momento',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-slate-500 text-sm md:text-base font-medium">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3">6. Contato</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato pelo WhatsApp ou e-mail disponível em nosso site.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-200">
          <Link href="/termos" className="text-rose-600 font-bold text-sm hover:text-rose-700 transition-colors">
            Ver também: Termos de Uso →
          </Link>
        </div>
      </main>
    </div>
  )
}
