"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Bike,
  Settings,
  CreditCard,
  LogOut,
  Store,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Copy,
  Check,
} from 'lucide-react'
import { logoutLojista } from '@/app/actions/adminAuth'
import { useSidebar } from './SidebarContext'

export default function AdminSidebar({
  slug,
  storeId,
  storeName,
  logoUrl,
}: {
  slug: string
  storeId: string
  storeName: string
  logoUrl: string | null
}) {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isActive = (href: string) => {
    // Exact-match routes (children would otherwise falsely activate the parent)
    if (href === '/admin') return pathname === '/admin'
    if (href === '/admin/configuracoes') return pathname === '/admin/configuracoes'
    return pathname.startsWith(href)
  }

  const navItems = [
    { href: '/admin',          label: 'Visão Geral',   icon: LayoutDashboard },
    { href: '/admin/cardapio', label: 'Cardápio',      icon: UtensilsCrossed },
    { href: '/admin/kds',      label: 'KDS / Cozinha', icon: ChefHat },
    { href: '/admin/entregas', label: 'Entregas',      icon: Bike },
  ]

  const bottomItems = [
    { href: '/admin/personalizacao',           label: 'Personalização', icon: Palette },
    { href: '/admin/configuracoes/pagamentos', label: 'Pagamentos',     icon: CreditCard },
    { href: '/admin/configuracoes',            label: 'Configurações',  icon: Settings },
  ]

  const handleLogout = async () => {
    await logoutLojista(storeId)
    const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'saiudelivery.com.br'
    window.location.href = `https://${slug}.${BASE_DOMAIN}/admin/login`
  }

  return (
    <aside
      className={`
        h-full bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0
        transition-[width] duration-300 overflow-hidden
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* ── Branding ─────────────────────────────────────────────── */}
      <div className={`border-b border-slate-100 shrink-0 ${isCollapsed ? 'px-3 py-4' : 'px-5 py-5'}`}>
        {isCollapsed ? (
          /* Ícone compacto da loja */
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          /* Branding completo */
          <>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={storeName}
                className="object-contain h-11 w-auto max-w-full"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-slate-900 text-sm leading-tight truncate">{storeName}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-2">Painel Admin</p>
          </>
        )}
      </div>

      {/* ── Navegação principal ─────────────────────────────────── */}
      <nav className={`flex-1 py-6 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={`
                flex items-center rounded-xl transition-all relative overflow-hidden group
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${active
                  ? 'bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100/50 border border-emerald-100/50'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'}
              `}
            >
              {active && (
                <div className={`absolute inset-y-0 w-1.5 bg-emerald-500 rounded-r ${isCollapsed ? 'left-0' : 'left-0'}`} />
              )}
              <Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {!isCollapsed && (
                <span className="text-sm font-bold truncate">{label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Rodapé ───────────────────────────────────────────────── */}
      <div className={`border-t border-slate-200/60 py-4 space-y-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>

        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={`
                flex items-center rounded-xl transition-all relative overflow-hidden group
                ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                ${active
                  ? 'bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100/50 border border-emerald-100/50'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent'}
              `}
            >
              {active && <div className="absolute left-0 inset-y-0 w-1.5 bg-emerald-500 rounded-r" />}
              <Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {!isCollapsed && <span className="text-sm font-bold truncate">{label}</span>}
            </Link>
          )
        })}

        {/* Copiar link da loja */}
        <button
          onClick={handleCopyLink}
          title={isCollapsed ? 'Copiar link da loja' : undefined}
          className={`w-full flex items-center rounded-xl transition-colors group ${
            copied
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          } ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}`}
        >
          {copied
            ? <Check className={`shrink-0 text-emerald-500 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
            : <Copy className={`shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
          }
          {!isCollapsed && (
            <span className="text-sm font-bold truncate">
              {copied ? 'Link copiado!' : 'Copiar link da loja'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sair do Sistema' : undefined}
          className={`w-full flex items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-colors group mt-1 ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <LogOut className={`shrink-0 group-hover:text-rose-500 transition-colors ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {!isCollapsed && <span className="text-sm font-bold">Sair do Sistema</span>}
        </button>

        {/* Toggle colapso */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`w-full flex items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors mt-1 ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
          }`}
        >
          {isCollapsed
            ? <PanelLeftOpen className="w-5 h-5 shrink-0" />
            : <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">Recolher</span>
              </>}
        </button>

      </div>
    </aside>
  )
}
