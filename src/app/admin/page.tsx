import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import {
  DollarSign, ShoppingBag, UtensilsCrossed, Table2,
  TrendingUp, Clock, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, first_name')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { createAdminClient } = await import('@/infrastructure/supabase/server')
  const adminClient = createAdminClient()

  // Get stats via RPC (it might be SECURITY DEFINER, but using adminClient ensures it works regardless)
  const { data: stats } = await adminClient.rpc('get_dashboard_stats', {
    p_tenant_id: profile.tenant_id
  })

  // Get recent orders
  const { data: recentOrders } = await adminClient
    .from('orders')
    .select('id, status, order_type, total_amount, created_at, restaurant_tables(name), users(first_name)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get top products
  const { data: topProducts } = await adminClient
    .from('order_items')
    .select('product_id, quantity, products(name)')
    .eq('tenant_id', profile.tenant_id)
    .limit(50)

  // Calculate top products client-side from data
  const productCounts: Record<string, { name: string; count: number }> = {}
  topProducts?.forEach((item: any) => {
    const pId = item.product_id
    if (!productCounts[pId]) {
      productCounts[pId] = { name: item.products?.name || 'N/A', count: 0 }
    }
    productCounts[pId].count += item.quantity
  })
  const topProductsList = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const s = stats as any || {}
  const statCards = [
    {
      label: 'Ventas Hoy',
      value: `$${Number(s.today_sales || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      colorClass: 'stat-icon-orange',
      sub: 'ingresos del día'
    },
    {
      label: 'Pedidos Hoy',
      value: s.today_orders || 0,
      icon: ShoppingBag,
      colorClass: 'stat-icon-blue',
      sub: 'pedidos totales'
    },
    {
      label: 'Pedidos Activos',
      value: s.active_orders || 0,
      icon: Clock,
      colorClass: 'stat-icon-yellow',
      sub: 'en proceso ahora'
    },
    {
      label: 'Ventas del Mes',
      value: `$${Number(s.month_sales || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      colorClass: 'stat-icon-green',
      sub: 'mes en curso'
    },
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Hola, {profile.first_name} 👋
        </h1>
        <p className="page-subtitle">
          Aquí tienes el resumen de hoy
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, colorClass, sub }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <Table2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.free_tables || 0}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mesas Libres</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.occupied_tables || 0}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Mesas Ocupadas</p>
          </div>
        </div>
      </div>

      {/* Bottom grid: Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card" style={{ padding: 0 }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pedidos Recientes</h2>
            <Link href="/admin/pedidos" className="text-xs flex items-center gap-1" style={{ color: 'var(--brand-orange)' }}>
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!recentOrders?.length ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="empty-state-title">Sin pedidos aún</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(order.restaurant_tables as any)?.name || `${order.order_type === 'delivery' ? '🛵 Delivery' : '🥡 Para llevar'}`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {(order.users as any)?.first_name} · {new Date(order.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${statusMap[order.status]}`}>{statusLabel[order.status]}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card" style={{ padding: 0 }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Platillos Más Vendidos</h2>
          </div>
          {!topProductsList.length ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="empty-state-title">Sin ventas aún</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {topProductsList.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {p.count} vendidos
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
