import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect, notFound } from 'next/navigation'
import { tenantWhere } from '@/lib/tenant'
import { adminPath } from '@/lib/adminPath'
import ThemeClient from './ThemeClient'

export const dynamic = 'force-dynamic'

export default async function PersonalizacaoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true, name: true, brandColor: true, themeId: true, coverImageUrl: true },
  })
  if (!store) notFound()

  const session = await getLojistaSession(store.id)
  if (!session || session.storeId !== store.id) redirect(adminPath(slug, '/admin/login'))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Personalização</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Defina a cor da marca e a imagem de capa da sua vitrine pública.
        </p>
      </div>

      <ThemeClient
        storeName={store.name}
        initial={{
          brandColor: store.brandColor ?? '#10b981',
          themeId: store.themeId ?? 'classic-light',
          coverImageUrl: store.coverImageUrl ?? '',
        }}
      />
    </div>
  )
}
