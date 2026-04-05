"use client"

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bug, Map, Rocket, CheckCircle, Circle, AlertTriangle, Megaphone } from 'lucide-react'

type Tab = 'bugs' | 'roadmap' | 'marketing' | 'map'

interface TabDef {
  id: Tab
  label: string
  shortLabel: string
  icon: React.ReactNode
  accent: string
  borderActive: string
  textActive: string
}

const TABS: TabDef[] = [
  {
    id: 'bugs',
    label: 'Bug Tracker',
    shortLabel: 'Bugs',
    icon: <Bug className="w-4 h-4" />,
    accent: 'from-red-500/20 to-transparent',
    borderActive: 'border-red-500',
    textActive: 'text-red-400',
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    shortLabel: 'Roadmap',
    icon: <Rocket className="w-4 h-4" />,
    accent: 'from-violet-500/20 to-transparent',
    borderActive: 'border-violet-500',
    textActive: 'text-violet-400',
  },
  {
    id: 'marketing',
    label: 'Marketing & Vendas',
    shortLabel: 'Vendas',
    icon: <Megaphone className="w-4 h-4" />,
    accent: 'from-pink-500/20 to-transparent',
    borderActive: 'border-pink-500',
    textActive: 'text-pink-400',
  },
  {
    id: 'map',
    label: 'Project Map',
    shortLabel: 'Mapa',
    icon: <Map className="w-4 h-4" />,
    accent: 'from-cyan-500/20 to-transparent',
    borderActive: 'border-cyan-500',
    textActive: 'text-cyan-400',
  },
]

// ── Markdown component overrides ───────────────────────────────────────────────

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-black text-slate-50 mt-8 mb-4 pb-2 border-b border-slate-700 tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-black text-slate-100 mt-7 mb-3 flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 inline-block shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-black text-slate-200 mt-5 mb-2 uppercase tracking-widest">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-slate-400 text-sm leading-relaxed mb-3">{children}</p>
  ),
  a: ({ children, href }) => (
    <a href={href ?? '#'} className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="text-slate-200 font-black">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-slate-300 italic">{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="block bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-amber-300 overflow-x-auto my-3 whitespace-pre">
          {children}
        </code>
      )
    }
    return (
      <code className="bg-slate-800 text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-700">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono text-amber-300">
      {children}
    </pre>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 mb-4 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-4 pl-4 list-decimal marker:text-slate-500">{children}</ol>
  ),
  li: ({ children, node }) => {
    // Detect GFM task list items
    const firstChild = (node as any)?.children?.[0]
    const isTaskItem = firstChild?.tagName === 'input' && firstChild?.properties?.type === 'checkbox'

    if (isTaskItem) {
      const checked = firstChild?.properties?.checked ?? false
      return (
        <li className="flex items-start gap-2.5 text-sm text-slate-400 list-none">
          <span className="shrink-0 mt-0.5">
            {checked
              ? <CheckCircle className="w-4 h-4 text-emerald-500" />
              : <Circle className="w-4 h-4 text-slate-600" />
            }
          </span>
          <span className={`leading-snug ${checked ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-300'}`}>
            {/* Skip the checkbox input element in children */}
            {Array.isArray(children)
              ? children.filter((c: any) => typeof c !== 'object' || c?.props?.type !== 'checkbox')
              : children}
          </span>
        </li>
      )
    }

    return (
      <li className="flex items-start gap-2 text-sm text-slate-400 list-none">
        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
        <span className="leading-snug">{children}</span>
      </li>
    )
  },
  input: () => null, // rendered inside li above
  table: ({ children }) => (
    <div className="overflow-x-auto my-5 rounded-xl border border-slate-700">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800/80">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-800">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-slate-400 text-sm font-mono">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-amber-500/60 pl-4 my-4 bg-amber-500/5 py-2 rounded-r-lg">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-amber-300/80 text-sm">{children}</div>
      </div>
    </blockquote>
  ),
  hr: () => (
    <hr className="my-6 border-slate-800" />
  ),
}

// ── Stat badges extraídos do BUG_TRACKER.md ───────────────────────────────────
// O BUG_TRACKER usa "- **Status:** RESOLVIDO/ABERTO/EM PROGRESSO", não task lists GFM.

function extractBugStats(content: string) {
  const bugs       = (content.match(/^### BUG-\d+/gm) ?? []).length
  const resolved   = (content.match(/- \*\*Status:\*\* RESOLVIDO/g) ?? []).length
  const inProgress = (content.match(/- \*\*Status:\*\* EM PROGRESSO/g) ?? []).length
  const open       = (content.match(/- \*\*Status:\*\* ABERTO/g) ?? []).length
  // Itens legados (C-xx, W-xx, O-xx) da tabela de histórico — todos já resolvidos
  const legacy     = (content.match(/^\|\s*(C|W|O)-\d+/gm) ?? []).length
  return { total: bugs + legacy, resolved: resolved + legacy, open, inProgress }
}

// Conta bugs por nível de severidade (parseia seções ## do markdown)
function extractSeverityStats(content: string) {
  const counts = { critico: 0, alto: 0, medio: 0, baixo: 0 }
  // Divide pelo marcador de seção H2
  const sections = content.split(/\n## /)
  for (const sec of sections) {
    const bugs = (sec.match(/^### BUG-\d+/gm) ?? []).length
    if (sec.startsWith('🔴'))      counts.critico += bugs
    else if (sec.startsWith('🟠')) counts.alto    += bugs
    else if (sec.startsWith('🟡')) counts.medio   += bugs
    else if (sec.startsWith('🟢')) counts.baixo   += bugs
  }
  return counts
}

// ── Main tabs component ────────────────────────────────────────────────────────

export default function DevTabs({
  bugContent,
  roadmapContent,
  mapContent,
  marketingContent,
}: {
  bugContent: string
  roadmapContent: string
  mapContent: string
  marketingContent: string
}) {
  const [active, setActive] = useState<Tab>('bugs')
  const stats   = extractBugStats(bugContent)
  const sev     = extractSeverityStats(bugContent)
  const pct     = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
  const allDone = stats.open === 0 && stats.inProgress === 0

  const contentMap: Record<Tab, string> = {
    bugs:      bugContent,
    roadmap:   roadmapContent,
    marketing: marketingContent,
    map:       mapContent,
  }

  const activeTab = TABS.find(t => t.id === active)!

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-slate-900/60 border-b border-slate-800">

        {/* Deploy-ready banner — só aparece quando tudo está resolvido */}
        {allDone && (
          <div className="flex items-center justify-center gap-3 px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
            <span className="text-emerald-400 text-sm">🚀</span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              Deploy Ready — Bug Tracker zerado com {stats.total} bugs resolvidos
            </span>
            <span className="text-emerald-400 text-sm">🏆</span>
          </div>
        )}

        {/* Linha de métricas */}
        <div className="flex items-center gap-5 px-6 py-2.5 flex-wrap">

          {/* Progresso geral */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">
              {stats.resolved}/{stats.total} resolvidos
            </span>
            {/* Barra de progresso */}
            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-black text-emerald-500">{pct}%</span>
          </div>

          <div className="h-4 w-px bg-slate-700 shrink-0" />

          {/* Badge status */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            allDone
              ? 'bg-emerald-500/20 text-emerald-400'
              : stats.open > 0
              ? 'bg-red-500/20 text-red-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {allDone
              ? '✓ Zero dívida técnica'
              : stats.inProgress > 0
              ? `${stats.inProgress} em progresso`
              : `${stats.open} em aberto`}
          </span>

          <div className="h-4 w-px bg-slate-700 shrink-0" />

          {/* Breakdown por severidade */}
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span title="Críticos" className="flex items-center gap-1">
              <span>🔴</span>
              <span className="text-slate-400">{sev.critico}</span>
            </span>
            <span title="Altos" className="flex items-center gap-1">
              <span>🟠</span>
              <span className="text-slate-400">{sev.alto}</span>
            </span>
            <span title="Médios" className="flex items-center gap-1">
              <span>🟡</span>
              <span className="text-slate-400">{sev.medio}</span>
            </span>
            <span title="Baixos" className="flex items-center gap-1">
              <span>🟢</span>
              <span className="text-slate-400">{sev.baixo}</span>
            </span>
          </div>

          <div className="ml-auto text-[10px] text-slate-600 font-mono whitespace-nowrap">
            {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div className="shrink-0 flex border-b border-slate-800 bg-slate-950/80">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-bold transition-all ${
              active === tab.id
                ? `${tab.textActive} bg-slate-900/60`
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {/* Active underline */}
            {active === tab.id && (
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.borderActive} bg-current`} />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Gradient accent stripe */}
        <div className={`h-1 w-full bg-gradient-to-r ${activeTab.accent} opacity-60`} />

        <div className="max-w-4xl mx-auto px-6 py-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {contentMap[active]}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
