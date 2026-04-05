import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyQGSession } from '@/app/actions/qg-auth'
import QGSidebar from '../QGSidebar'

export default async function QGProtectedLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = await verifyQGSession()

  if (!isAuthenticated) {
    // Apaga cookie inválido/expirado antes de redirecionar para evitar loops
    const cookieStore = await cookies()
    cookieStore.delete('qg_access_token')
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
