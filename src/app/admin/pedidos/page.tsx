import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Historial de Pedidos' }

export default async function PedidosPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      restaurant_tables(name),
      users(first_name, last_name)
    `)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(100) // Mostramos los últimos 100 por ahora

  const statusMap: Record<string, string> = {
    pending:   'badge-pending',
    in_kitchen:'badge-kitchen',
    ready:     'badge-ready',
    served:    'badge-served',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  }

  const statusLabel: Record<string, string> = {
    pending:   'Pendiente',
    in_kitchen:'En Cocina',
    ready:     'Listo',
    served:    'Servido',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }

  const typeLabel: Record<string, string> = {
    dine_in:  'Mesa',
    takeout:  'Para Llevar',
    delivery: 'Delivery'
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">Historial de los últimos pedidos</p>
        </div>
      </div>

      {!orders?.length ? (
        <div className="card">
          <div className="empty-state">
            <ShoppingBag className="empty-state-icon h-12 w-12" />
            <p className="empty-state-title">No hay pedidos registrados</p>
            <p className="empty-state-desc">Los pedidos aparecerán aquí cuando abras el POS.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID / Fecha</th>
                <th>Tipo / Mesa</th>
                <th>Creado por</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <div>
                      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        #{order.id.split('-')[0]}
                      </p>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(order.created_at).toLocaleString('es', { 
                          dateStyle: 'medium', timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {typeLabel[order.order_type]}
                      </p>
                      {(order.restaurant_tables as any)?.name && (
                         <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                           {(order.restaurant_tables as any).name}
                         </p>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                     {(order.users as any)?.first_name} {(order.users as any)?.last_name || ''}
                  </td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${Number(order.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${statusMap[order.status]}`}>
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-icon" title="Ver detalles">
                      <ChevronRight className="h-4 w-4" />
                    </button>
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
