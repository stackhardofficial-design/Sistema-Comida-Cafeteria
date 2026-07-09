import { createAdminClient } from '@/infrastructure/supabase/server'
import { Store, CheckCircle2, XCircle, Users } from 'lucide-react'
import CreateRestaurantModal from './components/create-restaurant-modal'
import ToggleTenantButton from './components/toggle-tenant-button'

export const metadata = { title: 'Restaurantes | Super Admin' }

export default async function RestaurantesPage() {
  const adminClient = createAdminClient()
  const { data: tenants } = await adminClient
    .from('tenants')
    .select(`*, users(id, role, first_name, last_name)`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Restaurantes</h1>
          <p className="page-subtitle">{tenants?.length || 0} restaurantes registrados en el sistema</p>
        </div>
        <CreateRestaurantModal />
      </div>

      {!tenants?.length ? (
        <div className="card">
          <div className="empty-state">
            <Store className="empty-state-icon h-12 w-12" />
            <p className="empty-state-title">No hay restaurantes registrados</p>
            <p className="empty-state-desc">Crea el primero usando el botón de arriba.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Slug</th>
                <th>Moneda</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const owner = (tenant.users as any[])?.find((u: any) => u.role === 'owner')
                const userCount = (tenant.users as any[])?.length || 0

                return (
                  <tr key={tenant.id}>
                    <td>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{tenant.name}</p>
                        {owner && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Dueño: {owner.first_name} {owner.last_name || ''}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {tenant.slug}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{tenant.currency}</td>
                    <td>
                      <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <Users className="h-4 w-4" />
                        <span>{userCount}</span>
                      </div>
                    </td>
                    <td>
                      {tenant.is_active ? (
                        <span className="badge badge-free">
                          Activo
                        </span>
                      ) : (
                        <span className="badge badge-cancelled">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td>
                      <ToggleTenantButton
                        tenantId={tenant.id}
                        isActive={tenant.is_active}
                        tenantName={tenant.name}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
