import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { tenantWhere } from '@/lib/tenant'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params

  const store = await prisma.store.findFirst({
    where: tenantWhere(slug),
    select: { name: true, tagline: true, coverImageUrl: true, logoUrl: true },
  })

  if (!store) {
    return { title: 'Loja não encontrada' }
  }

  const description = store.tagline ?? 'Faça seu pedido online com rapidez e praticidade.'

  const imageUrl = store.coverImageUrl ?? store.logoUrl ?? null

  return {
    title: store.name,
    description,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: store.name,
    },
    openGraph: {
      title: store.name,
      description,
      type: 'website',
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <div className="antialiased">
        {children}
      </div>
    </>
  )
}
