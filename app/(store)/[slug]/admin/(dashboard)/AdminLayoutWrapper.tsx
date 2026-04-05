"use client"

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { SidebarProvider, useSidebar } from './SidebarContext'
import AdminSidebar from './AdminSidebar'

function LayoutInner({
  slug,
  storeId,
  storeName,
  logoUrl,
  children,
}: {
  slug: string
  storeId: string
  storeName: string
  logoUrl: string | null
  children: React.ReactNode
}) {
  const { isKitchenMode } = useSidebar()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Mobile Header ───────────────────────────────────────── */}
      {!isKitchenMode && (
        <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="Saiu Delivery" className="h-8 w-auto object-contain" />
          <button
            onClick={() => setIsMobileOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
      )}

      {/* ── Mobile Backdrop ─────────────────────────────────────── */}
      {!isKitchenMode && isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar — inline on desktop, drawer overlay on mobile ── */}
      {!isKitchenMode && (
        <div
          className={`
            fixed inset-y-0 left-0 z-50
            md:relative md:inset-auto md:z-auto md:flex
            transition-transform duration-300 ease-in-out
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <AdminSidebar
            slug={slug}
            storeId={storeId}
            storeName={storeName}
            logoUrl={logoUrl}
            onClose={() => setIsMobileOpen(false)}
          />
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto min-w-0 ${!isKitchenMode ? 'pt-14 md:pt-0' : ''}`}>
        {children}
      </div>

    </div>
  )
}

export function AdminLayoutWrapper({
  slug,
  storeId,
  storeName,
  logoUrl,
  kitchenPin,
  children,
}: {
  slug: string
  storeId: string
  storeName: string
  logoUrl: string | null
  kitchenPin: string | null
  children: React.ReactNode
}) {
  return (
    <SidebarProvider kitchenPin={kitchenPin}>
      <LayoutInner slug={slug} storeId={storeId} storeName={storeName} logoUrl={logoUrl}>
        {children}
      </LayoutInner>
    </SidebarProvider>
  )
}
