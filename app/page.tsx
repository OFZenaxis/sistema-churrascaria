import { Suspense } from 'react'
import MenuComponent, { Product } from '@/components/MenuComponent'
import MenuSkeleton from '@/components/MenuSkeleton'
import { prisma } from '@/lib/prisma'

async function LiveMenu() {
  const [dbProducts, storeSettings] = await Promise.all([
    prisma.product.findMany({ orderBy: { type: 'asc' } }),
    prisma.storeSettings.findUnique({ where: { id: 'singleton' } })
  ])

  const products: Product[] = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    type: p.type as 'CUT' | 'SIDE' | 'BEVERAGE' | 'COMBO',
    maxSides: p.maxSides,
    categoryId: p.categoryId,
    isActive: p.isActive,
  }))

  const isStoreOpen = storeSettings?.isOpen ?? true

  return <MenuComponent products={products} isStoreOpen={isStoreOpen} />
}

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center py-16 bg-gradient-to-b from-[#111] to-[#0a0a0a] rounded-3xl border border-zinc-800 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-orange-900/10 blur-3xl rounded-full translate-y-12" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
            A Experiência Premium da <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Brasa</span> na Sua Casa.
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Cortes selecionados, fogo no ponto exato e entrega com frota própria para garantir a máxima qualidade.
          </p>
        </div>
      </section>

      <section>
        <Suspense fallback={<MenuSkeleton />}>
          <LiveMenu />
        </Suspense>
      </section>
    </div>
  )
}
