import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [dbProducts, dbCategories, storeSettings, orders] = await Promise.all([
    prisma.product.findMany({
      orderBy: { type: 'asc' }
    }),
    prisma.category.findMany(),
    prisma.storeSettings.findUnique({ where: { id: "singleton" } }),
    prisma.order.findMany({
      where: { 
        status: { not: 'CANCELED' } 
      },
      include: { items: { include: { product: true } } }
    })
  ])

  let totalSales = 0
  let totalOrders = orders.length

  const salesByType: Record<string, number> = { CUT: 0, SIDE: 0, BEVERAGE: 0, COMBO: 0 }
  const salesByPayment: Record<string, number> = { PIX: 0, CARD: 0, CASH: 0 }

  orders.forEach(o => {
    // Apenas pedidos fechados/pagos devem contar pro financeiro, 
    // ou considere todos validos
    totalSales += o.totalAmount
    if (o.paymentMethod) {
      salesByPayment[o.paymentMethod] = (salesByPayment[o.paymentMethod] || 0) + o.totalAmount
    }
    o.items.forEach(i => {
      const pt = i.product.type
      salesByType[pt] = (salesByType[pt] || 0) + (i.unitPrice * i.quantity)
    })
  })

  const averageTicket = totalOrders > 0 ? (totalSales / totalOrders) : 0

  const mappedProducts = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    type: p.type,
    categoryId: p.categoryId,
    isActive: p.isActive,
    imageUrl: p.imageUrl
  }))

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col">
      {/* Admin Navbar */}
      <header className="bg-[#111] border-b border-[#222] px-6 py-4 flex justify-between items-center z-50 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <h1 className="text-xl font-black text-white tracking-widest uppercase">BACKOFFICE</h1>
          <nav className="flex gap-6 mt-2 sm:mt-0">
            <Link href="/admin" className="text-white border-b-2 border-emerald-500 pb-1 font-bold transition text-sm sm:text-base">⚙️ Gestão Loja</Link>
            <Link href="/admin/kds" className="text-zinc-400 hover:text-white pb-1 font-bold transition text-sm sm:text-base">🍳 Cozinha (KDS)</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto">
        <AdminClient 
          totalSales={totalSales}
          averageTicket={averageTicket}
          totalOrders={totalOrders}
          salesByType={salesByType}
          salesByPayment={salesByPayment}
          storeIsOpen={storeSettings?.isOpen ?? true}
          products={mappedProducts}
          categories={dbCategories}
        />
      </main>
    </div>
  )
}
