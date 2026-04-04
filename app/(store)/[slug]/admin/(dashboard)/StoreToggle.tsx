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
    <div className={`inline-flex items-center gap-4 bg-white border rounded-2xl p-2.5 pr-5 shadow-sm transition-colors ${
      open ? 'border-emerald-100 shadow-emerald-500/5' : 'border-slate-200 shadow-slate-500/5'
    }`}>
      <button
        onClick={handle}
        disabled={loading}
        title={open ? 'Pausar Loja' : 'Abrir Loja'}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 ${
          open ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span className="sr-only">Toggle store status</span>
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex flex-col items-center justify-center ${
            open ? 'translate-x-7' : 'translate-x-1'
          }`}
        >
          {loading ? (
             <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          ) : (
            <Power className={`w-3 h-3 ${open ? 'text-emerald-500' : 'text-slate-400'}`} strokeWidth={3} />
          )}
        </span>
      </button>

      <div className="flex flex-col text-left">
        <span className={`text-sm font-black tracking-tight leading-none mb-1 ${open ? 'text-emerald-700' : 'text-slate-700'}`}>
          {open ? 'Loja Aberta' : 'Loja Fechada'}
        </span>
        <span className={`text-[10px] uppercase tracking-widest font-bold leading-none ${open ? 'text-emerald-500/80' : 'text-slate-400'}`}>
          {open ? 'Recebendo pedidos' : 'Pausada'}
        </span>
      </div>
    </div>
  )
}
