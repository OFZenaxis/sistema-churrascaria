'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame,
  CheckCircle2,
  ShieldCheck,
  Zap,
  XCircle,
  ArrowRight,
  ArrowLeft,
  MonitorCheck,
  Globe,
  Loader2,
  Eye,
  EyeOff,
  User,
  Store,
  Lock,
} from 'lucide-react'
import { registerNewStore } from '@/app/actions/tenant'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  ownerName: string
  phone: string
  email: string
  storeName: string
  slug: string
  password: string
  confirmPassword: string
}

type SlugStatus = 'idle' | 'loading' | 'available' | 'taken'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPhone(v: string) {
  return v.replace(/\D/g, '').length >= 10
}

// ─── Stepper indicator ────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Você',   icon: User  },
  { label: 'Loja',   icon: Store },
  { label: 'Acesso', icon: Lock  },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full mb-8">
      {STEPS.map((step, idx) => {
        const n = idx + 1
        const done = n < current
        const active = n === current
        const Icon = step.icon
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done
                    ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                    : active
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]'
                    : 'bg-slate-100 border-2 border-slate-200'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-4.5 h-4.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                )}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  active ? 'text-emerald-600' : done ? 'text-emerald-500' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-1.5 rounded-full transition-all duration-500 ${
                  n < current ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Input primitives ─────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:shadow-emerald-500/20 shadow-sm transition-colors placeholder:text-slate-300'

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CadastroPage() {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formData, setFormData] = useState<FormData>({
    ownerName: '',
    phone: '',
    email: '',
    storeName: '',
    slug: '',
    password: '',
    confirmPassword: '',
  })
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Whether the user has manually edited the slug field
  const [slugTouched, setSlugTouched] = useState(false)

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  // ── Auto-fill slug from storeName (only while untouched) ──────────────
  useEffect(() => {
    if (slugTouched) return
    const generated = slugify(formData.storeName)
    if (generated) {
      setFormData(prev => ({ ...prev, slug: generated }))
    }
  }, [formData.storeName, slugTouched])

  // ── Debounced slug availability check ─────────────────────────────────
  const checkSlug = useCallback(async (val: string) => {
    setSlugStatus('loading')
    try {
      const res = await fetch(`/api/tenant/check-slug?slug=${val}`)
      const data = await res.json()
      setSlugStatus(data.available ? 'available' : 'taken')
    } catch {
      setSlugStatus('idle')
    }
  }, [])

  useEffect(() => {
    const slug = formData.slug
    if (slug.length < 3) { setSlugStatus('idle'); return }
    const t = setTimeout(() => checkSlug(slug), 600)
    return () => clearTimeout(t)
  }, [formData.slug, checkSlug])

  // ── Step-level validation ─────────────────────────────────────────────
  const step1Valid =
    formData.ownerName.trim().length > 0 &&
    isValidPhone(formData.phone) &&
    isValidEmail(formData.email)

  const step2Valid =
    formData.storeName.trim().length > 0 &&
    formData.slug.length >= 3 &&
    slugStatus === 'available'

  const step3Valid =
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword

  // ── Navigation ────────────────────────────────────────────────────────
  function next() {
    setError('')
    setStep(s => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))
  }
  function back() {
    setError('')
    setStep(s => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!step3Valid) return
    setError('')
    setIsSubmitting(true)
    try {
      const result = await registerNewStore({
        ownerName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        storeName: formData.storeName,
        slug: formData.slug,
        phone: formData.phone,
      })
      if (result.success) {
        router.push(`/${result.slug}/admin`)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Erro de conexão com o servidor. Tente novamente em instantes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex w-full">

      {/* ── BRANDING (desktop only) ───────────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] xl:w-[560px] bg-slate-900 px-14 py-16 flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Flame className="w-6 h-6 text-white fill-white" strokeWidth={1.5} />
          </div>
          <span className="text-white font-black text-2xl tracking-tight">
            Saiu<span className="text-emerald-400">Delivery</span>
          </span>
        </div>

        <div className="relative z-10 mt-16 mb-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-emerald-500/30">
            Libertação Digital
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight mb-10 text-balance">
            Sua independência <br />
            <span className="text-emerald-400">dos apps começa aqui.</span>
          </h1>
          <ul className="space-y-6">
            {[
              { Icon: Zap,         title: 'Setup em 5 minutos',  desc: 'Sem esperas ou ligações chatas.'           },
              { Icon: MonitorCheck, title: 'KDS Transparente',    desc: 'A cozinha recebe tudo em tempo real.'      },
              { Icon: ShieldCheck, title: 'Teste sem risco',      desc: 'Sem exigência de cartão de crédito agora.' },
            ].map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold mb-0.5">{title}</p>
                  <p className="text-slate-400 font-medium text-sm">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-slate-500 text-sm font-medium">
          Junte-se à revolução do SaaS Independente.
        </p>
      </div>

      {/* ── FORM SIDE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 xl:px-20 overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-white fill-white" strokeWidth={1.5} />
          </div>
          <span className="text-slate-900 font-black text-xl tracking-tight">
            Saiu<span className="text-emerald-500">Delivery</span>
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1">
            {step === 1 && 'Quem é você?'}
            {step === 2 && 'Sua loja'}
            {step === 3 && 'Crie sua senha'}
          </h2>
          <p className="text-slate-500 font-medium text-base">
            {step === 1 && 'Dados do responsável pela conta.'}
            {step === 2 && 'O endereço que seus clientes vão acessar.'}
            {step === 3 && 'Proteja seu painel. Mínimo 6 caracteres.'}
          </p>
        </div>

        {/* Stepper */}
        <StepIndicator current={step} />

        {/* Error banner */}
        {error && (
          <div className="mb-5 p-4 bg-rose-50 text-rose-700 text-sm font-semibold rounded-2xl border border-rose-200 flex items-start gap-3">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Dados Pessoais ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-bold text-slate-700 mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    autoFocus
                    required
                    value={formData.ownerName}
                    onChange={set('ownerName')}
                    className={inputCls}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1.5">
                    WhatsApp Oficial
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={set('phone')}
                    className={inputCls}
                    placeholder="(11) 90000-0000"
                  />
                  {formData.phone && !isValidPhone(formData.phone) && (
                    <p className="text-xs text-rose-500 font-bold mt-1.5">Número inválido (mínimo 10 dígitos).</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                    E-mail do Dono
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={set('email')}
                    className={inputCls}
                    placeholder="dono@restaurante.com"
                  />
                  {formData.email && !isValidEmail(formData.email) && (
                    <p className="text-xs text-rose-500 font-bold mt-1.5">E-mail inválido.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Dados da Loja ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
              <div>
                <label htmlFor="storeName" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nome do Restaurante
                </label>
                <input
                  id="storeName"
                  type="text"
                  autoFocus
                  required
                  value={formData.storeName}
                  onChange={set('storeName')}
                  className={inputCls}
                  placeholder="Ex: Pizzaria do João"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Link da sua Loja (URL)
                </label>
                <div
                  className={`relative bg-slate-50 border rounded-xl overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-colors ${
                    slugStatus === 'taken' ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                  }`}
                >
                  <input
                    id="slug"
                    type="text"
                    required
                    value={formData.slug}
                    onChange={e => {
                      setSlugTouched(true)
                      set('slug')(e)
                    }}
                    className="w-full bg-transparent py-3.5 pl-4 pr-12 text-emerald-700 font-bold outline-none text-sm placeholder:text-slate-300 placeholder:font-medium"
                    placeholder="pizzaria-do-joao"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {slugStatus === 'loading'   && <Loader2     className="w-5 h-5 text-slate-400 animate-spin" />}
                    {slugStatus === 'available' && formData.slug.length > 2 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {slugStatus === 'taken'     && <XCircle     className="w-5 h-5 text-rose-500"    />}
                  </div>
                </div>

                {/* URL preview — formato subdomínio SaaS: slug.saiudelivery.com.br */}
                <div className="mt-2.5 bg-slate-50/80 border border-slate-200/60 rounded-lg py-2.5 px-3.5 flex items-center overflow-hidden gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className={`font-bold text-xs truncate ${formData.slug ? 'text-emerald-600' : 'text-slate-300'}`}>
                    {formData.slug || 'pizzaria-do-joao'}
                  </span>
                  <span className="text-slate-400 font-medium text-xs shrink-0">
                    .{process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'saiudelivery.com.br'}
                  </span>
                </div>

                <div className="mt-2 min-h-[18px]">
                  {slugStatus === 'taken' && (
                    <p className="text-xs text-rose-500 font-bold">Este link já foi registrado por outra loja.</p>
                  )}
                  {slugStatus === 'available' && formData.slug.length > 2 && (
                    <p className="text-xs text-emerald-600 font-bold">Link disponível!</p>
                  )}
                  {(slugStatus === 'idle' || slugStatus === 'loading') && (
                    <p className="text-xs text-slate-400 font-medium">Use apenas letras minúsculas, números e hifens.</p>
                  )}
                </div>
              </div>
              </motion.div>
            )}

            {/* ── STEP 3: Senha ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="space-y-5"
              >
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={set('password')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-11 text-slate-900 font-black tracking-widest focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:shadow-emerald-500/20 shadow-sm transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1.5">Mínimo 6 caracteres.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={set('confirmPassword')}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 pr-11 text-slate-900 font-black tracking-widest focus:bg-white focus:outline-none focus:ring-4 shadow-sm transition-colors ${
                      formData.confirmPassword && formData.confirmPassword !== formData.password
                        ? 'border-rose-300 focus:ring-rose-500/30 focus:border-rose-400 focus:shadow-rose-500/20'
                        : formData.confirmPassword && formData.confirmPassword === formData.password
                        ? 'border-emerald-300 focus:ring-emerald-500/30 focus:border-emerald-400 focus:shadow-emerald-500/20'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 focus:shadow-emerald-500/20'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1.5 min-h-[18px]">
                  {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                    <p className="text-xs text-rose-500 font-bold">As senhas não coincidem.</p>
                  )}
                  {formData.confirmPassword && formData.confirmPassword === formData.password && (
                    <p className="text-xs text-emerald-600 font-bold">Senhas conferem!</p>
                  )}
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation buttons ── */}
          <div className="flex items-center gap-3 pt-3">
            {step > 1 && (
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors px-1 py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={next}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className="ml-auto flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all px-7 py-3.5 rounded-xl text-white font-black text-sm shadow-md shadow-emerald-500/25"
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="submit"
                disabled={isSubmitting || !step3Valid}
                className="ml-auto flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all py-4 rounded-xl text-white font-black text-base shadow-lg shadow-emerald-500/25"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Criando sua loja...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Finalizar e Criar Minha Loja</>
                )}
              </button>
            )}
          </div>

          {step === 3 && (
            <p className="text-center text-slate-400 text-xs font-semibold">
              Ao criar a loja você entra no período de adesão de 0 taxas e isento de pegadinhas.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
