import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Truck, MapPin } from 'lucide-react'
import AssignDeliveryModal from './components/assign-delivery-modal'

export const metadata = { title: 'Gestión de Delivery' }

export default async function AdminDeliveryPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  // Obtener pedidos de delivery pendientes de asignación
  const { data: unassignedOrders } = await supabase
    .from('orders')
    .select('*, delivery_addresses(*)')
    .eq('tenant_id', profile.tenant_id)
    .eq('order_type', 'delivery')
    .in('status', ['ready', 'in_kitchen', 'pending'])
    .is('delivery_assignments.id', null) // Filtrar los que no tienen asignación (requiere join o lo filtramos por query si no sirve IS NULL en relation)
  
  // Alternative para filtrar unassigned (como Supabase no siempre soporta IS NULL en foreign table de 1-to-many fácil)
  // Obtenemos todas las asignaciones activas:
  const { data: activeAssignments } = await supabase
    .from('delivery_assignments')
    .select(`
      *,
      orders(*, delivery_addresses(*)),
      users(first_name, last_name)
    `)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['assigned', 'picked_up', 'in_transit'])
    .order('created_at', { ascending: false })

  const assignedOrderIds = activeAssignments?.map(a => a.order_id) || []
  
  const { data: deliveryOrders } = await supabase
    .from('orders')
    .select('*, delivery_addresses(*)')
    .eq('tenant_id', profile.tenant_id)
    .eq('order_type', 'delivery')
    .in('status', ['pending', 'in_kitchen', 'ready'])

  const pendingAssignment = deliveryOrders?.filter(o => !assignedOrderIds.includes(o.id)) || []

  // Obtener repartidores
  const { data: deliveryUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, is_active')
    .eq('tenant_id', profile.tenant_id)
    .eq('role', 'delivery')
    .eq('is_active', true)

  const statusLabel: Record<string, string> = {
    assigned: 'Asignado',
    picked_up: 'En Camino',
    in_transit: 'En Camino',
    delivered: 'Entregado'
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery</h1>
          <p className="page-subtitle">Asigna pedidos a repartidores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sin Asignar */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
            PENDIENTES DE ASIGNAR ({pendingAssignment.length})
          </h2>
          
          <div className="space-y-3">
            {!pendingAssignment.length ? (
              <div className="card text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay pedidos pendientes de asignar
              </div>
            ) : (
              pendingAssignment.map((order: any) => (
                <div key={order.id} className="card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Pedido #{order.id.split('-')[0]}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(order.created_at).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--brand-orange)' }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2 mb-4 p-2 rounded-lg" style={{ background: 'var(--bg-base)' }}>
                    <MapPin className="h-4 w-4 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                    <div className="text-xs">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.customer_name}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{(order.delivery_addresses as any)?.street_address}</p>
                      <p style={{ color: 'var(--text-muted)' }}>Tel: {order.customer_phone}</p>
                    </div>
                  </div>

                  <AssignDeliveryModal 
                    order={order} 
                    deliveryUsers={deliveryUsers || []} 
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* En Curso */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--info)' }} />
            EN CURSO ({activeAssignments?.length || 0})
          </h2>
          
          <div className="space-y-3">
            {!activeAssignments?.length ? (
              <div className="card text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay entregas en curso
              </div>
            ) : (
              activeAssignments.map((assignment: any) => (
                <div key={assignment.id} className="card p-4" style={{ borderLeft: '3px solid var(--info)' }}>
                   <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        Repartidor: {(assignment.users as any)?.first_name}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Pedido #{(assignment.orders as any)?.id.split('-')[0]}
                      </p>
                    </div>
                    <span className={`badge`} style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                      {statusLabel[assignment.status]}
                    </span>
                  </div>
                  <div className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                     <strong>Destino:</strong> {((assignment.orders as any)?.delivery_addresses as any)?.street_address}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
