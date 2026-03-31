"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Loader2, MapPin, CheckCircle2, Search, ChevronRight } from 'lucide-react'
import { loginWithPhone, saveAddress } from '../app/actions/auth'

type Step = 'phone' | 'address' | 'done'

type ViaCepResponse = {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

type PhoneLoginProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const LABEL_OPTIONS = ['Casa', 'Trabalho', 'Outro']

export default function PhoneLogin({ isOpen, onClose, onSuccess }: PhoneLoginProps) {
  const [step, setStep] = useState<Step>('phone')

  // Etapa 1
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Etapa 2
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [label, setLabel] = useState('Casa')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  const [cepFound, setCepFound] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState('')

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('phone')
        setPhone(''); setName(''); setLoginError('')
        setCep(''); setRua(''); setBairro(''); setCidade('')
        setEstado(''); setNumero(''); setComplemento('')
        setLabel('Casa'); setCepError(''); setCepFound(false); setAddressError('')
      }, 400)
    }
  }, [isOpen])

  // Busca ViaCEP automática ao digitar 8 dígitos
  useEffect(() => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) {
      if (digits.length < 8) {
        setCepFound(false)
        setRua(''); setBairro(''); setCidade(''); setEstado('')
      }
      return
    }
    setCepLoading(true)
    setCepError('')

    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then(res => res.json())
      .then((data: ViaCepResponse) => {
        if (data.erro) {
          setCepError('CEP não encontrado. Verifique e tente novamente.')
          setCepFound(false)
        } else {
          setRua(data.logradouro || '')
          setBairro(data.bairro || '')
          setCidade(data.localidade || '')
          setEstado(data.uf || '')
          setCepFound(true)
          setCepError('')
        }
      })
      .catch(() => {
        setCepError('Erro ao consultar o CEP. Verifique sua conexão.')
        setCepFound(false)
      })
      .finally(() => setCepLoading(false))
  }, [cep])

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
    return digits
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const res = await loginWithPhone(phone, name)
    setLoginLoading(false)
    if (res.success) {
      setStep('address')
    } else {
      setLoginError(res.error || 'Erro ao fazer login.')
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cepFound) { setAddressError('Busque um CEP válido antes de continuar.'); return }
    setAddressLoading(true)
    setAddressError('')
    const res = await saveAddress({ label, cep, rua, numero, complemento, bairro, cidade, estado })
    setAddressLoading(false)
    if (res.success) {
      setStep('done')
      setTimeout(() => onSuccess(), 900)
    } else {
      setAddressError(res.error || 'Erro ao salvar endereço.')
    }
  }

  // ── Estilos base ──
  const inputCls = "input-dark"
  const readonlyCls = "input-dark opacity-40 cursor-not-allowed"
  const labelCls = "block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5"

  const progressWidth = step === 'phone' ? '33%' : step === 'address' ? '66%' : '100%'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#0d0d0d] w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-[#1f1f1f] shadow-2xl overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            {/* Progress bar */}
            <div className="h-1 bg-[#1a1a1a] w-full">
              <motion.div
                className="h-full bg-[#E31C1C]"
                animate={{ width: progressWidth }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            {/* Handle mobile */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden">
              <div className="w-10 h-1 bg-[#2a2a2a] rounded-full" />
            </div>

            <div className="px-6 pb-8 pt-4">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] text-zinc-500 hover:text-white transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <AnimatePresence mode="wait">

                {/* ── ETAPA 1: TELEFONE ── */}
                {step === 'phone' && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-7">
                      <div className="w-14 h-14 rounded-full bg-[#E31C1C]/10 border border-[#E31C1C]/20 flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-7 h-7 text-[#E31C1C]" />
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Identificação</h2>
                      <p className="text-zinc-600 text-sm mt-1">Informe seu WhatsApp para entregarmos.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className={labelCls}>Telefone / WhatsApp</label>
                        <input
                          type="tel"
                          inputMode="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="(61) 99999-9999"
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Seu nome</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Como te chamamos?"
                          className={inputCls}
                        />
                      </div>

                      {loginError && (
                        <p className="text-red-400 text-sm font-bold text-center bg-red-950/30 border border-red-900/30 rounded-xl p-3">{loginError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="btn-brasa w-full mt-2"
                      >
                        {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>CONTINUAR <ChevronRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── ETAPA 2: ENDEREÇO ── */}
                {step === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-full bg-[#E31C1C]/10 border border-[#E31C1C]/20 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-7 h-7 text-[#E31C1C]" />
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Endereço</h2>
                      <p className="text-zinc-600 text-sm mt-1">Salve para entregas futuras.</p>
                    </div>

                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-h-[52vh] overflow-y-auto pr-0.5">

                      {/* Label */}
                      <div>
                        <label className={labelCls}>Tipo</label>
                        <div className="flex gap-2">
                          {LABEL_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setLabel(opt)}
                              className={`flex-1 py-3 rounded-xl border-2 text-xs font-black uppercase transition-all ${
                                label === opt
                                  ? 'border-[#E31C1C] bg-[#E31C1C]/10 text-[#E31C1C]'
                                  : 'border-[#1f1f1f] bg-[#111] text-zinc-600 hover:border-[#2a2a2a]'
                              }`}
                            >
                              {opt === 'Casa' ? '🏠 ' : opt === 'Trabalho' ? '💼 ' : '📍 '}{opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CEP */}
                      <div>
                        <label className={labelCls}>CEP</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={cep}
                            onChange={e => setCep(formatCep(e.target.value))}
                            placeholder="00000-000"
                            maxLength={9}
                            className={`${inputCls} pr-12 font-mono`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {cepLoading && <Loader2 className="w-5 h-5 text-[#E31C1C] animate-spin" />}
                            {cepFound && !cepLoading && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {!cepFound && !cepLoading && cep.length > 0 && <Search className="w-4 h-4 text-zinc-700" />}
                          </div>
                        </div>
                        {cepError && <p className="text-red-400 text-xs mt-1.5 font-bold">{cepError}</p>}
                        {cepFound && <p className="text-emerald-500 text-xs mt-1.5 font-bold">✓ CEP encontrado — campos preenchidos automaticamente</p>}
                      </div>

                      {/* Rua */}
                      <div>
                        <label className={labelCls}>Rua / Logradouro</label>
                        <input
                          type="text"
                          value={rua}
                          onChange={e => setRua(e.target.value)}
                          placeholder="Aguardando CEP..."
                          className={cepFound ? inputCls : readonlyCls}
                          readOnly={!cepFound}
                        />
                      </div>

                      {/* Número + Bairro */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Número <span className="text-[#E31C1C]">*</span></label>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={numero}
                            onChange={e => setNumero(e.target.value)}
                            placeholder="Ex: 42"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Bairro</label>
                          <input
                            type="text"
                            value={bairro}
                            onChange={e => setBairro(e.target.value)}
                            placeholder="—"
                            className={cepFound ? inputCls : readonlyCls}
                            readOnly={!cepFound}
                          />
                        </div>
                      </div>

                      {/* Complemento OBRIGATÓRIO */}
                      <div>
                        <label className={labelCls}>
                          Complemento <span className="text-[#E31C1C]">*</span>
                          <span className="text-zinc-700 normal-case font-normal ml-1">(obrigatório para entrega)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={complemento}
                          onChange={e => setComplemento(e.target.value)}
                          placeholder="Ex: Qda 36, Lote 03 - Fundos"
                          className={inputCls}
                        />
                      </div>

                      {/* Cidade + Estado */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className={labelCls}>Cidade</label>
                          <input
                            type="text"
                            value={cidade}
                            onChange={e => setCidade(e.target.value)}
                            placeholder="—"
                            className={cepFound ? inputCls : readonlyCls}
                            readOnly={!cepFound}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>UF</label>
                          <input
                            type="text"
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            placeholder="GO"
                            maxLength={2}
                            className={cepFound ? `${inputCls} uppercase text-center` : `${readonlyCls} uppercase text-center`}
                            readOnly={!cepFound}
                          />
                        </div>
                      </div>

                      {addressError && (
                        <p className="text-red-400 text-sm font-bold text-center bg-red-950/30 border border-red-900/30 rounded-xl p-3">{addressError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={addressLoading || !cepFound}
                        className="btn-brasa w-full"
                      >
                        {addressLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <><MapPin className="w-4 h-4" /> SALVAR ENDEREÇO</>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── ETAPA 3: SUCESSO ── */}
                {step === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-2xl font-black text-white uppercase">PRONTO!</h2>
                    <p className="text-zinc-500 text-sm mt-2">Endereço salvo. Finalizando seu pedido...</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
