import { prisma } from '@/lib/prisma'
import { Magnet } from 'lucide-react'

export default async function QGLeadsPage() {
  const leads = await prisma.partialLead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Captação</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Leads</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Cadastros iniciados que não foram concluídos.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
          <Magnet className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-black text-sm">{leads.length} capturados</span>
        </div>
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-16 text-center">
          <Magnet className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">Nenhum lead capturado ainda.</p>
          <p className="text-slate-700 text-sm font-medium mt-1">Os leads aparecerão aqui quando alguém iniciar o cadastro.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">WhatsApp</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Capturado em</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors last:border-b-0 group"
                >
                  <td className="px-6 py-4 text-slate-600 text-xs font-mono">{String(i + 1).padStart(3, '0')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-blue-400 text-[10px] font-black">
                          {(lead.name?.[0] ?? '?').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-slate-200 font-semibold">{lead.name ?? <span className="text-slate-600 font-normal">—</span>}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">{lead.email ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium hidden md:table-cell">{lead.phone ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-600 text-xs font-medium">
                      {lead.createdAt.toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
