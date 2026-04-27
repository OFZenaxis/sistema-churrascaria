import { prisma } from '@/lib/prisma'
import { Store, Eye, PowerOff } from 'lucide-react'

export default async function QGLojasPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      users: {
        where: { role: 'ADMIN' },
        select: { name: true, email: true },
        take: 1,
      },
    },
  })

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'saiudelivery.com.br'

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">CRM</p>
          <h1 className="text-3xl font-black text-white tracking-tight">Lojas</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Todos os tenants ativos na plataforma.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
          <Store className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-black text-sm">{stores.length} lojas</span>
        </div>
      </div>

      {/* Table */}
      {stores.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-16 text-center">
          <Store className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">Nenhuma loja cadastrada.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loja</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Dono</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Cadastro</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, i) => {
                const owner = store.users[0]
                const storeUrl = `https://${store.slug}.${baseDomain}/admin`
                return (
                  <tr
                    key={store.id}
                    className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors last:border-b-0"
                  >
                    <td className="px-6 py-4 text-slate-600 text-xs font-mono">{String(i + 1).padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <span className="text-emerald-400 text-xs font-black">{store.name[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-slate-200 font-semibold">{store.name}</p>
                          <p className="text-slate-600 text-xs font-mono">{store.slug}.{baseDomain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {owner ? (
                        <div>
                          <p className="text-slate-300 font-medium text-xs">{owner.name}</p>
                          <p className="text-slate-600 text-xs">{owner.email ?? '—'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-600 text-xs font-medium">
                        {store.createdAt.toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* God Mode — acessa o painel do tenant */}
                        <a
                          href={storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="God Mode — Acessar painel desta loja"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">God Mode</span>
                        </a>

                        {/* Kill Switch — apenas UI por enquanto */}
                        <button
                          type="button"
                          title="Kill Switch — Suspender loja"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all text-xs font-bold"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kill Switch</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
