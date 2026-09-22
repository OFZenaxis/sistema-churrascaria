import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect, notFound } from 'next/navigation'
import { tenantWhere } from '@/lib/tenant'
import { adminPath } from '@/lib/adminPath'
import PaymentConfigClient from './PaymentConfigClient'

export const dynamic = 'force-dynamic'

export default async function PagamentosConfigPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true }
  })
  if (!store) notFound()

  const session = await getLojistaSession(store.id)
  if (!session || session.storeId !== store.id) redirect(adminPath(slug, '/admin/login'))

  const config = await prisma.storePaymentConfig.findUnique({
    where: { storeId: store.id },
    select: { mpPublicKey: true, mpAccessToken: true }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Pagamentos Online</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure as credenciais do Mercado Pago para receber pagamentos via Pix e cartão.
        </p>
      </div>

      <PaymentConfigClient
        initial={{
          mpPublicKey: config?.mpPublicKey ?? '',
          hasAccessToken: !!config?.mpAccessToken,
        }}
      />
    </div>
  )
}
