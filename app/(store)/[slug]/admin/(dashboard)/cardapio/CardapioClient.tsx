"use client"

import React, { useState, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Loader2,
  X,
  Image as ImageIcon,
  Tag,
  Trash2,
  Upload,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { toggleProductActive, saveProduct, createCategory, deleteCategory } from '@/app/actions/admin'
import { uploadImage } from '@/lib/upload'
import { useRouter } from 'next/navigation'

export type AdminProduct = {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  isActive: boolean
  imageUrl: string | null
}

export type Category = {
  id: string
  name: string
}

export default function CardapioClient({
  storeId,
  products,
  categories: initialCategories,
}: {
  storeId: string
  products: AdminProduct[]
  categories: Category[]
}) {
  const router = useRouter()

  // ── Product modal state ─────────────────────────────────────────
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // ── Filter state ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // ── Category modal state ────────────────────────────────────────
  const [localCategories, setLocalCategories] = useState<Category[]>(initialCategories)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState('')

  const emptyProduct = (): Partial<AdminProduct> => ({
    name: '',
    description: '',
    price: 0,
    categoryId: localCategories[0]?.id || '',
    imageUrl: '',
  })

  const [editingProduct, setEditingProduct] = useState<Partial<AdminProduct>>(emptyProduct())
  // String separada para o input de preço — evita o "sticky zero" do type="number"
  const [priceInput, setPriceInput] = useState('')

  // Sorted once — used by both selects
  const sortedCategories = [...localCategories].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  )

  // ── Product handlers ────────────────────────────────────────────
  const openNew = () => {
    setEditingProduct(emptyProduct())
    setPriceInput('')
    setIsProductModalOpen(true)
  }

  const openEdit = (p: AdminProduct) => {
    setEditingProduct({ ...p })
    setPriceInput(p.price > 0 ? String(p.price) : '')
    setIsProductModalOpen(true)
  }

  const handleToggle = async (id: string, current: boolean) => {
    setLoadingId(id)
    const res = await toggleProductActive(id, current, storeId)
    setLoadingId(null)
    if (res.success) router.refresh()
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await uploadImage(file, storeId)
      setEditingProduct(prev => ({ ...prev, imageUrl: url }))
    } catch (err) {
      alert('Erro ao fazer upload da imagem. Verifique as configurações do Supabase.')
      console.error(err)
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(priceInput.replace(',', '.')) || 0
    setIsSavingProduct(true)
    const res = await saveProduct({ ...(editingProduct as any), price, storeId })
    setIsSavingProduct(false)
    if (res.success) {
      setIsProductModalOpen(false)
      router.refresh()
    } else {
      alert(res.error || 'Erro ao salvar produto.')
    }
  }

  // ── Category handlers ───────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setIsSavingCategory(true)
    setCategoryError('')
    const res = await createCategory(newCategoryName, storeId)
    setIsSavingCategory(false)
    if (res.success && res.category) {
      setLocalCategories(prev => [...prev, res.category!])
      setNewCategoryName('')
      router.refresh()
    } else {
      setCategoryError(res.error || 'Erro ao criar categoria.')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategoryId(id)
    setCategoryError('')
    const res = await deleteCategory(id, storeId)
    setDeletingCategoryId(null)
    if (res.success) {
      setLocalCategories(prev => prev.filter(c => c.id !== id))
      router.refresh()
    } else {
      setCategoryError(res.error || 'Erro ao deletar categoria.')
    }
  }

  const inputClass = "w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"

  // O-01: useMemo evita re-filtrar toda a lista a cada render não relacionado ao filtro
  const filteredProducts = useMemo(() =>
    products.filter(p => {
      const matchesSearch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'ALL' || p.categoryId === categoryFilter
      return matchesSearch && matchesCategory
    }),
    [products, searchTerm, categoryFilter]
  )

  // ── Options arrays ──────────────────────────────────────────────
  const filterOptions: SelectOption[] = [
    { id: 'ALL', name: 'Todas as categorias' },
    ...sortedCategories,
  ]

  return (
    <>
      {/* ── Header row ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Cardápio</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            {products.length} {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'} · {localCategories.length} {localCategories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setCategoryError(''); setIsCategoryModalOpen(true) }}
            className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm px-5 py-3 rounded-xl transition-all"
          >
            <Tag className="w-4 h-4 shrink-0" />
            Gerenciar Categorias
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 hover:-translate-y-0.5 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-5 h-5 shrink-0" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* ── Search / Filter toolbar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Busca por nome */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Filtro por categoria — custom select */}
        <div className="sm:w-56">
          <CategorySelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={filterOptions}
            compact
          />
        </div>
      </div>

      {/* ── Product list ─────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            {products.length === 0 ? (
              <>
                <p className="text-slate-500 font-bold text-lg mb-1">Vitrine Vazia</p>
                <p className="text-sm text-slate-400 font-medium">Bora cadastrar seu primeiro produto no catálogo?</p>
              </>
            ) : (
              <>
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold text-base mb-1">Nenhum produto encontrado</p>
                <p className="text-sm text-slate-400 font-medium">Tente outro termo ou categoria.</p>
              </>
            )}
          </div>
        )}
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-2xl border transition-all hover:shadow-md gap-4 sm:gap-0 ${
              product.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-200/50 bg-slate-50/50 opacity-80'
            }`}
          >
            <div className="flex items-center gap-5">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-black text-lg ${product.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {product.name}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {localCategories.find(c => c.id === product.categoryId)?.name ?? '—'}
                  </span>
                </div>
                {product.description && (
                  <p className="text-sm text-slate-500 line-clamp-1 mb-1.5 max-w-xs md:max-w-md font-medium">
                    {product.description}
                  </p>
                )}
                <span className={`font-black text-sm ${product.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                  R$ {product.price.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 sm:ml-4">
              <button
                onClick={() => handleToggle(product.id, product.isActive)}
                disabled={loadingId === product.id}
                title={product.isActive ? 'Desativar Produto' : 'Ativar Produto'}
                className={`relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 ${
                  product.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                {loadingId === product.id ? (
                  <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white animate-spin z-10" />
                ) : null}
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    product.isActive ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>

              <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1" />

              <button
                onClick={() => openEdit(product)}
                className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors group flex items-center gap-2 bg-slate-50 sm:bg-transparent"
              >
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold sm:hidden">Editar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Product Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full max-w-xl rounded-3xl border border-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingProduct.id ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-8 overflow-y-auto space-y-5">

                {/* ── Foto do Produto ── */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Foto do Produto</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {isUploadingImage ? (
                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                      ) : editingProduct.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editingProduct.imageUrl} className="w-full h-full object-cover" alt="preview" />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => imageInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingImage
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                          : <><Upload className="w-4 h-4" /> Selecionar Foto</>}
                      </button>
                      {editingProduct.imageUrl && !isUploadingImage && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct(prev => ({ ...prev, imageUrl: '' }))}
                          className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors text-left"
                        >
                          Remover foto
                        </button>
                      )}
                      <p className="text-xs text-slate-400 font-medium">JPG, PNG ou WebP · max 5MB</p>
                    </div>
                  </div>
                </div>

                <ModalField label="Nome do Produto">
                  <input
                    required
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ex: Picanha Premium"
                    className={inputClass + ' font-bold text-slate-900'}
                  />
                </ModalField>

                {/* Preço + Categoria na mesma linha */}
                <div className="grid grid-cols-2 gap-4">
                  <ModalField label="Preço (R$)">
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={priceInput}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9.,]/g, '')
                        const cleaned = raw.replace(/^0+(\d)/, '$1')
                        setPriceInput(cleaned)
                      }}
                      onBlur={() => {
                        const num = parseFloat(priceInput.replace(',', '.'))
                        if (!isNaN(num)) setPriceInput(num.toFixed(2).replace('.', ','))
                        else if (priceInput !== '') setPriceInput('')
                      }}
                      className={inputClass + ' font-black text-emerald-600 text-base'}
                    />
                  </ModalField>

                  <ModalField label="Categoria">
                    {localCategories.length === 0 ? (
                      <div className={inputClass + ' text-slate-400 flex items-center'}>
                        Nenhuma categoria
                      </div>
                    ) : (
                      <CategorySelect
                        value={editingProduct.categoryId || ''}
                        onChange={id => setEditingProduct({ ...editingProduct, categoryId: id })}
                        options={sortedCategories}
                      />
                    )}
                  </ModalField>
                </div>

                <ModalField label="Descrição">
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Detalhes deliciosos sobre o produto..."
                    className={inputClass + ' font-medium text-slate-700 resize-none'}
                  />
                </ModalField>

                <div className="flex gap-4 pt-4 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-[1] border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
                  >
                    {isSavingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar no Cardápio'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCategoryModalOpen(false)}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-3xl border border-white shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Gerenciar Categorias</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Organize o cardápio da sua loja</p>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pt-5 pb-4 border-b border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nova Categoria
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => { setNewCategoryName(e.target.value); setCategoryError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
                    placeholder="Ex: Carnes, Bebidas, Combos..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-slate-50 focus:bg-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={isSavingCategory || !newCategoryName.trim()}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm px-5 rounded-xl transition-colors shrink-0"
                  >
                    {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Adicionar
                  </button>
                </div>
                {categoryError && (
                  <p className="text-red-500 text-xs font-semibold mt-2">{categoryError}</p>
                )}
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-4">
                {localCategories.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm font-medium py-8">
                    Nenhuma categoria criada ainda.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {localCategories.map(cat => (
                      <li
                        key={cat.id}
                        className="flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                            <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={deletingCategoryId === cat.id}
                          title="Deletar categoria"
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          {deletingCategoryId === cat.id
                            ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-full border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl hover:bg-slate-50 transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      {children}
    </div>
  )
}

// ── CategorySelect — custom Listbox sem select nativo ────────────────────────

type SelectOption = { id: string; name: string }

function CategorySelect({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: string
  onChange: (id: string) => void
  options: SelectOption[]
  compact?: boolean
}) {
  const selected = options.find(o => o.id === value) ?? options[0]

  const triggerClass = compact
    ? 'w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all'
    : 'w-full flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all'

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton className={triggerClass}>
          <span className="truncate">{selected?.name ?? 'Selecione...'}</span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom start"
          className="z-[300] w-[var(--button-width)] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden focus:outline-none"
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map(opt => (
              <ListboxOption key={opt.id} value={opt.id}>
                {({ focus, selected }) => (
                  <div
                    className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors ${
                      focus ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <span className={selected ? 'text-emerald-700 font-bold' : 'text-slate-700 font-medium'}>
                      {opt.name}
                    </span>
                    {selected && <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />}
                  </div>
                )}
              </ListboxOption>
            ))}
          </div>
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
