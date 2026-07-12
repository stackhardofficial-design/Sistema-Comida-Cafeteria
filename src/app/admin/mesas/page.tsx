import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Table2, LayoutGrid, Map, Users } from 'lucide-react'
import CreateZoneModal from './components/create-zone-modal'
import CreateTableModal from './components/create-table-modal'
import InteractiveMap from './components/interactive-map'
import ZoneCard from './components/zone-card'
import Link from 'next/link'

export const metadata = { title: 'Mesas y Zonas' }

export default async function MesasPage({
  searchParams,
}: {
  searchParams: Promise<{ zoneId?: string; view?: string }>
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
  const viewMode = params?.view || 'map'

  // Fetch zones, tables, and active orders
  const [
    { data: zones }, 
    { data: tables },
    { data: activeOrders }
  ] = await Promise.all([
    supabase
      .from('restaurant_zones')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('sort_order'),
    supabase
      .from('restaurant_tables')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('name'),
    supabase
      .from('orders')
      .select(`
        id,
        table_db_id,
        total_amount,
        created_at,
        order_items (
          id,
          quantity,
          unit_price,
          products (name)
        )
      `)
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['pending', 'in_kitchen', 'ready'])
  ])

  const zoneList = zones || []
  const tableList = tables || []
  const activeOrderList = (activeOrders as any) || []

  // Determine selected zone
  const activeZoneId = params?.zoneId || zoneList[0]?.id || ''
  const selectedZone = zoneList.find(z => z.id === activeZoneId)

  // Filter tables in active zone
  const zoneTables = activeZoneId 
    ? tableList.filter(t => t.zone_id === activeZoneId)
    : tableList.filter(t => !t.zone_id)

  return (
    <div className="space-y-6 flex flex-col h-full">
      
      {/* Page Header */}
      <div className="page-header flex-shrink-0">
        <div>
          <h1 className="page-title">Mesas y Zonas</h1>
          <p className="page-subtitle font-medium">Configura y gestiona el mapa físico de tu restaurante</p>
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
            <p className="empty-state-title">No has configurado mesas ni zonas</p>
            <p className="empty-state-desc">Comienza creando zonas (ej. Interior, Terraza) y agregando mesas.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          
          {/* Tabs Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-2 rounded-2xl border border-subtle flex-shrink-0">
            <div className="flex flex-wrap gap-1">
              {zoneList.map((zone) => (
                <Link
                  key={zone.id}
                  href={`/admin/mesas?zoneId=${zone.id}&view=${viewMode}`}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                    activeZoneId === zone.id
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                      : 'border-transparent text-muted hover:bg-white/5'
                  }`}
                >
                  {zone.name}
                </Link>
              ))}
              
              {tableList.some(t => !t.zone_id) && (
                <Link
                  href={`/admin/mesas?zoneId=none&view=${viewMode}`}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                    activeZoneId === 'none'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'border-transparent text-muted hover:bg-white/5'
                  }`}
                >
                  Sin Zona
                </Link>
              )}
            </div>

            {/* View Mode & Zone Control Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {selectedZone && (
                <div className="flex items-center gap-2 border-r border-subtle pr-3 mr-1">
                  <ZoneCard zone={selectedZone} />
                </div>
              )}
              
              <div className="flex bg-elevated p-1 rounded-xl border border-subtle">
                <Link
                  href={`/admin/mesas?zoneId=${activeZoneId}&view=map`}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'map' ? 'bg-surface text-orange-500 shadow-sm' : 'text-muted hover:text-primary'
                  }`}
                  title="Modo Mapa"
                >
                  <Map className="h-4 w-4" />
                </Link>
                <Link
                  href={`/admin/mesas?zoneId=${activeZoneId}&view=list`}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-surface text-orange-500 shadow-sm' : 'text-muted hover:text-primary'
                  }`}
                  title="Modo Lista"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Core Content Area */}
          <div className="flex-1">
            {viewMode === 'map' ? (
              <InteractiveMap
                zoneId={activeZoneId === 'none' ? '' : activeZoneId}
                initialTables={zoneTables}
                activeOrders={activeOrderList}
                allTables={tableList}
                zones={zoneList}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {zoneTables.map((table: any) => {
                    const activeOrder = activeOrderList.find((o: any) => o.table_db_id === table.id)
                    return (
                      <Link 
                        key={table.id}
                        href={`/pos?tableId=${table.id}`}
                        className="card hover:-translate-y-1 transition-all p-5 flex flex-col items-center justify-center text-center cursor-pointer border border-subtle hover:border-orange-500/50"
                      >
                        <div 
                          className="w-3 h-3 rounded-full mb-3"
                          style={{
                            backgroundColor: 
                              table.status === 'free' ? '#10b981' :
                              table.status === 'occupied' ? '#ef4444' :
                              table.status === 'reserved' ? '#8b5cf6' : '#f59e0b'
                          }}
                        />
                        <h4 className="text-base font-extrabold text-primary">{table.name}</h4>
                        <span className="text-xs text-muted mt-1 flex items-center gap-1">
                          <Users className="h-3 w-3" /> {table.capacity} sillas
                        </span>
                        {activeOrder && (
                          <div className="mt-3 px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold">
                            Total: ${Number(activeOrder.total_amount).toFixed(2)}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
                {zoneTables.length === 0 && (
                  <p className="text-center text-sm text-muted p-12">No hay mesas configuradas en esta zona.</p>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
