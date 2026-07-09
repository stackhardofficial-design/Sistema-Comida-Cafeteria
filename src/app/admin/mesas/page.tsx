import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { Table2, Users } from 'lucide-react'
import CreateZoneModal from './components/create-zone-modal'
import CreateTableModal from './components/create-table-modal'
import TableCard from './components/table-card'
import ZoneCard from './components/zone-card'

export const metadata = { title: 'Mesas y Zonas' }

export default async function MesasPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const [{ data: zones }, { data: tables }] = await Promise.all([
    supabase.from('restaurant_zones').select('*').eq('tenant_id', profile.tenant_id).order('sort_order'),
    supabase.from('restaurant_tables').select('*').eq('tenant_id', profile.tenant_id).order('name')
  ])

  const groupedTables = zones?.map(z => ({
    ...z,
    tables: tables?.filter(t => t.zone_id === z.id) || []
  })) || []

  const uncategorizedTables = tables?.filter(t => !t.zone_id) || []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mesas y Zonas</h1>
          <p className="page-subtitle">Configura el mapa de tu restaurante</p>
        </div>
        <div className="flex gap-3">
          <CreateZoneModal />
          <CreateTableModal zones={zones || []} />
        </div>
      </div>

      {!zones?.length && !tables?.length ? (
        <div className="card">
          <div className="empty-state">
            <Table2 className="empty-state-icon h-12 w-12" />
            <p className="empty-state-title">No has configurado mesas</p>
            <p className="empty-state-desc">Comienza creando zonas (ej. Terraza) y agregando mesas.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTables.map(zone => (
            <div key={zone.id}>
              <div className="flex items-center gap-3 mb-4">
                <ZoneCard zone={zone} />
              </div>
              {zone.tables.length === 0 ? (
                <p className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                  Sin mesas en esta zona
                </p>
              ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {zone.tables.map((table: any) => (
                    <TableCard key={table.id} table={table} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {uncategorizedTables.length > 0 && (
             <div>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                MESAS SIN ZONA
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {uncategorizedTables.map((table: any) => (
                  <TableCard key={table.id} table={table} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
