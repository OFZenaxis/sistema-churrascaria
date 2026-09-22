import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect, notFound } from 'next/navigation'
import { tenantWhere } from '@/lib/tenant'
import { adminPath } from '@/lib/adminPath'
import WhatsAppConnectClient from './WhatsAppConnectClient'

export const dynamic = 'force-dynamic'

export default async function WhatsAppConfigPage({
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
      whatsappInstance: true,
      whatsappConnected: true,
    },
  })

  if (!store) notFound()

  const session = await getLojistaSession(store.id)
  if (!session || session.storeId !== store.id) redirect(adminPath(slug, '/admin/login'))

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">WhatsApp</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Conecte o numero de WhatsApp da loja para enviar notificacoes automaticas aos clientes.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
        <WhatsAppConnectClient
          storeId={store.id}
          slug={store.slug}
          initialConnected={store.whatsappConnected}
          initialInstance={store.whatsappInstance}
        />
      </div>
    </div>
  )
}
