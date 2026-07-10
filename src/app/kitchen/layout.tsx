import { requireRole } from '@/infrastructure/supabase/auth/auth-helpers'
import Link from 'next/link'
import { ArrowLeft, Clock, ChefHat } from 'lucide-react'

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(['kitchen'])

  const { createAdminClient } = await import('@/infrastructure/supabase/server')
  const adminClient = createAdminClient()
  const { data: tenant } = await adminClient.from('tenants').select('name').eq('id', profile.tenant_id).single()

  if (!tenant) { const { redirect } = await import('next/navigation'); redirect('/login') }

  const tenantName = tenant!.name
  const isAdmin = ['owner', 'admin', 'manager'].includes(profile.role)


  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* Top Navigation Bar - Darker for kitchen */}
      <header
        className="h-16 flex items-center justify-between px-6 flex-shrink-0"
        style={{ background: '#111111', borderBottom: '1px solid #222' }}
      >
        <div className="flex items-center gap-4">
          <Link href={isAdmin ? "/admin" : "/"} className="btn btn-ghost btn-icon" style={{ background: '#222' }} title="Volver al inicio">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <div>
              <p className="text-lg font-black leading-none text-white tracking-wider">KDS</p>
              <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">{tenantName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-orange-500 font-mono text-xl font-bold">
            <Clock className="h-5 w-5" />
            <span>
              {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-6" style={{ borderLeft: '1px solid #333' }}>
            <span className="text-sm font-medium text-gray-300">{profile.first_name}</span>
            <span className={`badge badge-${profile.role} opacity-80`}>{profile.role}</span>
          </div>
        </div>
      </header>

      {/* KDS Content */}
      <main className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        {children}
      </main>
    </div>
  )
}
