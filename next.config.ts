import type { NextConfig } from "next";

// BUG-063: deriva o hostname do Supabase a partir da variável de ambiente em vez de hardcodar o project ref
function getSupabaseHostname(): string {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url) return new URL(url).hostname
  } catch {}
  return 'rbnzcxbzrivevteiooad.supabase.co'
}

const nextConfig: NextConfig = {
  transpilePackages: ['mapbox-gl', 'react-map-gl', '@vis.gl/react-mapbox'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: getSupabaseHostname(),
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    
    return [
      {
        // Assets estáticos (JS, CSS, imagens, fontes) = CACHE LONGO
        // Esses arquivos já tem hash no filename, são imutáveis
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Imagens public (icons, logo)
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // HTML e APIs = Sem cache (sempre buscar versão fresca)
        source: '/((?!_next/static|icons).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ]
  }
};

export default nextConfig;
