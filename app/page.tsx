import { Suspense } from 'react'
import Image from 'next/image'
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
    imageUrl: p.imageUrl,
  }))

  const isStoreOpen = storeSettings?.isOpen ?? true

  return <MenuComponent products={products} isStoreOpen={isStoreOpen} />
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black pb-nav">

      {/* ── HERO ── */}
      <header className="relative overflow-hidden bg-black pt-4 pb-2 px-4 text-center">
        {/* Glow decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-48 rounded-full bg-red-700/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto animate-fade-up">
          {/* Badge institucional */}
          <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1 mb-3">
            <span className="text-red-500 text-[10px]">🔥</span>
            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
              A Pioneira
            </span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-2 mt-1">
            <Image 
              src="/logochurrascaria.svg" 
              alt="Logo Churrascaria Costa e Souza" 
              width={200} 
              height={80}
              priority
              style={{ width: 'auto', height: '80px' }}
              className="object-contain"
            />
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.16em] mb-3">
            Churrascaria · Luziânia · GO
          </p>

          <p className="text-zinc-400 text-xs hidden sm:block leading-relaxed max-w-xs mx-auto">
            Sabor e Tradição desde o início.<br/>
            <span className="text-zinc-500">Carnes na brasa, entregues na sua porta.</span>
          </p>
        </div>
      </header>

      {/* ── MENU ── */}
      <main className="px-0">
        <Suspense fallback={<MenuSkeleton />}>
          <LiveMenu />
        </Suspense>
      </main>
    </div>
  )
}
