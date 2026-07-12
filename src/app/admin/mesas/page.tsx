import { createClientServer, createAdminClient } from '@/infrastructure/supabase/server'
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
  const admin = createAdminClient()

  const [{ data: zones, error: zError }, { data: tables, error: tError }, { data: activeOrders }] = await Promise.all([
    admin.from('restaurant_zones').select('*').eq('tenant_id', profile.tenant_id).order('sort_order'),
    admin.from('restaurant_tables').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    admin.from('orders')
      .select('id, table_db_id, total_amount, created_at, order_items(id, quantity, unit_price, products(name))')
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['pending', 'in_kitchen', 'ready']),
  ])

  if (zError) console.error('Error fetching zones:', zError)
  if (tError) console.error('Error fetching tables:', tError)

  const zoneList = zones || []
  const tableList = (tables || []) as any[]
  const orderList = (activeOrders || []) as any[]

  const activeZoneId = params?.zoneId || 'all'

  const zoneTables = activeZoneId === 'all'
    ? tableList
    : activeZoneId === 'nozone'
    ? tableList.filter(t => !t.zone_id)
    : tableList.filter(t => t.zone_id === activeZoneId)

  const hasUnzonedTables = tableList.some(t => !t.zone_id)

  // Counts for zone badges
  const occupiedCount = (id: string) => {
    if (id === 'all') return tableList.filter(t => t.status !== 'free').length
    if (id === 'nozone') return tableList.filter(t => !t.zone_id && t.status !== 'free').length
    return tableList.filter(t => t.zone_id === id && t.status !== 'free').length
  }

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
            className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Always show Todas */}
            <Link
              href="/admin/mesas"
              className="relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
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

            {zoneList.map(zone => {
              const isActive = activeZoneId === zone.id
              const count = occupiedCount(zone.id)
              return (
                <Link
                  key={zone.id}
                  href={`/admin/mesas?zoneId=${zone.id}`}
                  className="relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
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

            {hasUnzonedTables && (
              <Link
                href="/admin/mesas?zoneId=nozone"
                className="relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                style={
                  activeZoneId === 'nozone'
                    ? { background: 'var(--brand-orange)', color: '#fff', boxShadow: '0 4px 12px rgba(229,107,37,0.35)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                Sin zona
              </Link>
            )}
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
