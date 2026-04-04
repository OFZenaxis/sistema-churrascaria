"use client"

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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar desmontada no Kitchen Mode — sem risco de navegação */}
      {!isKitchenMode && (
        <AdminSidebar slug={slug} storeId={storeId} storeName={storeName} logoUrl={logoUrl} />
      )}
      <div className="flex-1 overflow-y-auto min-w-0">
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
