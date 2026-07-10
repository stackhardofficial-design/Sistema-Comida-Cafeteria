import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Users, CheckCircle2, XCircle } from 'lucide-react'
import CreateUserModal from './components/create-user-modal'
import ToggleUserButton from './components/toggle-user-button'

export const metadata = { title: 'Personal' }

export default async function PersonalPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  // Usar adminClient para bypassar RLS y obtener el slug del tenant correctamente
  const { createAdminClient } = await import('@/infrastructure/supabase/server')
  const adminClient = createAdminClient()

  const { data: tenant } = await adminClient
    .from('tenants')
    .select('slug')
    .eq('id', profile.tenant_id)
    .single()

  const { data: employees } = await adminClient
    .from('users')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  const isManagerOrAdmin = ['owner', 'admin', 'manager'].includes(profile.role)
  const tenantSlug = tenant?.slug || profile.tenant_id

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal</h1>
          <p className="page-subtitle">Gestiona los accesos de tus empleados</p>
        </div>
        {isManagerOrAdmin && <CreateUserModal currentRole={profile.role} tenantSlug={tenantSlug} />}
      </div>

      {!employees?.length ? (
        <div className="card">
          <div className="empty-state">
            <Users className="empty-state-icon h-12 w-12" />
            <p className="empty-state-title">No hay empleados registrados</p>
            <p className="empty-state-desc">Añade a tu equipo usando el botón superior.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre / Email</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {emp.first_name} {emp.last_name || ''}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {/* email generado: usuario@slug.com */}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {((emp.roles as string[]) || [emp.role]).map((r: string) => (
                        <span key={r} className={`badge badge-${r}`} style={{ fontSize: '0.65rem' }}>
                          {r === 'waiter' ? 'MOZO' : r === 'cashier' ? 'CAJERO' : r === 'delivery' ? 'DELIVERY' : r === 'kitchen' ? 'COCINA' : r === 'manager' ? 'GERENTE' : r === 'admin' ? 'ADMIN' : r === 'owner' ? 'DUEÑO' : r.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {emp.is_active ? (
                      <span className="badge badge-free">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Activo
                      </span>
                    ) : (
                      <span className="badge badge-cancelled">
                        <XCircle className="h-3 w-3 mr-0.5" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td>
                     {/* No permitir desactivarse a sí mismo o a roles superiores si se es manager */}
                    {isManagerOrAdmin && emp.id !== user.id && (
                       <ToggleUserButton 
                          userId={emp.id} 
                          isActive={emp.is_active} 
                          userName={emp.first_name}
                          userRole={emp.role}
                          currentUserRole={profile.role}
                       />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
