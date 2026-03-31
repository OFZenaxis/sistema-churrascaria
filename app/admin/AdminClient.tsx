"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, Receipt, Settings, ChefHat, Loader2, Plus, Edit2, X, Image as ImageIcon, Power, QrCode, CreditCard, Banknote } from 'lucide-react'
import { toggleProductActive, saveProduct, toggleStoreStatus } from '../actions/admin'
import { useRouter } from 'next/navigation'

export type AdminProduct = {
  id: string
  name: string
  description: string | null
  price: number
  type: string
  categoryId: string
  isActive?: boolean
  imageUrl: string | null
}

export type Category = {
  id: string
  name: string
}

type AdminClientProps = {
  totalSales: number
  averageTicket: number
  totalOrders: number
  salesByType: Record<string, number>
  salesByPayment: Record<string, number>
  storeIsOpen: boolean
  products: AdminProduct[]
  categories: Category[]
}

const PRODUCT_TYPES = ['CUT', 'SIDE', 'BEVERAGE', 'COMBO']

export default function AdminClient({ totalSales, averageTicket, totalOrders, salesByType, salesByPayment, storeIsOpen, products, categories }: AdminClientProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [storeOpen, setStoreOpen] = useState(storeIsOpen)
  const [togglingStore, setTogglingStore] = useState(false)
  
  const [editingProduct, setEditingProduct] = useState<Partial<AdminProduct>>({
    name: '',
    description: '',
    price: 0,
    type: 'CUT',
    categoryId: categories[0]?.id || '',
    imageUrl: ''
  })

  const openNewProduct = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      type: 'CUT',
      categoryId: categories[0]?.id || '',
      imageUrl: ''
    })
    setIsModalOpen(true)
  }

  const openEditProduct = (prod: AdminProduct) => {
    setEditingProduct({
      ...prod
    })
    setIsModalOpen(true)
  }

  const handleToggle = async (id: string, current: boolean) => {
    setLoadingId(id)
    const res = await toggleProductActive(id, current)
    setLoadingId(null)
    if (res.success) {
      router.refresh()
    } else {
      alert("Erro ao alterar status")
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const res = await saveProduct(editingProduct as any)
    setIsSaving(false)

    if (res.success) {
      setIsModalOpen(false)
      router.refresh()
    } else {
      alert(res.error || 'Erro ao salvar produto.')
    }
  }

  const handleToggleStore = async () => {
    setTogglingStore(true)
    const res = await toggleStoreStatus(storeOpen)
    setTogglingStore(false)
    if (res.success) {
      setStoreOpen(res.isOpen!)
      router.refresh()
    } else {
      alert(res.error || 'Erro ao mudar status da loja.')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] p-4 lg:p-8 pb-24 text-white font-sans">
      
      {/* Header Admin + Toggle de Loja */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 bg-[#111] p-6 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
          <Settings className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="relative z-10 flex-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Admin</h1>
          <p className="text-zinc-400 font-medium">Controle Total da Churrascaria</p>
        </div>
        {/* SWITCH LOJA ABERTA/FECHADA */}
        <button
          onClick={handleToggleStore}
          disabled={togglingStore}
          className={`relative z-10 flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all font-bold ${
            storeOpen
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
              : 'border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
          }`}
        >
          {togglingStore ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Power className="w-6 h-6" />
          )}
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Status da Loja</p>
            <p className="text-lg font-black">{storeOpen ? 'Loja Aberta 🟢' : 'Loja Fechada 🔴'}</p>
          </div>
          {/* Toggle pill */}
          <div className={`w-14 h-7 rounded-full relative transition-colors ${storeOpen ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${storeOpen ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-[#111] border border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between shadow-xl"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Vendas Totais</h3>
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-4xl font-black text-white">R$ {totalSales.toFixed(2)}</p>
        </motion.div>

        <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-[#111] border border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between shadow-xl"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Ticket Médio</h3>
            <Receipt className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-4xl font-black text-white">R$ {averageTicket.toFixed(2)}</p>
        </motion.div>

        <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="bg-[#111] border border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between shadow-xl"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Pedidos Entregues</h3>
            <ChefHat className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-4xl font-black text-white">{totalOrders}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Faturamento por Categoria */}
        <div className="bg-[#111] border border-zinc-800 p-6 rounded-[2rem] shadow-xl">
          <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-800 pb-4">Faturamento por Categoria</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800">
               <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Carnes e Cortes</span>
               <span className="text-emerald-500 font-black text-xl">R$ {salesByType?.CUT?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800">
               <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Acompanhamentos</span>
               <span className="text-orange-400 font-black text-xl">R$ {salesByType?.SIDE?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800">
               <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Bebidas</span>
               <span className="text-blue-400 font-black text-xl">R$ {salesByType?.BEVERAGE?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800">
               <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Combos Especiais</span>
               <span className="text-purple-400 font-black text-xl">R$ {salesByType?.COMBO?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Faturamento por Forma de Pagamento */}
        <div className="bg-[#111] border border-zinc-800 p-6 rounded-[2rem] shadow-xl">
          <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-800 pb-4">Por Forma de Pagamento</h3>
          <div className="space-y-3">
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span className="text-zinc-300 font-bold">Pix</span>
              </div>
              <span className="text-emerald-400 font-black text-xl">R$ {salesByPayment?.PIX?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="text-zinc-300 font-bold">Cartão</span>
              </div>
              <span className="text-blue-400 font-black text-xl">R$ {salesByPayment?.CARD?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-orange-400" />
                <span className="text-zinc-300 font-bold">Dinheiro</span>
              </div>
              <span className="text-orange-400 font-black text-xl">R$ {salesByPayment?.CASH?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gestor de Cardápio */}
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          Gestor de Cardápio
        </h2>
        <button 
          onClick={openNewProduct}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgb(16,185,129,0.3)]"
        >
          <Plus className="w-5 h-5" /> NOVO PRODUTO
        </button>
      </div>
      
      <div className="bg-[#111] border border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl">
        {products.map((product, idx) => (
          <div 
            key={product.id} 
            className={`flex items-center justify-between p-6 hover:bg-[#151515] transition-colors ${idx !== products.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
          >
            <div className="flex items-center gap-4">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-zinc-900 border border-zinc-800" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-bold text-white leading-none">{product.name}</h4>
                  <span className="text-[10px] font-black tracking-widest bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">{product.type}</span>
                </div>
                <span className="text-emerald-500 font-black text-lg">R$ {product.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => openEditProduct(product)}
                className="p-2 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800"
              >
                <Edit2 className="w-5 h-5" />
              </button>

              <button
                 onClick={() => handleToggle(product.id, product.isActive ?? true)}
                 disabled={loadingId === product.id}
                 className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                   product.isActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-zinc-700'
                 }`}
              >
                 {loadingId === product.id ? (
                   <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white animate-spin" />
                 ) : (
                   <span
                     className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                       product.isActive !== false ? 'translate-x-7' : 'translate-x-1'
                     }`}
                   />
                 )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CRUD PRODUTO */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-[#111] w-full max-w-xl rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h3 className="text-2xl font-black text-white">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white bg-[#0a0a0a] p-2 rounded-full border border-zinc-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-5">
                
                {/* Imagem URL */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">URL da Foto</label>
                  <input 
                    type="url"
                    value={editingProduct.imageUrl || ''}
                    onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                    placeholder="https://imgur.com/foto.jpg"
                    className="w-full bg-[#0a0a0a] text-sm border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  {editingProduct.imageUrl && <img src={editingProduct.imageUrl} className="mt-3 h-24 rounded-lg object-cover border border-zinc-800" />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Nome do Produto</label>
                    <input 
                      required
                      type="text"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      placeholder="Ex: Picanha Premium"
                      className="w-full bg-[#0a0a0a] font-bold text-lg border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Preço (R$)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                      className="w-full bg-[#0a0a0a] font-black text-emerald-500 text-lg border border-zinc-800 rounded-xl p-4 focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Tipo</label>
                    <select 
                      value={editingProduct.type}
                      onChange={e => setEditingProduct({...editingProduct, type: e.target.value as any})}
                      className="w-full bg-[#0a0a0a] text-zinc-300 font-bold border border-zinc-800 rounded-xl p-4 focus:border-emerald-500 focus:outline-none transition-all"
                    >
                      {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Categoria</label>
                  <select 
                    value={editingProduct.categoryId}
                    onChange={e => setEditingProduct({...editingProduct, categoryId: e.target.value})}
                    className="w-full bg-[#0a0a0a] text-zinc-300 font-bold border border-zinc-800 rounded-xl p-4 focus:border-emerald-500 focus:outline-none transition-all"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Descrição</label>
                  <textarea 
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    placeholder="Detalhes deliciosos sobre este item..."
                    className="w-full bg-[#0a0a0a] text-sm border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-lg py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-colors flex justify-center items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
