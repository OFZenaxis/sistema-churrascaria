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
  // Etapa
  const [step, setStep] = useState<Step>('phone')

  // Etapa 1: Login
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Etapa 2: Endereço
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
        setLabel('Casa'); setCepError(''); setCepFound(false)
        setAddressError('')
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
    if (!cepFound) {
      setAddressError('Busque um CEP válido antes de continuar.')
      return
    }
    setAddressLoading(true)
    setAddressError('')

    const res = await saveAddress({ label, cep, rua, numero, complemento, bairro, cidade, estado })

    setAddressLoading(false)

    if (res.success) {
      setStep('done')
      setTimeout(() => {
        onSuccess()
      }, 900)
    } else {
      setAddressError(res.error || 'Erro ao salvar endereço.')
    }
  }

  const inputClass = "w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all font-medium"
  const readonlyClass = "w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-zinc-400 focus:outline-none font-medium cursor-not-allowed"
  const labelClass = "text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-[#111] w-full max-w-md rounded-[2rem] border border-zinc-800 relative shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
          >
            {/* Progress Bar */}
            <div className="h-1 bg-zinc-800 w-full">
              <motion.div
                className="h-full bg-orange-500"
                animate={{ width: step === 'phone' ? '33%' : step === 'address' ? '66%' : '100%' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">

                {/* ====== ETAPA 1: TELEFONE ====== */}
                {step === 'phone' && (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="text-center mb-8">
                      <div className="bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                        <Smartphone className="w-8 h-8 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-black text-white">Quase lá!</h2>
                      <p className="text-zinc-400 text-sm mt-2">Informe seu WhatsApp para despacharmos a sua carne.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className={labelClass}>Telefone / WhatsApp</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(61) 99999-9999"
                          className={`${inputClass} font-mono text-lg`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Como chama você?</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          className={`${inputClass} text-lg`}
                        />
                      </div>

                      {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-black text-xl py-4 rounded-xl shadow-xl shadow-orange-900/40 transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
                      >
                        {loginLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                          <><span>Continuar</span><ChevronRight className="w-5 h-5" /></>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ====== ETAPA 2: ENDEREÇO ====== */}
                {step === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="text-center mb-6">
                      <div className="bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                        <MapPin className="w-8 h-8 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-black text-white">Onde entregar?</h2>
                      <p className="text-zinc-400 text-sm mt-2">Salve seu endereço para entregas futuras.</p>
                    </div>

                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">

                      {/* Label */}
                      <div>
                        <label className={labelClass}>Tipo de Endereço</label>
                        <div className="flex gap-2">
                          {LABEL_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setLabel(opt)}
                              className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-black transition-all ${
                                label === opt
                                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                  : 'border-zinc-800 bg-[#0a0a0a] text-zinc-500 hover:border-zinc-700'
                              }`}
                            >
                              {opt === 'Casa' ? '🏠' : opt === 'Trabalho' ? '💼' : '📍'} {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CEP */}
                      <div>
                        <label className={labelClass}>CEP</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cep}
                            onChange={(e) => setCep(formatCep(e.target.value))}
                            placeholder="00000-000"
                            maxLength={9}
                            className={`${inputClass} font-mono pr-12`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {cepLoading && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
                            {cepFound && !cepLoading && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {!cepFound && !cepLoading && cep.length > 0 && <Search className="w-5 h-5 text-zinc-600" />}
                          </div>
                        </div>
                        {cepError && <p className="text-red-500 text-xs mt-1.5 font-bold">{cepError}</p>}
                      </div>

                      {/* Rua (auto-preenchida) */}
                      <div>
                        <label className={labelClass}>
                          Rua / Logradouro
                          {cepFound && <span className="ml-2 text-emerald-500 normal-case font-medium">✓ preenchido automaticamente</span>}
                        </label>
                        <input
                          type="text"
                          value={rua}
                          onChange={(e) => setRua(e.target.value)}
                          placeholder="Aguardando CEP..."
                          className={cepFound ? `${inputClass}` : readonlyClass}
                          readOnly={!cepFound}
                        />
                      </div>

                      {/* Número + Complemento lado a lado */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>
                            Número <span className="text-orange-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            placeholder="Ex: 42"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={bairro}
                            onChange={(e) => setBairro(e.target.value)}
                            placeholder="Aguardando CEP..."
                            className={cepFound ? `${inputClass}` : readonlyClass}
                            readOnly={!cepFound}
                          />
                        </div>
                      </div>

                      {/* Complemento (OBRIGATÓRIO) */}
                      <div>
                        <label className={labelClass}>
                          Complemento <span className="text-orange-500">*</span>
                          <span className="ml-1 text-zinc-600 normal-case font-medium">(obrigatório para entrega)</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={complemento}
                          onChange={(e) => setComplemento(e.target.value)}
                          placeholder="Ex: Quadra 36, Lote 03 - Fundos"
                          className={inputClass}
                        />
                      </div>

                      {/* Cidade + Estado */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Cidade</label>
                          <input
                            type="text"
                            value={cidade}
                            onChange={(e) => setCidade(e.target.value)}
                            placeholder="Aguardando CEP..."
                            className={cepFound ? `${inputClass}` : readonlyClass}
                            readOnly={!cepFound}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Estado</label>
                          <input
                            type="text"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            placeholder="UF"
                            maxLength={2}
                            className={cepFound ? `${inputClass}` : readonlyClass}
                            readOnly={!cepFound}
                          />
                        </div>
                      </div>

                      {addressError && (
                        <p className="text-red-500 text-sm font-bold text-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                          {addressError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={addressLoading || !cepFound}
                        className="w-full bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-black text-xl py-4 rounded-xl shadow-xl shadow-orange-900/40 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addressLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <><MapPin className="w-5 h-5" /> Salvar Endereço</>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ====== ETAPA 3: SUCESSO ====== */}
                {step === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                      className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-2xl font-black text-white">Endereço salvo!</h2>
                    <p className="text-zinc-400 text-sm mt-2">Tudo certo. Finalizando seu pedido...</p>
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
