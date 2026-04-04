import { prisma } from '@/lib/prisma'
import { getLojistaSession } from '@/app/actions/adminAuth'
import { redirect, notFound } from 'next/navigation'
import { AdminLayoutWrapper } from './AdminLayoutWrapper'
import { tenantWhere } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Resolve o tenant primeiro — necessário para isolar o cookie correto
  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { id: true, slug: true, name: true, logoUrl: true, kitchenPin: true }
  })
  if (!store) notFound()

  // 🔒 Lê o cookie isolado deste tenant específico
  // try/catch garante redirect elegante mesmo se o cookie store ou HMAC lançar exceção (W-06)
  let session: Awaited<ReturnType<typeof getLojistaSession>> = null
  try {
    session = await getLojistaSession(store.id)
  } catch {
    redirect(`/${slug}/admin/login`)
  }
  if (!session || session.storeId !== store.id) {
    redirect(`/${slug}/admin/login`)
  }

  return (
    <AdminLayoutWrapper
      slug={store.slug}
      storeId={store.id}
      storeName={store.name}
      logoUrl={store.logoUrl}
      kitchenPin={store.kitchenPin ?? null}
    >
      {children}
    </AdminLayoutWrapper>
  )
}
