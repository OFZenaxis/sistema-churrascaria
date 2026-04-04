import { Suspense } from 'react'
import Image from 'next/image'
import MenuComponent, { Product } from '@/components/MenuComponent'
import MenuSkeleton from '@/components/MenuSkeleton'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { tenantWhere } from '@/lib/tenant'
import { getTheme } from '@/lib/themes'
import { getSessionUser } from '@/app/actions/auth'

async function LiveMenu({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug)
  })

  if (!store) notFound()

  const user = await getSessionUser(store.id)
  const theme = getTheme(store.themeId)
  const brandColor = store.brandColor ?? theme.phoneAccent

  const dbProducts = await prisma.product.findMany({
    where: { storeId: store.id, isActive: true },
    include: { category: true },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
  })

  const products: Product[] = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    maxSides: p.maxSides,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? 'Outros',
    isActive: p.isActive,
    imageUrl: p.imageUrl,
  }))

  const storeTheme = {
    brandColor,
    phoneBg: theme.phoneBg,
    phoneCard: theme.phoneCard,
    phoneText: theme.phoneText,
    phoneSubText: theme.phoneSubText,
    phoneBorderRadius: theme.phoneBorderRadius,
    layoutStyle: theme.layoutStyle,
    fontFamily: theme.fontFamily,
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* App shell: max-w-md centrado, container rígido estilo app mobile */}
      <div
        className="max-w-md mx-auto h-screen flex flex-col overflow-hidden shadow-2xl"
        style={{ background: theme.phoneBg }}
      >
        {/* ── HERO ── */}
        <header className="relative w-full overflow-hidden shrink-0 pt-10 pb-6 px-4 text-center">
          {store.coverImageUrl ? (
            <div className="absolute inset-0 z-0">
              <Image src={store.coverImageUrl} alt="Banner" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-black/55" />
            </div>
          ) : (
            <div
              className="absolute inset-0 z-0"
              style={{ background: `linear-gradient(135deg, ${brandColor}dd 0%, ${brandColor}66 100%)` }}
            />
          )}

          <div className="relative z-10 flex flex-col items-center animate-fade-up">
            <div className="w-24 h-24 mb-3 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center relative shrink-0">
              {store.logoUrl ? (
                <Image
                  src={store.logoUrl}
                  alt={`Logo ${store.name}`}
                  fill
                  sizes="100px"
                  className="object-contain p-1"
                  priority
                />
              ) : (
                <span className="text-4xl font-black uppercase" style={{ color: brandColor }}>
                  {store.name.substring(0, 1)}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-sm">
              {store.name}
            </h1>

            {store.tagline && (
              <p className="text-white/80 font-medium text-sm mb-3 drop-shadow-sm max-w-[280px] leading-snug mx-auto">
                {store.tagline}
              </p>
            )}

            {store.city && (
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 pb-1.5 rounded-full border border-white/10 shadow-sm mt-1">
                <span className="text-xs">📍</span>
                <p className="text-[11px] text-white font-bold tracking-wider uppercase mt-[1px]">
                  {store.city}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* ── MENU ── */}
        <main className="flex-1 flex flex-col min-h-0">
          <MenuComponent
            products={products}
            isStoreOpen={store.isOpen}
            storeId={store.id}
            slug={slug}
            storeTheme={storeTheme}
            isLoggedIn={!!user}
            logoUrl={store.logoUrl}
          />
        </main>
      </div>
    </div>
  )
}

export default function Home({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <LiveMenu params={params} />
    </Suspense>
  )
}
