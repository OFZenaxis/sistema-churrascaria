import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect, notFound } from 'next/navigation'
import StoreSettingsClient from './StoreSettingsClient'
import { tenantWhere } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      city: true,
      phone: true,
      logoUrl: true,
      coverImageUrl: true,
      kitchenPin: true,
    }
  })

  if (!store) notFound()

  const session = await getLojistaSession(store.id)
  if (!session || session.storeId !== store.id) {
    redirect('/admin/login')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Personalize o nome, slogan, cidade e imagens da vitrine pública.
        </p>
      </div>

      <div className="max-w-2xl">
        <StoreSettingsClient
          initial={{
            storeId: store.id,
            slug: store.slug,
            name: store.name ?? '',
            tagline: store.tagline ?? '',
            city: store.city ?? '',
            phone: store.phone ?? '',
            logoUrl: store.logoUrl ?? '',
            coverImageUrl: store.coverImageUrl ?? '',
            // Nunca enviamos o PIN real ao client — máscara fixa se existir
            kitchenPin: store.kitchenPin ? '******' : '',
          }}
        />
      </div>
    </div>
  )
}
