"use client"

import React, { createContext, useContext, useState } from 'react'

type SidebarContextType = {
  isCollapsed: boolean
  setIsCollapsed: (v: boolean) => void
  isKitchenMode: boolean
  setIsKitchenMode: (v: boolean) => void
  // PIN lido do banco no servidor — imutável em runtime, isolado por tenant
  kitchenPin: string | null
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function SidebarProvider({
  kitchenPin,
  children,
}: {
  kitchenPin: string | null
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isKitchenMode, setIsKitchenMode] = useState(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isKitchenMode, setIsKitchenMode, kitchenPin }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
