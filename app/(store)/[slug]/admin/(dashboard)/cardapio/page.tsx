import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect } from 'next/navigation'
import CardapioClient from './CardapioClient'
import { tenantWhere } from '@/lib/tenant'
import { adminPath } from '@/lib/adminPath'

export const dynamic = 'force-dynamic'

export default async function CardapioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true }
  })
  if (!store) redirect(adminPath(slug, '/admin/login'))

  const session = await getLojistaSession(store.id)
  if (!session || session.storeId !== store.id) redirect(adminPath(slug, '/admin/login'))

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
    }),
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { name: 'asc' }
    }),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Cardápio</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerencie os produtos da sua loja</p>
      </div>

      <CardapioClient
        storeId={store.id}
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          categoryId: p.categoryId,
          isActive: p.isActive,
          imageUrl: p.imageUrl,
        }))}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
