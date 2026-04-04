import { getSessionUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { getTheme } from '@/lib/themes'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const isDomain = slug.includes('.')

  const store = await prisma.store.findFirst({
    where: isDomain ? { customDomain: slug } : { slug },
    select: { id: true, brandColor: true, themeId: true }
  })

  if (!store) notFound()

  const user = await getSessionUser(store.id)
  if (!user) redirect(`/${slug}`)

  const activeOrders = await prisma.order.findMany({
    where: { customerId: user.id, storeId: store.id },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const theme = getTheme(store.themeId)
  const brandColor = store.brandColor ?? theme.phoneAccent

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
      <div
        className="max-w-md mx-auto min-h-screen shadow-2xl flex flex-col"
        style={{ background: theme.phoneBg }}
      >
        <OrdersClient
          orders={activeOrders as any}
          slug={slug}
          storeId={store.id}
          storeTheme={storeTheme}
          user={{ name: user.name, phone: user.phone }}
        />
      </div>
    </div>
  )
}
