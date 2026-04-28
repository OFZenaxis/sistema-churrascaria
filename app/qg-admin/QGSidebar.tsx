'use client'

import Link from 'next/link'
import Image from 'next/image'
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
      <div className="px-5 h-16 flex items-center border-b border-slate-800/50">
        <Image src="/logo-full.png" alt="Saiu Delivery" width={200} height={56} className="h-8 w-auto filter brightness-0 invert" priority />
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
