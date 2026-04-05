import { redirect } from 'next/navigation'
import { verifyQGSession } from '@/app/actions/qg-auth'
import QGSidebar from '../QGSidebar'

export default async function QGProtectedLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = await verifyQGSession()
  if (!isAuthenticated) {
    redirect('/qg-admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex antialiased">
      <QGSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
