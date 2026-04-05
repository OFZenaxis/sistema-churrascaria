import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata = { robots: 'noindex, nofollow' }

export default async function QGAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string }>
}) {
  const { pin } = await searchParams
  const superAdminPin = process.env.SUPER_ADMIN_PIN

  if (!superAdminPin || pin !== superAdminPin) {
    notFound()
  }

  const leads = await prisma.partialLead.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, createdAt: true },
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <div className="max-w-6xl mx-auto px-5 py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/30">
            <span className="text-white font-black text-lg">Q</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Quartel General</h1>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Painel Super Admin · Acesso Restrito</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Leads Capturados</p>
            <p className="text-4xl font-black text-white">{leads.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Lojas Ativas</p>
            <p className="text-4xl font-black text-emerald-400">{stores.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 col-span-2 md:col-span-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Conversão</p>
            <p className="text-4xl font-black text-rose-400">
              {leads.length > 0 ? `${Math.round((stores.length / leads.length) * 100)}%` : '—'}
            </p>
          </div>
        </div>

        {/* Leads table */}
        <section className="mb-16">
          <h2 className="text-lg font-black text-white tracking-tight mb-4">
            Leads Incompletos
            <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-widest">({leads.length})</span>
          </h2>

          {leads.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 font-medium">
              Nenhum lead capturado ainda.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">WhatsApp</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors ${i === leads.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-200">{lead.name ?? <span className="text-slate-600">—</span>}</td>
                      <td className="px-5 py-3.5 text-slate-300 font-medium">{lead.email ?? <span className="text-slate-600">—</span>}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-medium hidden md:table-cell">{lead.phone ?? <span className="text-slate-600">—</span>}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-medium hidden sm:table-cell">
                        {lead.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Stores table */}
        <section>
          <h2 className="text-lg font-black text-white tracking-tight mb-4">
            Lojas Cadastradas
            <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-widest">({stores.length})</span>
          </h2>

          {stores.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 font-medium">
              Nenhuma loja cadastrada.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slug</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store, i) => (
                    <tr
                      key={store.id}
                      className={`border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors ${i === stores.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-200">{store.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-emerald-400 font-mono text-xs bg-emerald-500/10 px-2 py-1 rounded-lg">
                          {store.slug}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs font-medium hidden sm:table-cell">
                        {store.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-12 text-center text-slate-700 text-xs font-medium">
          QG · Saiu Delivery · Acesso via PIN
        </p>
      </div>
    </div>
  )
}
