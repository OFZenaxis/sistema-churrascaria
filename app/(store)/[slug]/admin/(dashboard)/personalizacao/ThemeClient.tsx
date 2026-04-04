"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Save, Loader2, CheckCircle, AlertCircle, Palette,
  Upload, X, ShoppingBag, Star, Check,
  LayoutGrid, List, LayoutTemplate,
  Home, ShoppingCart, User, MapPin, Phone, LogOut, QrCode, ChevronLeft
} from 'lucide-react'
import { updateStoreTheme } from '@/app/actions/admin'
import { uploadCoverImage } from '@/app/actions/upload'

// ─── Temas (importados do catálogo compartilhado) ───────────────────────────
import { Theme, THEMES, getTheme } from '@/lib/themes'

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  initial: { brandColor: string; themeId: string; coverImageUrl: string }
  storeName: string
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ThemeClient({ initial, storeName }: Props) {
  const [selectedThemeId, setSelectedThemeId] = useState(initial.themeId || 'classic-light')
  const [color, setColor] = useState(initial.brandColor || '#10b981')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState(initial.coverImageUrl || '')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [previewScreen, setPreviewScreen] = useState<'home' | 'cart' | 'pix' | 'profile'>('home')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoga o blob URL anterior sempre que coverPreview mudar ou o componente desmontar,
  // evitando memory leak em drag-and-drop repetido (W-01)
  useEffect(() => {
    if (!coverPreview.startsWith('blob:')) return
    return () => URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  const activeTheme = getTheme(selectedThemeId)

  // ── Cover upload handlers ──────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsLoading(true)
    setStatus('idle')

    let finalCoverUrl = initial.coverImageUrl

    if (coverFile) {
      const fd = new FormData()
      fd.append('file', coverFile)
      const uploadRes = await uploadCoverImage(fd)
      if (!uploadRes.success) {
        setIsLoading(false)
        setStatus('error')
        setErrorMsg(uploadRes.error)
        return
      }
      finalCoverUrl = uploadRes.url
      setCoverPreview(uploadRes.url)
      setCoverFile(null)
    }

    const res = await updateStoreTheme({
      brandColor: color,
      themeId: selectedThemeId,
      coverImageUrl: finalCoverUrl,
    })
    setIsLoading(false)
    if (res.success) {
      setStatus('success')
      setTimeout(() => setStatus('idle'), 4000)
    } else {
      setStatus('error')
      setErrorMsg(res.error ?? 'Erro ao salvar.')
    }
  }

    // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* ══════════════════════════════════════════════════════════════════
          SEÇÃO 1: GALERIA DE TEMAS
      ══════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900">Galeria de Temas</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cada tema define a estrutura visual completa da sua vitrine
            </p>
          </div>
          <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
            {THEMES.length} temas disponíveis
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {THEMES.map(theme => {
            const isSelected = theme.id === selectedThemeId
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedThemeId(theme.id)}
                className={`
                  relative group text-left rounded-2xl overflow-hidden border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-violet-500 shadow-lg shadow-violet-100 scale-[1.02]'
                    : 'border-transparent hover:border-slate-200 hover:scale-[1.01]'}
                `}
              >
                {/* Thumbnail gradient */}
                <div className={`h-20 bg-gradient-to-br ${theme.cardGradient} relative flex items-center justify-center`}>
                  <span className="text-3xl drop-shadow-lg">{theme.emoji}</span>

                  {/* Layout indicator badge */}
                  <div className="absolute bottom-2 left-2 bg-black/20 backdrop-blur-sm shadow-sm text-white/90 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center gap-1.5 border border-white/10">
                    {theme.layoutStyle === 'grid' && <LayoutGrid className="w-3 h-3 text-white/80" />}
                    {theme.layoutStyle === 'list' && <List className="w-3 h-3 text-white/80" />}
                    {theme.layoutStyle === 'featured' && <LayoutTemplate className="w-3 h-3 text-white/80" />}
                    {theme.layoutStyle}
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white text-violet-600 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-white p-3 border-t border-slate-100">
                  <p className="text-xs font-black text-slate-900 leading-tight">{theme.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">{theme.category}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {theme.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Descrição do tema ativo */}
        <div className="mt-4 flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          <span className="text-xl shrink-0">{activeTheme.emoji}</span>
          <div>
            <p className="text-sm font-black text-violet-900">{activeTheme.name} selecionado</p>
            <p className="text-xs text-violet-600 font-medium">{activeTheme.description}</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SEÇÃO 2: COR DE DESTAQUE + CAPA + PREVIEW
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">

        {/* Coluna esquerda: controles */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Color picker */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Cor de Destaque</h3>
                <p className="text-xs text-slate-400 font-medium">Sobrepõe a cor padrão do tema em botões e badges</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="relative cursor-pointer group shrink-0">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="sr-only"
                />
                <div
                  className="w-14 h-14 rounded-2xl border-4 border-white shadow-md ring-2 ring-slate-200 group-hover:ring-violet-300 transition-all"
                  style={{ backgroundColor: color }}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow">
                  <Palette className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  value={color}
                  onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setColor(e.target.value) }}
                  maxLength={7}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
                  spellCheck={false}
                />
                <p className="text-xs text-slate-400 font-medium mt-1.5">Clique no quadrado para abrir o seletor</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Paletas rápidas</p>
              <div className="flex flex-wrap gap-2">
                {['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4','#e25822','#6b4226'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    title={c}
                    className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-white shadow-sm'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Drag & Drop Cover */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Imagem de Capa</h3>
                  <p className="text-xs text-slate-400 font-medium">Exibida no topo da vitrine · 16:9 recomendado</p>
                </div>
              </div>
              {coverPreview && (
                <button
                  type="button"
                  onClick={() => { setCoverFile(null); setCoverPreview('') }}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {coverPreview ? (
              /* Preview da imagem selecionada */
              <div
                className="relative h-36 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Preview da capa" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl">
                    <Upload className="w-3.5 h-3.5" /> Trocar imagem
                  </div>
                </div>
                {coverFile && (
                  <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                    Aguardando upload
                  </div>
                )}
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  h-36 rounded-2xl border-2 border-dashed transition-all cursor-pointer
                  flex flex-col items-center justify-center gap-2 select-none
                  ${isDragging
                    ? 'border-violet-400 bg-violet-50 scale-[1.01]'
                    : 'border-slate-200 bg-slate-50 hover:border-sky-400 hover:bg-sky-50'}
                `}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-violet-100' : 'bg-slate-100'}`}>
                  <Upload className={`w-5 h-5 ${isDragging ? 'text-violet-500' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-600">
                    {isDragging ? 'Solte para adicionar' : 'Arraste ou clique para enviar'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">JPG, PNG ou WebP · máx 5MB</p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              O upload para o servidor será ativado após a configuração do bucket. Por enquanto, a prévia é local.
            </p>
          </div>

          {/* Feedback */}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold">{errorMsg}</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold">Tema salvo! A vitrine já reflete as alterações.</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wide px-7 py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isLoading ? 'Salvando...' : 'Salvar Aparência'}
          </button>
        </div>

        {/* ── Preview Phone ─────────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-col items-center gap-3 sticky top-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview ao Vivo</p>
          </div>

          {/* Phone shell */}
          <div
            className="w-[220px] h-[500px] rounded-[3rem] border-[7px] border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col relative bg-black ring-1 ring-slate-900/50"
            style={{ background: activeTheme.phoneBg }}
          >
            {/* Notch */}
            <div className="h-5 bg-slate-900 flex items-center justify-center shrink-0 w-full relative z-50">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full" />
            </div>

            {/* ── TELA HOME ──────────────────────────────────────────── */}
            {previewScreen === 'home' && (
              <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Hero / capa */}
                <div
                  className="h-28 w-full relative flex items-end shrink-0"
                  style={{
                    backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    background: coverPreview ? undefined : `linear-gradient(135deg, ${color}44, ${activeTheme.phoneAccent}22)`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="relative px-3 pb-3 w-full">
                    <p
                      className="text-white text-[11px] font-black leading-tight truncate drop-shadow-sm"
                      style={{ letterSpacing: activeTheme.phoneBorderRadius === '4px' ? '0.05em' : '0' }}
                    >
                      {storeName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-white/90 text-[8px] font-semibold">4.8 · Aberto agora</span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div
                  className={`p-3 transition-colors duration-500 flex flex-col gap-2 flex-1 pb-4 ${
                    activeTheme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                  }`}
                  style={{ background: activeTheme.phoneBg }}
                >
                  <div
                    className="inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 text-[8px] font-black shrink-0 mb-1"
                    style={{ backgroundColor: color, color: '#fff', borderRadius: activeTheme.phoneBorderRadius }}
                  >
                    <ShoppingBag className="w-2.5 h-2.5" />
                    Novidades
                  </div>

                  {activeTheme.layoutStyle === 'grid' && (
                    <div className="grid grid-cols-2 gap-2">
                      {activeTheme.mockProducts.map((item, i) => (
                        <div key={i} className="flex flex-col p-2 shadow-sm transition-transform active:scale-95 cursor-pointer" style={{ background: activeTheme.phoneCard, borderRadius: activeTheme.phoneBorderRadius }}>
                          <div className="w-full aspect-square mb-2 flex items-center justify-center transition-colors" style={{ background: color + '15', borderRadius: activeTheme.phoneBorderRadius }}>
                            <span className="text-2xl drop-shadow-sm">{activeTheme.emoji}</span>
                          </div>
                          <p className="text-[9px] font-bold leading-tight line-clamp-2 mb-1" style={{ color: activeTheme.phoneText }}>{item.name}</p>
                          <p className="text-[10px] font-black mt-auto" style={{ color }}>{item.price}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTheme.layoutStyle === 'featured' && (
                    <div className="space-y-3">
                      {activeTheme.mockProducts.map((item, i) => (
                        <div key={i} className="flex flex-col overflow-hidden shadow-sm transition-transform active:scale-95 cursor-pointer" style={{ background: activeTheme.phoneCard, borderRadius: activeTheme.phoneBorderRadius }}>
                          <div className="w-full h-24 flex items-center justify-center relative" style={{ background: `${color}15` }}>
                            <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }} />
                            <span className="text-4xl drop-shadow-md z-10">{activeTheme.emoji}</span>
                          </div>
                          <div className="p-2.5 flex justify-between items-end gap-2">
                            <div className="flex-1">
                              <p className="text-[11px] font-black uppercase tracking-tight leading-tight" style={{ color: activeTheme.phoneText }}>{item.name}</p>
                              <p className="text-[10px] font-bold mt-1" style={{ color: activeTheme.phoneSubText }}>{item.price}</p>
                            </div>
                            <div className="w-6 h-6 shrink-0 flex items-center justify-center text-white text-[12px] font-black shadow-md" style={{ backgroundColor: color, borderRadius: '50%' }}>+</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTheme.layoutStyle === 'list' && (
                    <div className="space-y-2">
                      {activeTheme.mockProducts.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 border shadow-sm transition-transform active:scale-[0.98] cursor-pointer" style={{ background: activeTheme.phoneCard, borderRadius: activeTheme.phoneBorderRadius, borderColor: activeTheme.phoneBg === '#fdf6ee' ? activeTheme.phoneSubText + '22' : 'transparent' }}>
                          <div className="w-12 h-12 shrink-0 flex items-center justify-center" style={{ background: color + '10', borderRadius: activeTheme.phoneBorderRadius }}>
                            <span className="text-2xl drop-shadow-sm">{activeTheme.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-[10px] font-bold leading-tight truncate" style={{ color: activeTheme.phoneText }}>{item.name}</p>
                            <p className="text-[8px] font-medium mt-0.5 opacity-80" style={{ color: activeTheme.phoneSubText }}>Detalhes do produto...</p>
                            <p className="text-[10px] font-black mt-1.5" style={{ color }}>{item.price}</p>
                          </div>
                          <div className="w-5 h-5 shrink-0 flex items-center justify-center text-[11px] font-black opacity-60" style={{ color: activeTheme.phoneText }}>+</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TELA CARRINHO ──────────────────────────────────────── */}
            {previewScreen === 'cart' && (
              <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: activeTheme.phoneBg }}>
                {/* Mini header */}
                <div className="px-3 py-3 flex items-center gap-2 border-b shrink-0 sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: activeTheme.phoneCard, background: activeTheme.phoneBg + 'e6' }}>
                  <button type="button" onClick={() => setPreviewScreen('home')} className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: activeTheme.phoneText }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] font-black flex-1 text-center" style={{ color: activeTheme.phoneText }}>Meu Carrinho</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: color, borderRadius: '99px' }}>2</span>
                </div>

                {/* Itens */}
                <div className="p-3 space-y-2 flex-1 pb-4">
                  {activeTheme.mockProducts.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 shadow-sm" style={{ background: activeTheme.phoneCard, borderRadius: activeTheme.phoneBorderRadius }}>
                      <div className="w-9 h-9 shrink-0 flex items-center justify-center" style={{ background: color + '15', borderRadius: activeTheme.phoneBorderRadius }}>
                        <span className="text-lg">{activeTheme.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold truncate" style={{ color: activeTheme.phoneText }}>{item.name}</p>
                        <p className="text-[9px] font-black mt-0.5" style={{ color }}>{item.price}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-black" style={{ background: activeTheme.phoneCard, color: activeTheme.phoneSubText, border: `1px solid ${activeTheme.phoneSubText}33` }}>−</div>
                        <span className="text-[9px] font-black" style={{ color: activeTheme.phoneText }}>1</span>
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-black text-white shadow-sm" style={{ backgroundColor: color }}>+</div>
                      </div>
                    </div>
                  ))}

                  {/* Subtotal */}
                  <div className="pt-3 border-t mt-4" style={{ borderColor: activeTheme.phoneCard }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-medium" style={{ color: activeTheme.phoneSubText }}>Subtotal</span>
                      <span className="text-[9px] font-bold" style={{ color: activeTheme.phoneText }}>R$ 53,90</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-medium" style={{ color: activeTheme.phoneSubText }}>Entrega</span>
                      <span className="text-[9px] font-bold" style={{ color: activeTheme.phoneText }}>R$ 7,00</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed" style={{ borderColor: activeTheme.phoneCard }}>
                      <span className="text-[11px] font-black" style={{ color: activeTheme.phoneText }}>Total</span>
                      <span className="text-[11px] font-black" style={{ color }}>R$ 60,90</span>
                    </div>
                  </div>
                </div>

                <div className="px-3 pb-3 shrink-0 bg-gradient-to-t from-black/5 to-transparent pt-2">
                  <button
                    type="button"
                    onClick={() => setPreviewScreen('pix')}
                    className="w-full py-2.5 text-white text-[10px] font-black tracking-wide flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-lg"
                    style={{ 
                      backgroundColor: color, 
                      borderRadius: activeTheme.phoneBorderRadius,
                      boxShadow: `0 4px 14px 0 ${color}50`
                    }}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Pagar com PIX
                  </button>
                </div>
              </div>
            )}

            {/* ── TELA PIX ───────────────────────────────────────────── */}
            {previewScreen === 'pix' && (
              <div className="flex-1 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: activeTheme.phoneBg }}>
                {/* Mini header */}
                <div className="w-full px-3 py-3 flex items-center gap-2 border-b shrink-0 sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: activeTheme.phoneCard, background: activeTheme.phoneBg + 'e6' }}>
                  <button type="button" onClick={() => setPreviewScreen('cart')} className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: activeTheme.phoneText }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] font-black flex-1 text-center" style={{ color: activeTheme.phoneText }}>Pagamento PIX</p>
                  <div className="w-4" />
                </div>

                <div className="flex flex-col items-center gap-4 p-4 flex-1 w-full justify-center">
                  {/* QR Code simulado premium */}
                  <div className="relative p-2.5 shadow-lg flex items-center justify-center transition-all hover:scale-[1.02]" style={{ background: activeTheme.phoneBg, borderRadius: activeTheme.phoneBorderRadius }}>
                    <div className="w-24 h-24 relative flex items-center justify-center overflow-hidden" style={{ background: activeTheme.phoneCard, borderRadius: parseInt(activeTheme.phoneBorderRadius) > 8 ? '12px' : activeTheme.phoneBorderRadius }}>
                      <QrCode className="w-16 h-16 opacity-80" strokeWidth={1.5} style={{ color: activeTheme.phoneText }} />
                      <div className="absolute top-0 left-0 w-full h-[1px] shadow-[0_0_8px_1px_currentColor] animate-[pulse_2s_infinite]" style={{ backgroundColor: color, color }} />
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="text-center">
                    <p className="text-[9px] font-medium tracking-widest uppercase opacity-80" style={{ color: activeTheme.phoneSubText }}>Valor a pagar</p>
                    <p className="text-[20px] font-black leading-none mt-1" style={{ color: activeTheme.phoneText }}>R$ 60,90</p>
                  </div>

                  {/* Copiar código */}
                  <button
                    type="button"
                    className="w-full py-2 text-[10px] font-bold border-2 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                    style={{ borderColor: color, color, borderRadius: activeTheme.phoneBorderRadius, background: color + '15' }}
                  >
                    Copiar Código PIX
                  </button>

                  {/* Status */}
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t w-full justify-center" style={{ borderColor: activeTheme.phoneCard }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: '#f59e0b' }} />
                    <p className="text-[9px] font-bold" style={{ color: activeTheme.phoneSubText }}>Aguardando pagamento...</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── TELA PERFIL ────────────────────────────────────────── */}
            {previewScreen === 'profile' && (
              <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: activeTheme.phoneBg }}>
                {/* Header do perfil */}
                <div className="px-3 pt-5 pb-4 flex flex-col items-center gap-2 border-b shrink-0 relative" style={{ borderColor: activeTheme.phoneCard }}>
                  <div className="absolute top-0 left-0 w-full h-1/2 opacity-20" style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }} />
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg relative z-10" style={{ backgroundColor: color }}>J</div>
                  <div className="text-center relative z-10">
                    <p className="text-[12px] font-black" style={{ color: activeTheme.phoneText }}>João Cliente</p>
                    <p className="text-[9px] font-medium" style={{ color: activeTheme.phoneSubText }}>joao@email.com</p>
                  </div>
                </div>

                {/* Card de Informações */}
                <div className="p-3 pb-0 shrink-0">
                   <div className="p-2.5 shadow-sm border" style={{ background: activeTheme.phoneCard, borderRadius: activeTheme.phoneBorderRadius, borderColor: activeTheme.phoneSubText + '15' }}>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: activeTheme.phoneBg }}>
                         <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" style={{ color: activeTheme.phoneText }} />
                         <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold truncate" style={{ color: activeTheme.phoneText }}>Rua das Flores, 123</p>
                            <p className="text-[8px] font-medium truncate" style={{ color: activeTheme.phoneSubText }}>Apto 45 · Centro</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" style={{ color: activeTheme.phoneText }} />
                         <p className="text-[9px] font-bold" style={{ color: activeTheme.phoneText }}>(11) 99999-9999</p>
                      </div>
                   </div>
                </div>

                {/* Últimos pedidos */}
                <div className="p-3 flex-1 pb-4 flex flex-col">
                  <p className="text-[8px] font-black uppercase tracking-widest mb-2 px-1" style={{ color: activeTheme.phoneSubText }}>Últimos Pedidos</p>
                  {[
                    { id: '#1042', status: 'Entregue', statusColor: '#10b981', items: '3 itens' },
                    { id: '#1038', status: 'Entregue', statusColor: '#10b981', items: '2 itens' },
                  ].map(order => (
                    <div key={order.id} className="flex items-center gap-2 p-2.5 mb-2 shadow-sm" style={{ background: activeTheme.phoneCard, borderRadius: activeTheme.phoneBorderRadius }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black text-white" style={{ backgroundColor: color }}>{activeTheme.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black" style={{ color: activeTheme.phoneText }}>Pedido {order.id}</p>
                        <p className="text-[8px] font-medium opacity-80" style={{ color: activeTheme.phoneSubText }}>{order.items} · {storeName}</p>
                      </div>
                      <span className="text-[7px] font-black px-2 py-0.5 rounded-sm text-white" style={{ backgroundColor: order.statusColor }}>{order.status}</span>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="w-full mt-4 py-2.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-transform active:scale-95 border-2 hover:bg-slate-500/5"
                    style={{ borderColor: activeTheme.phoneSubText + '33', color: activeTheme.phoneText, borderRadius: activeTheme.phoneBorderRadius }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair da Conta
                  </button>
                </div>
              </div>
            )}

            {/* ── BOTTOM NAV ─────────────────────────────────────────── */}
            <div
              className="flex items-center justify-around px-2 pb-2 pt-2 border-t shrink-0 relative z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]"
              style={{ background: activeTheme.phoneBg, borderColor: activeTheme.phoneCard }}
            >
              {([
                { screen: 'home', icon: Home, label: 'Início' },
                { screen: 'cart', icon: ShoppingCart, label: 'Carrinho' },
                { screen: 'profile', icon: User, label: 'Conta' },
              ] as const).map(({ screen, icon: Icon, label }) => {
                const isActive = previewScreen === screen || (screen === 'cart' && previewScreen === 'pix')
                return (
                  <button
                    key={screen}
                    type="button"
                    onClick={() => setPreviewScreen(screen)}
                    className="flex flex-col items-center gap-1 transition-all flex-1 py-1 group"
                  >
                    <Icon 
                      className="w-4 h-4 transition-transform group-hover:scale-110" 
                      style={{ 
                        color: isActive ? color : activeTheme.phoneSubText,
                        strokeWidth: isActive ? 2.5 : 2
                      }} 
                    />
                    <span
                      className={`text-[8px] transition-colors ${isActive ? 'font-black' : 'font-semibold'}`}
                      style={{ color: isActive ? color : activeTheme.phoneSubText }}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium max-w-[180px] leading-relaxed">
            Tema: <strong className="text-slate-600">{activeTheme.name}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
