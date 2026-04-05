import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import DevTabs from '@/components/dev/DevTabs'
import { Terminal, Zap, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Torre de Controle — Saiu Delivery',
  robots: 'noindex, nofollow',
}

function readDoc(filename: string): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), 'docs', filename),
      'utf-8'
    )
  } catch {
    return `# ${filename}\n\n> Arquivo não encontrado em \`docs/${filename}\`.`
  }
}

export default function DevPortalPage() {
  // 🔒 TRAVA DE SEGURANÇA — Esta rota NUNCA pode ser acessada em produção
  if (process.env.NODE_ENV !== 'development') notFound()

  const bugContent       = readDoc('BUG_TRACKER.md')
  const roadmapContent   = readDoc('ROADMAP.md')
  const mapContent       = readDoc('PROJECT_MAP.md')
  const marketingContent = readDoc('MARKETING_ROADMAP.md')

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden font-mono">

      {/* ── CRT scanline overlay ─────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-lg shadow-black/50">

        {/* Left — Logo + title */}
        <div className="flex items-center gap-4">
          {/* Terminal icon with green glow */}
          <div className="relative">
            <div className="w-9 h-9 bg-emerald-950 border border-emerald-700/60 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            {/* Pulse ring */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-60" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-100 tracking-tight">
                Torre de Controle
              </h1>
              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-emerald-400 font-bold">Saiu Delivery</span>
            </div>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5 tracking-wider">
              /dev · Governança de Engenharia em Tempo Real
            </p>
          </div>
        </div>

        {/* Center — Env badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-red-950/60 border border-red-800/60 rounded-xl shadow-[0_0_16px_rgba(239,68,68,0.15)]">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">
            Ambiente de Desenvolvedor
          </span>
        </div>

        {/* Right — meta info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-slate-600 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>NODE_ENV=development</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-600 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Hot reload ativo</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
            <span className="text-[10px] font-mono text-slate-500">localhost:3000</span>
          </div>
        </div>
      </header>

      {/* ── System status bar ────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-0 bg-slate-950 border-b border-slate-800/60 overflow-hidden">
        {[
          { label: 'Prisma', status: 'online', color: 'text-emerald-400' },
          { label: 'Supabase', status: 'online', color: 'text-emerald-400' },
          { label: 'MercadoPago', status: 'sandbox', color: 'text-amber-400' },
          { label: 'Next.js', status: '16.2.1', color: 'text-cyan-400' },
          { label: 'TypeScript', status: 'strict', color: 'text-blue-400' },
          { label: 'Mapbox', status: 'configured', color: 'text-violet-400' },
        ].map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono border-r border-slate-800/60 ${
              i === 0 ? 'border-l border-slate-800/60' : ''
            }`}
          >
            <span className="text-slate-600">{item.label}</span>
            <span className="text-slate-700">→</span>
            <span className={`font-black ${item.color}`}>{item.status}</span>
          </div>
        ))}

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden flex items-center px-4">
          <span className="text-[10px] text-slate-700 font-mono whitespace-nowrap animate-[marquee_30s_linear_infinite]">
            SaaS Multi-Tenant · Isolamento por storeId · HMAC-SHA256 · RLS Supabase · Prisma ORM · Next.js App Router · Server Components · Framer Motion · Recharts · Lucide React · Tailwind CSS
          </span>
        </div>
      </div>

      {/* ── Tabs + Content (fills remaining height) ──────────────── */}
      <div className="flex-1 min-h-0">
        <DevTabs
          bugContent={bugContent}
          roadmapContent={roadmapContent}
          mapContent={mapContent}
          marketingContent={marketingContent}
        />
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="shrink-0 flex items-center justify-between px-6 py-2 bg-slate-900/80 border-t border-slate-800 text-[10px] font-mono text-slate-700">
        <span>© Saiu Delivery · Todos os direitos reservados</span>
        <span>Esta rota retorna 404 em produção · process.env.NODE_ENV !== &apos;development&apos;</span>
        <span>Build: {new Date().toISOString().split('T')[0]}</span>
      </footer>
    </div>
  )
}
