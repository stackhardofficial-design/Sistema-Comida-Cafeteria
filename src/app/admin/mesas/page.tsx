import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Table2 } from 'lucide-react'
import CreateZoneModal from './components/create-zone-modal'
import CreateTableModal from './components/create-table-modal'
import InteractiveMap from './components/interactive-map'
import Link from 'next/link'

export const metadata = { title: 'Mesas' }

export default async function MesasPage({
  searchParams,
}: {
  searchParams: Promise<{ zoneId?: string }>
}) {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const params = await searchParams

  const [{ data: zones }, { data: tables }, { data: activeOrders }] = await Promise.all([
    supabase.from('restaurant_zones').select('*').eq('tenant_id', profile.tenant_id).order('sort_order'),
    supabase.from('restaurant_tables').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    supabase.from('orders')
      .select('id, table_db_id, total_amount, created_at, order_items(id, quantity, unit_price, products(name))')
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['pending', 'in_kitchen', 'ready']),
  ])

  const zoneList = zones || []
  const tableList = (tables || []) as any[]
  const orderList = (activeOrders || []) as any[]

  const activeZoneId = params?.zoneId || zoneList[0]?.id || 'all'

  const zoneTables = activeZoneId === 'all'
    ? tableList
    : tableList.filter(t => t.zone_id === activeZoneId)

  // Counts for zone badges
  const occupiedCount = (id: string) =>
    tableList.filter(t => (id === 'all' || t.zone_id === id) && t.status !== 'free').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mesas</h1>
          <p className="page-subtitle">Gestiona el estado, pedidos y distribución de las mesas</p>
        </div>
        <div className="flex items-center gap-3">
          <CreateZoneModal />
          <CreateTableModal zones={zoneList} />
        </div>
      </div>

      {!zoneList.length && !tableList.length ? (
        <div className="card">
          <div className="empty-state">
            <Table2 className="empty-state-icon h-12 w-12" />
            <p className="empty-state-title">Sin mesas configuradas</p>
            <p className="empty-state-desc">Comienza creando una zona (ej: Salón, Terraza) y luego agregando mesas.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Zone Tabs — like Fudo */}
          <div
            className="flex items-center gap-1 p-1 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            {zoneList.length > 1 && (
              <Link
                href="/admin/mesas?zoneId=all"
                className="relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                style={
                  activeZoneId === 'all'
                    ? { background: 'var(--brand-orange)', color: '#fff', boxShadow: '0 4px 12px rgba(229,107,37,0.35)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                Todas
                {occupiedCount('all') > 0 && (
                  <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                    style={{ background: activeZoneId === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)', color: activeZoneId === 'all' ? '#fff' : 'var(--text-secondary)' }}>
                    {occupiedCount('all')}
                  </span>
                )}
              </Link>
            )}

            {zoneList.map(zone => {
              const isActive = activeZoneId === zone.id
              const count = occupiedCount(zone.id)
              return (
                <Link
                  key={zone.id}
                  href={`/admin/mesas?zoneId=${zone.id}`}
                  className="relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  style={
                    isActive
                      ? { background: 'var(--brand-orange)', color: '#fff', boxShadow: '0 4px 12px rgba(229,107,37,0.35)' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  {zone.name}
                  {count > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                      style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)', color: isActive ? '#fff' : 'var(--text-secondary)' }}>
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Libres',      status: 'free',     color: '#22c55e' },
              { label: 'Ocupadas',    status: 'occupied',  color: '#ef4444' },
              { label: 'Reservadas',  status: 'reserved',  color: '#f59e0b' },
              { label: 'Por cobrar',  status: 'billing',   color: '#3b82f6' },
            ].map(({ label, status, color }) => (
              <div key={status} className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-2xl font-black" style={{ color }}>
                  {zoneTables.filter((t: any) => t.status === status).length}
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Interactive map */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <InteractiveMap
              zoneId={activeZoneId}
              initialTables={zoneTables}
              activeOrders={orderList}
              allTables={tableList}
              zones={zoneList}
            />
          </div>
        </div>
      )}
    </div>
  )
}
