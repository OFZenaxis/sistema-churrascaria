"use client"

import { useState } from 'react'
import { Loader2, Power } from 'lucide-react'
import { toggleStoreStatus } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'

export default function StoreToggle({
  storeId,
  initialOpen,
}: {
  storeId: string
  initialOpen: boolean
}) {
  const [open, setOpen] = useState(initialOpen)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handle = async () => {
    setLoading(true)
    const res = await toggleStoreStatus(open, storeId)
    setLoading(false)
    if (res.success) {
      setOpen(res.isOpen!)
      router.refresh()
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      title={open ? 'Pausar loja' : 'Abrir loja'}
      className={`
        inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 border transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        ${open
          ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-500/10'
          : 'bg-slate-50 border-slate-200'}
      `}
    >
      {/* Track */}
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          open ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        {/* Thumb */}
        <span
          className={`absolute flex items-center justify-center h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            open ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
            : <Power className={`w-3 h-3 ${open ? 'text-emerald-500' : 'text-slate-400'}`} strokeWidth={3} />
          }
        </span>
      </span>

      {/* Label */}
      <span className="flex flex-col text-left leading-none gap-0.5">
        <span className={`text-sm font-black tracking-tight ${open ? 'text-emerald-700' : 'text-slate-600'}`}>
          {open ? 'Loja Aberta' : 'Loja Fechada'}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${open ? 'text-emerald-500' : 'text-slate-400'}`}>
          {open ? 'Recebendo pedidos' : 'Pausada'}
        </span>
      </span>
    </button>
  )
}
