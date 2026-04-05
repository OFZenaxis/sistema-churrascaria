"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Loader2, MapPin, CheckCircle2, Search, ChevronRight } from 'lucide-react'
import { loginWithPhone, saveAddress } from '../app/actions/auth'
import type { StoreTheme } from './MenuComponent'

type Step = 'phone' | 'address' | 'done'

type ViaCepResponse = {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

const DEFAULT_THEME: Partial<StoreTheme> = {
  brandColor: '#10b981',
  phoneBg: '#f8fafc',
  phoneCard: '#ffffff',
  phoneText: '#0f172a',
  phoneSubText: '#64748b',
}

type PhoneLoginProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  storeId: string
  storeTheme?: StoreTheme
}

const LABEL_OPTIONS = ['Casa', 'Trabalho', 'Outro']

export default function PhoneLogin({ isOpen, onClose, onSuccess, storeId, storeTheme }: PhoneLoginProps) {
  const { brandColor, phoneBg, phoneCard, phoneText, phoneSubText } = storeTheme ?? DEFAULT_THEME as StoreTheme

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

  // BUG-011: Restaura rascunho do sessionStorage na montagem do componente (resistente a F5)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`phonelogin_draft_${storeId}`)
      if (!saved) return
      const { step: s, phone: p, name: n } = JSON.parse(saved) as { step: Step; phone: string; name: string }
      if (s && s !== 'done') {
        setStep(s)
        if (p) setPhone(p)
        if (n) setName(n)
      }
    } catch { /* sessionStorage indisponível (SSR, modo privado restrito) */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]) // apenas na montagem

  // BUG-011: Persiste step/phone/name enquanto o fluxo não está concluído
  useEffect(() => {
    if (step === 'done') {
      try { sessionStorage.removeItem(`phonelogin_draft_${storeId}`) } catch {}
      return
    }
    try {
      sessionStorage.setItem(`phonelogin_draft_${storeId}`, JSON.stringify({ step, phone, name }))
    } catch { /* sessionStorage indisponível */ }
  }, [step, phone, name, storeId])

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

  const formatPhone = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
    return digits
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const res = await loginWithPhone(phone, name, storeId)
    setLoginLoading(false)
    if (res.success) {
      setStep('address')
    } else {
      setLoginError(res.error || 'Erro ao identificar.')
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddressLoading(true)
    setAddressError('')
    const res = await saveAddress({ rua, numero, complemento, bairro, cidade, estado, cep, label }, storeId)
    setAddressLoading(false)
    if (res.success) {
      setStep('done')
      setTimeout(() => onSuccess(), 1200)
    } else {
      setAddressError(res.error || 'Erro ao salvar endereço.')
    }
  }

  const border = phoneSubText + '33'
  const subtleBg = phoneSubText + '18'
  const progressWidth = step === 'phone' ? '33%' : step === 'address' ? '66%' : '100%'

  const inputStyle = {
    background: phoneCard,
    color: phoneText,
    borderColor: border,
    caretColor: brandColor,
  }
  const inputCls = "w-full rounded-xl border-2 px-4 py-3 text-sm font-medium outline-none transition-colors min-h-[52px]"
  const labelCls = "block text-[10px] font-black uppercase tracking-widest mb-1.5"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border-t sm:border shadow-2xl overflow-hidden"
            style={{ background: phoneBg, borderColor: border }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            {/* Progress bar */}
            <div className="h-1 w-full" style={{ background: border }}>
              <motion.div
                className="h-full"
                style={{ background: brandColor }}
                animate={{ width: progressWidth }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            {/* Handle mobile */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden">
              <div className="w-10 h-1 rounded-full" style={{ background: border }} />
            </div>

            <div className="px-6 pb-8 pt-4 relative">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10"
                style={{ background: subtleBg, color: phoneSubText }}
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
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border"
                        style={{ background: brandColor + '18', borderColor: brandColor + '33' }}
                      >
                        <Smartphone className="w-7 h-7" style={{ color: brandColor }} />
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: phoneText }}>Identificação</h2>
                      <p className="text-sm mt-1" style={{ color: phoneSubText }}>Informe seu WhatsApp para entregarmos.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4 pb-4">
                      <div>
                        <label className={labelCls} style={{ color: phoneSubText }}>Telefone / WhatsApp</label>
                        <input
                          type="tel"
                          inputMode="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(formatPhone(e.target.value))}
                          placeholder="(61) 99999-9999"
                          maxLength={15}
                          className={`${inputCls} font-mono`}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: phoneSubText }}>Seu nome</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Como te chamamos?"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>

                      {loginError && (
                        <p className="text-red-500 text-sm font-bold text-center bg-red-50 border border-red-200 rounded-xl p-3">{loginError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full flex items-center justify-center gap-2 text-white font-black text-sm uppercase px-6 py-4 rounded-xl active:scale-[0.98] transition-all min-h-[52px] mt-2 disabled:opacity-60"
                        style={{ backgroundColor: brandColor }}
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
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border"
                        style={{ background: brandColor + '18', borderColor: brandColor + '33' }}
                      >
                        <MapPin className="w-7 h-7" style={{ color: brandColor }} />
                      </div>
                      <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: phoneText }}>Endereço</h2>
                      <p className="text-sm mt-1" style={{ color: phoneSubText }}>Salve para entregas futuras.</p>
                    </div>

                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-h-[52vh] overflow-y-auto overscroll-contain pr-0.5 pb-10">

                      {/* Tipo */}
                      <div>
                        <label className={labelCls} style={{ color: phoneSubText }}>Tipo</label>
                        <div className="flex gap-2">
                          {LABEL_OPTIONS.map(opt => {
                            const isSelected = label === opt
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setLabel(opt)}
                                className="flex-1 py-3 rounded-xl border-2 text-xs font-black uppercase transition-all"
                                style={isSelected
                                  ? { borderColor: brandColor, background: brandColor + '18', color: brandColor }
                                  : { borderColor: border, background: phoneCard, color: phoneSubText }
                                }
                              >
                                {opt === 'Casa' ? '🏠 ' : opt === 'Trabalho' ? '💼 ' : '📍 '}{opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* CEP */}
                      <div>
                        <label className={labelCls} style={{ color: phoneSubText }}>CEP</label>
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
                            style={inputStyle}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {cepLoading && <Loader2 className="w-5 h-5 animate-spin" style={{ color: brandColor }} />}
                            {cepFound && !cepLoading && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {!cepFound && !cepLoading && cep.length > 0 && <Search className="w-4 h-4" style={{ color: phoneSubText }} />}
                          </div>
                        </div>
                        {cepError && <p className="text-red-500 text-xs mt-1.5 font-bold">{cepError}</p>}
                        {cepFound && <p className="text-emerald-500 text-xs mt-1.5 font-bold">✓ CEP encontrado — campos preenchidos automaticamente</p>}
                      </div>

                      {/* Rua */}
                      <div>
                        <label className={labelCls} style={{ color: phoneSubText }}>Rua / Logradouro</label>
                        <input
                          type="text"
                          value={rua}
                          onChange={e => setRua(e.target.value)}
                          placeholder={cepFound ? 'Rua / Logradouro' : 'Digite o CEP ou escreva aqui'}
                          className={inputCls}
                          style={{ ...inputStyle, opacity: cepFound ? 1 : 0.65 }}
                        />
                      </div>

                      {/* Número + Bairro */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls} style={{ color: phoneSubText }}>
                            Número <span style={{ color: brandColor }}>*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            value={numero}
                            onChange={e => setNumero(e.target.value)}
                            placeholder="Ex: 42"
                            className={inputCls}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className={labelCls} style={{ color: phoneSubText }}>Bairro</label>
                          <input
                            type="text"
                            value={bairro}
                            onChange={e => setBairro(e.target.value)}
                            placeholder="Bairro"
                            className={inputCls}
                            style={{ ...inputStyle, opacity: cepFound ? 1 : 0.65 }}
                          />
                        </div>
                      </div>

                      {/* Complemento */}
                      <div>
                        <label className={labelCls} style={{ color: phoneSubText }}>
                          Complemento <span style={{ color: brandColor }}>*</span>
                          <span className="normal-case font-normal ml-1" style={{ color: phoneSubText }}>(obrigatório para entrega)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={complemento}
                          onChange={e => setComplemento(e.target.value)}
                          placeholder="Ex: Qda 36, Lote 03 - Fundos"
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>

                      {/* Cidade + Estado */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className={labelCls} style={{ color: phoneSubText }}>Cidade</label>
                          <input
                            type="text"
                            value={cidade}
                            onChange={e => setCidade(e.target.value)}
                            placeholder="—"
                            className={inputCls}
                            style={{ ...inputStyle, opacity: cepFound ? 1 : 0.5 }}
                            readOnly={!cepFound}
                          />
                        </div>
                        <div>
                          <label className={labelCls} style={{ color: phoneSubText }}>UF</label>
                          <input
                            type="text"
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            placeholder="GO"
                            maxLength={2}
                            className={`${inputCls} uppercase text-center`}
                            style={{ ...inputStyle, opacity: cepFound ? 1 : 0.5 }}
                            readOnly={!cepFound}
                          />
                        </div>
                      </div>

                      {addressError && (
                        <p className="text-red-500 text-sm font-bold text-center bg-red-50 border border-red-200 rounded-xl p-3">{addressError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={addressLoading || !cepFound}
                        className="w-full flex items-center justify-center gap-2 text-white font-black text-sm uppercase px-6 py-4 rounded-xl active:scale-[0.98] transition-all min-h-[52px] disabled:opacity-50"
                        style={{ backgroundColor: brandColor }}
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
                    <h2 className="text-2xl font-black uppercase" style={{ color: phoneText }}>PRONTO!</h2>
                    <p className="text-sm mt-2" style={{ color: phoneSubText }}>Endereço salvo. Finalizando seu pedido...</p>
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
