import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect, notFound } from 'next/navigation'
import ZonasClient from './ZonasClient'
import { tenantWhere } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function EntregasPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: {
      id: true,
      storeAddress: true,
      storeLat: true,
      storeLng: true,
      baseDeliveryFee: true,
      deliveryFeePerKm: true,
      maxDeliveryRadius: true,
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
        <h1 className="text-2xl font-black text-slate-900">Configurações de Entrega</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Precificação dinâmica por distância — calculada em tempo real via Mapbox Directions.
        </p>
      </div>

      <ZonasClient
        storeId={store.id}
        initial={{
          storeAddress: store.storeAddress ?? '',
          storeLat: store.storeLat ?? null,
          storeLng: store.storeLng ?? null,
          baseDeliveryFee: store.baseDeliveryFee,
          deliveryFeePerKm: store.deliveryFeePerKm,
          maxDeliveryRadius: store.maxDeliveryRadius,
        }}
      />
    </div>
  )
}
