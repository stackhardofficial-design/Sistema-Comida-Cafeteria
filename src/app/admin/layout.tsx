import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClientServer } from '@/infrastructure/supabase/server'
import {
  LayoutDashboard, Store, Users, Table2, ShoppingBag,
  CreditCard, Truck, Settings, Coffee, LogOut, ChevronRight, Bell
} from 'lucide-react'

const navItems = [
  { href: '/admin',              label: 'Dashboard',      icon: LayoutDashboard, group: 'Principal' },
  { href: '/admin/menu',         label: 'Menú',           icon: Store,           group: 'Principal' },
  { href: '/admin/mesas',        label: 'Mesas',          icon: Table2,          group: 'Principal' },
  { href: '/admin/personal',     label: 'Personal',       icon: Users,           group: 'Principal' },
  { href: '/admin/pedidos',      label: 'Pedidos',        icon: ShoppingBag,     group: 'Operación' },
  { href: '/admin/caja',         label: 'Caja',           icon: CreditCard,      group: 'Operación' },
  { href: '/admin/delivery',     label: 'Delivery',       icon: Truck,           group: 'Operación' },
  { href: '/admin/configuracion',label: 'Configuración',  icon: Settings,        group: 'Sistema' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, first_name, last_name, tenants(name, currency)')
    .eq('id', user.id)
    .single()

  const tenant = (profile?.tenants as any)
  const groups = ['Principal', 'Operación', 'Sistema']

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 hidden md:flex flex-col"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-5 gap-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Image src="/logo.png" alt="Logo" width={130} height={42} className="object-contain" priority />
        </div>

        {/* Restaurant name */}
        {tenant?.name && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
              RESTAURANTE
            </p>
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {tenant.name}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {groups.map(group => {
            const items = navItems.filter(i => i.group === group)
            return (
              <div key={group} className="mb-4">
                <p
                  className="px-3 text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {group}
                </p>
                {items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="nav-link">
                    <Icon className="nav-icon h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            )
          })}

          {/* Quick access to operational views */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Vistas Operativas
            </p>
            <Link href="/pos" className="nav-link">
              <Coffee className="nav-icon h-4 w-4" style={{ color: 'var(--brand-orange)' }} />
              <span style={{ color: 'var(--brand-orange)' }}>Abrir POS</span>
            </Link>
            <Link href="/kitchen" className="nav-link">
              <Store className="nav-icon h-4 w-4" style={{ color: 'var(--info)' }} />
              <span style={{ color: 'var(--info)' }}>Pantalla Cocina</span>
            </Link>
          </div>
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
            >
              {profile?.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.first_name} {profile?.last_name || ''}
              </p>
              <span className={`badge badge-${profile?.role}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                {profile?.role}
              </span>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'flex-start' }}>
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-14 flex items-center justify-between px-6"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
        >
          {/* Mobile logo */}
          <div className="md:hidden">
            <Image src="/logo.png" alt="Logo" width={100} height={32} className="object-contain" />
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-icon">
              <Bell className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
              >
                {profile?.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {profile?.first_name}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
