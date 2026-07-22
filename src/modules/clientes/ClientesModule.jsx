import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetCustomers, fmtDate } from '../../lib/supabase'

export default function ClientesModule() {
  const { tenantId } = useApp()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function loadCustomers() {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await dbGetCustomers(tenantId)
      setCustomers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [tenantId])

  const filteredCustomers = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.phone || '').toLowerCase().includes(s)
    )
  })

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="module-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Clientes</h1>
      </div>

      <div className="data-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div className="data-toolbar">
          <input
            className="filter-input"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>

        <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Registro</th>
                <th>Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Cargando...
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600' }}>{c.name || c.email?.split('@')[0] || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.email || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.created_at ? fmtDate(c.created_at) : '-'}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.orders_count || 1}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="empty-state">
                      <span className="empty-icon">👥</span>
                      <p>Sin clientes registrados</p>
                      <p className="empty-hint">Los clientes se crean automáticamente al procesar delivery</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
