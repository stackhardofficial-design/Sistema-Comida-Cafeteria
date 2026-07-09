import { redirect } from 'next/navigation'
import { createClientServer } from '@/infrastructure/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Store, LogOut, ChevronRight } from 'lucide-react'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, first_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/admin')

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Image src="/logo.png" alt="Logo" width={120} height={40} className="object-contain" priority />
        </div>

        {/* Badge */}
        <div className="px-4 py-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
          >
            ⚡ SUPER ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <Link href="/super-admin" className="nav-link">
            <LayoutDashboard className="nav-icon h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/super-admin/restaurantes" className="nav-link">
            <Store className="nav-icon h-4 w-4" />
            Restaurantes
          </Link>
        </nav>

        {/* User */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
            >
              {profile?.first_name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.first_name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user.email}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn btn-secondary btn-sm w-full">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb header */}
        <header
          className="h-14 flex items-center px-6 gap-2"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Super Admin</span>
          <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
