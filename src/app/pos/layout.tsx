import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Clock } from 'lucide-react'

export default async function POSLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, first_name, tenants(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.tenants) redirect('/login')

  const tenantName = (profile.tenants as any).name
  const isAdmin = ['owner', 'admin', 'manager'].includes(profile.role)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Top Navigation Bar */}
      <header
        className="h-14 flex items-center justify-between px-4 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-4">
          <Link href={isAdmin ? "/admin" : "/"} className="btn btn-ghost btn-sm btn-icon" title="Volver al inicio">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}>
              {tenantName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>POS</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tenantName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Clock className="h-4 w-4" />
            <span id="pos-clock" className="font-mono">
              {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-4" style={{ borderLeft: '1px solid var(--border-subtle)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{profile.first_name}</span>
            <span className={`badge badge-${profile.role}`}>{profile.role}</span>
          </div>
        </div>
      </header>

      {/* POS Content */}
      <main className="flex-1 overflow-hidden flex">
        {children}
      </main>
    </div>
  )
}
