export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-pulse">

      {/* ── Header row ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-xl" />
          <div className="h-4 w-32 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 bg-slate-100 rounded-xl" />
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-100 rounded-lg" />
              <div className="h-9 w-9 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-8 w-28 bg-slate-200 rounded-xl" />
            <div className="h-3 w-16 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>

      {/* ── Chart ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-slate-200 rounded-xl" />
          <div className="h-5 w-20 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-48 w-full bg-slate-100 rounded-2xl" />
      </div>

      {/* ── Table / list ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
        <div className="h-5 w-36 bg-slate-200 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
              <div className="h-4 w-24 bg-slate-200 rounded-lg" />
              <div className="h-4 flex-1 bg-slate-100 rounded-lg" />
              <div className="h-6 w-16 bg-slate-100 rounded-xl" />
              <div className="h-4 w-20 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
