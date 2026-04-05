'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  LayoutDashboard,
  Store,
  Magnet,
  DollarSign,
  LogOut,
  Flame,
} from 'lucide-react'
import { logoutQGAdmin } from '@/app/actions/qg-auth'

const NAV = [
  { href: '/qg-admin',           label: 'Dashboard',    icon: LayoutDashboard, exact: true  },
  { href: '/qg-admin/lojas',     label: 'Lojas & CRM',  icon: Store,           exact: false },
  { href: '/qg-admin/leads',     label: 'Leads',        icon: Magnet,          exact: false },
  { href: '/qg-admin/financeiro',label: 'Financeiro',   icon: DollarSign,      exact: false },
]

export default function QGSidebar() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-60 shrink-0 bg-slate-950 border-r border-slate-800/50 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-slate-800/50">
        <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center shadow-md shadow-rose-600/20">
          <Flame className="w-4 h-4 text-white fill-white" strokeWidth={1.5} />
        </div>
        <div className="leading-tight">
          <p className="text-white font-black text-sm tracking-tight">Quartel</p>
          <p className="text-rose-500 font-black text-sm tracking-tight -mt-0.5">General</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">Operações</p>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-rose-600/15 text-rose-400 border border-rose-600/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-rose-400' : 'text-slate-600'}`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 bg-rose-500 rounded-full" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800/50">
        <button
          onClick={() => startTransition(() => logoutQGAdmin())}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 transition-all border border-transparent disabled:opacity-40"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isPending ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </aside>
  )
}
