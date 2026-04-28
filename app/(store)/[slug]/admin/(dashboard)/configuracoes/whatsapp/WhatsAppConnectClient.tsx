'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  generateWhatsAppQRCode,
  getWhatsAppQrCode,
  checkWhatsAppConnection,
  disconnectWhatsApp,
} from '@/app/actions/whatsapp'
import { Loader2, Wifi, WifiOff, RefreshCw, ShieldCheck } from 'lucide-react'

type Status = 'idle' | 'loading' | 'pending' | 'qr' | 'connected' | 'disconnecting'

const POLL_INTERVAL_MS = 3_000

export default function WhatsAppConnectClient({
  storeId,
  slug,
  initialConnected,
  initialInstance,
}: {
  storeId: string
  slug: string
  initialConnected: boolean
  initialInstance: string | null
}) {
  const [status, setStatus] = useState<Status>(initialConnected ? 'connected' : 'idle')
  const [qrBase64, setQrBase64] = useState('')
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Polling em 'qr': verifica se a conexão foi estabelecida
  const startConnectionPolling = useCallback(() => {
    stopPolling()
    intervalRef.current = setInterval(async () => {
      const { connected } = await checkWhatsAppConnection(storeId)
      if (connected) {
        stopPolling()
        setStatus('connected')
      }
    }, POLL_INTERVAL_MS)
  }, [storeId, stopPolling])

  // Polling em 'pending': aguarda o webhook QRCODE_UPDATED salvar o QR no banco
  const startQrPolling = useCallback(() => {
    stopPolling()
    intervalRef.current = setInterval(async () => {
      const { qrCodeBase64 } = await getWhatsAppQrCode(storeId)
      if (qrCodeBase64) {
        stopPolling()
        setQrBase64(qrCodeBase64)
        setStatus('qr')
      }
    }, POLL_INTERVAL_MS)
  }, [storeId, stopPolling])

  useEffect(() => {
    if (status === 'qr') startConnectionPolling()
    else if (status === 'pending') startQrPolling()
    return stopPolling
  }, [status, startConnectionPolling, startQrPolling, stopPolling])

  async function handleGenerate() {
    setStatus('loading')
    setError('')

    const result = await generateWhatsAppQRCode(storeId, slug)

    if (!result.success) {
      setError(result.error)
      setStatus('idle')
      return
    }

    if (result.qrCodeBase64) {
      setQrBase64(result.qrCodeBase64)
      setStatus('qr')
    } else {
      // QR chegará via webhook QRCODE_UPDATED — entrar em modo polling
      setStatus('pending')
    }
  }

  async function handleDisconnect() {
    setStatus('disconnecting')
    setError('')
    stopPolling()

    const result = await disconnectWhatsApp(storeId, slug)

    if (!result.success) {
      setError(result.error)
      setStatus('connected')
      return
    }

    setQrBase64('')
    setStatus('idle')
  }

  // ── Estado: conectado ──────────────────────────────────────────────────────
  if (status === 'connected' || status === 'disconnecting') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-black text-emerald-800 tracking-tight">WhatsApp Conectado</p>
            <p className="text-sm font-medium text-emerald-700 mt-0.5">
              {initialInstance ?? `loja-${slug}`} — conexão ativa e pronta para uso.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold text-rose-500">{error}</p>
        )}

        <button
          onClick={handleDisconnect}
          disabled={status === 'disconnecting'}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-50 transition-colors"
        >
          {status === 'disconnecting'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Desconectando...</>
            : <><WifiOff className="w-4 h-4" /> Desconectar WhatsApp</>
          }
        </button>
      </div>
    )
  }

  // ── Estado: aguardando QR via webhook ─────────────────────────────────────
  if (status === 'pending') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-6">
          <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700">Gerando QR Code...</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Aguardando a Evolution API gerar o código. Isso leva alguns segundos.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
      </div>
    )
  }

  // ── Estado: QR Code exibido ───────────────────────────────────────────────
  if (status === 'qr') {
    const imgSrc = qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`

    return (
      <div className="space-y-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm inline-flex">
            <Image
              src={imgSrc}
              width={256}
              height={256}
              priority
              unoptimized
              alt="QR Code para conectar o WhatsApp"
              className="rounded-lg"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Como conectar</p>
              <ol className="space-y-2 text-sm font-medium text-slate-600 list-none">
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                  Abra o WhatsApp no celular da sua loja.
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                  Acesse <strong>Configuracoes &rsaquo; Aparelhos Conectados</strong>.
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                  Toque em <strong>Conectar aparelho</strong> e aponte a camera para este codigo.
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              Aguardando leitura do codigo...
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm font-bold text-rose-500">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Gerar novo codigo
        </button>
      </div>
    )
  }

  // ── Estado: idle ou loading ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center">
            <WifiOff className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700">Nenhum numero conectado</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Conecte o WhatsApp da loja para notificar clientes automaticamente.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-200"
      >
        {status === 'loading'
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Conectando ao servidor...</>
          : <><ShieldCheck className="w-4 h-4" /> Gerar QR Code de Conexao</>
        }
      </button>
    </div>
  )
}
