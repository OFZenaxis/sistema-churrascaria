"use client"

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Store,
  Tag,
  MapPin,
  Phone,
  Image as ImageIcon,
  Upload,
  X,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { saveStoreSettings } from '@/app/actions/admin'
import { uploadImage } from '@/lib/upload'

type StoreData = {
  name: string
  tagline: string
  city: string
  phone: string
  logoUrl: string
  coverImageUrl: string
  kitchenPin: string
  slug: string
  storeId: string
}

export default function StoreSettingsClient({ initial }: { initial: StoreData }) {
  const [form, setForm] = useState({
    name: initial.name,
    tagline: initial.tagline,
    city: initial.city,
    phone: initial.phone,
    logoUrl: initial.logoUrl,
    coverImageUrl: initial.coverImageUrl,
    kitchenPin: initial.kitchenPin,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    setFeedback(null)
  }

  // O-04: lógica unificada — campo, setter e ref derivados do parâmetro 'logo'|'cover'
  const handleImageUpload = (field: 'logo' | 'cover') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fieldKey  = field === 'logo' ? 'logoUrl' : 'coverImageUrl'
    const setUploading = field === 'logo' ? setIsUploadingLogo : setIsUploadingCover
    const inputRef  = field === 'logo' ? logoInputRef : coverInputRef
    setUploading(true)
    setFeedback(null)
    try {
      const url = await uploadImage(file, initial.storeId)
      setForm(prev => ({ ...prev, [fieldKey]: url }))
    } catch (err) {
      console.error('[settings] Erro no upload:', err instanceof Error ? err.message : 'Erro desconhecido')
      setFeedback({ ok: false, message: 'Erro ao fazer upload da imagem. Verifique as configurações do Supabase.' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFeedback(null)
    const res = await saveStoreSettings({ ...form, slug: initial.slug }, initial.storeId)
    setIsLoading(false)
    setFeedback(
      res.success
        ? { ok: true, message: 'Configurações salvas com sucesso!' }
        : { ok: false, message: res.error || 'Erro ao salvar.' }
    )
  }

  const anyUploading = isUploadingLogo || isUploadingCover

  return (
    <form onSubmit={handleSave} className="space-y-5">

      {/* Identidade */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Identidade da Loja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome da Loja" icon={<Store className="w-4 h-4" />} value={form.name} onChange={set('name')} placeholder="Ex: Churrascaria do João" required />
          <Field label="Tagline / Slogan" icon={<Tag className="w-4 h-4" />} value={form.tagline} onChange={set('tagline')} placeholder="Ex: A Pioneira do Bairro" />
          <Field label="Cidade" icon={<MapPin className="w-4 h-4" />} value={form.city} onChange={set('city')} placeholder="Ex: São Paulo · SP" />
          <Field label="Telefone / WhatsApp" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={set('phone')} placeholder="Ex: (62) 99999-9999" />
        </div>
      </section>

      {/* Imagens */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Imagens da Loja</h2>
        <div className="space-y-6">

          {/* Logo */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Logo</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload('logo')}
            />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                {isUploadingLogo ? (
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                ) : form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={anyUploading}
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingLogo
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : <><Upload className="w-4 h-4" /> {form.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}</>}
                </button>
                {form.logoUrl && !isUploadingLogo && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                  >
                    <X className="w-3 h-3" /> Remover
                  </button>
                )}
                <p className="text-xs text-slate-400 font-medium">PNG com fundo transparente recomendado</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Imagem de Capa */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Imagem de Capa</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload('cover')}
            />
            <div className="space-y-3">
              {/* Preview da capa (wide) */}
              {form.coverImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImageUrl} alt="Capa preview" className="w-full h-full object-cover" />
                  {isUploadingCover && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 h-28 flex flex-col items-center justify-center gap-2">
                  {isUploadingCover
                    ? <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    : <ImageIcon className="w-7 h-7 text-slate-300" />}
                  {!isUploadingCover && <p className="text-xs text-slate-400 font-medium">Nenhuma capa selecionada</p>}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={anyUploading}
                  onClick={() => coverInputRef.current?.click()}
                  className="inline-flex items-center gap-2 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingCover
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    : <><Upload className="w-4 h-4" /> {form.coverImageUrl ? 'Trocar Capa' : 'Enviar Capa'}</>}
                </button>
                {form.coverImageUrl && !isUploadingCover && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, coverImageUrl: '' }))}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors"
                  >
                    <X className="w-3 h-3" /> Remover
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">Proporção 16:9 recomendada · JPG, PNG ou WebP</p>
            </div>
          </div>

        </div>
      </section>

      {/* Segurança da Cozinha */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Segurança da Cozinha</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">PIN para travar a tela do KDS</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              PIN de Bloqueio do KDS
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={form.kitchenPin}
                onChange={e => {
                  // aceita só dígitos
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setForm(prev => ({ ...prev, kitchenPin: val }))
                  setFeedback(null)
                }}
                placeholder="Ex: 1234"
                className="w-full border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-900 font-mono tracking-[0.3em] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-300 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Indicador visual da força do PIN */}
          {form.kitchenPin.length > 0 && (
            <div className="flex items-center gap-2 max-w-xs">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < form.kitchenPin.length
                      ? form.kitchenPin.length <= 3 ? 'bg-amber-400'
                        : form.kitchenPin.length <= 5 ? 'bg-emerald-400'
                        : 'bg-emerald-600'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                {form.kitchenPin.length < 4 ? 'Mínimo 4 dígitos' : `${form.kitchenPin.length} dígitos`}
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
            Quando definido, o botão <strong className="text-slate-600">"Travar Tela"</strong> no KDS ativa o
            Modo Cozinha — bloqueando a navegação e entrando em tela cheia. O PIN é necessário para sair.
            {!form.kitchenPin && ' Deixe vazio para desativar o bloqueio.'}
          </p>
        </div>
      </section>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm ${
            feedback.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {feedback.ok
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={isLoading || anyUploading || !form.name.trim()}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-black text-sm py-3 px-8 rounded-xl shadow-sm disabled:opacity-50"
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          : <><Save className="w-4 h-4" /> Salvar Configurações</>}
      </button>
    </form>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-300 bg-white"
        />
      </div>
    </div>
  )
}
