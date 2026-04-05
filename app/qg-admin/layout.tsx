// Layout raiz do /qg-admin — sem auth aqui para não bloquear /qg-admin/login.
// A proteção real fica em app/qg-admin/(protected)/layout.tsx via route group.
export const metadata = { robots: 'noindex, nofollow' }

export default function QGRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
