import { createAdminClient } from '@/infrastructure/supabase/server'
import { Store, Users, Activity } from 'lucide-react'

export const metadata = { title: 'Dashboard Super Admin' }

export default async function SuperAdminPage() {
  const adminClient = createAdminClient()

  const [{ data: tenants }, { data: users }] = await Promise.all([
    adminClient.from('tenants').select('id, is_active'),
    adminClient.from('users').select('id, role'),
  ])

  const totalRestaurants = tenants?.length || 0
  const activeRestaurants = tenants?.filter(t => t.is_active).length || 0
  const totalUsers = users?.length || 0

  const stats = [
    { label: 'Total Restaurantes', value: totalRestaurants, icon: Store, colorClass: 'stat-icon-orange' },
    { label: 'Restaurantes Activos', value: activeRestaurants, icon: Activity, colorClass: 'stat-icon-green' },
    { label: 'Total Usuarios', value: totalUsers, icon: Users, colorClass: 'stat-icon-blue' },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">Visión general del sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, colorClass }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick link */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Accesos Rápidos
        </h2>
        <div className="flex gap-3">
          <a href="/super-admin/restaurantes" className="btn btn-primary">
            <Store className="h-4 w-4" />
            Gestionar Restaurantes
          </a>
        </div>
      </div>
    </div>
  )
}
