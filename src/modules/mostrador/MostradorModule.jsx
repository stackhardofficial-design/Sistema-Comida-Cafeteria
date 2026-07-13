import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOrders, dbGetOrder, fmtMoney } from '../../lib/supabase'

export default function MostradorModule() {
  const { tenantId, setCurrentContext, setCart, setDiscount } = useApp()
  const [openOrders, setOpenOrders] = useState([])
  const [closedOrders, setClosedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function loadData() {
    if (!tenantId) return
    try {
      setLoading(true)
      const [open, closed] = await Promise.all([
        dbGetOrders(tenantId, { status: 'open', type: 'takeaway' }),
        dbGetOrders(tenantId, { status: 'paid', type: 'takeaway', limit: 10 })
      ])
      setOpenOrders(open)
      setClosedOrders(closed)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tenantId])

  function newSale() {
    setCurrentContext({ type: 'mostrador', orderId: null })
    setCart([])
    setDiscount({ type: 'none', value: 0 })
  }

  async function openTicket(orderId) {
    try {
      const order = await dbGetOrder(orderId)
      if (!order) return
      setCurrentContext({ type: 'mostrador', orderId })
      setCart((order.order_items || []).map(oi => ({
        id: oi.id,
        product: oi.products,
        qty: oi.quantity,
        notes: oi.notes || '',
        dbItemId: oi.id
      })))
    } catch (e) {
      alert('Error al cargar pedido')
    }
  }

  const filterFn = (order) => {
    if (!search) return true
    const s = search.toLowerCase()
    const idMatch = order.id.slice(-6).toLowerCase().includes(s)
    const nameMatch = (order.customer_name || '').toLowerCase().includes(s)
    return idMatch || nameMatch
  }

  const filteredOpen = openOrders.filter(filterFn)
  const filteredClosed = closedOrders.filter(filterFn)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)' }}>Mostrador</h1>
        <button className="btn-new-sale btn-primary" onClick={newSale} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="plus">＋</span> NUEVA VENTA
        </button>
      </div>

      <div className="mostrador-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
        <div className="mostrador-search" style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', gap: '10px' }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '14px' }}
          />
        </div>

        <div>
          <div className="section-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>EN CURSO</div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>Cargando...</div>
          ) : (
            <div className="tickets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredOpen.length > 0 ? (
                filteredOpen.map(o => (
                  <div key={o.id} className="ticket-card" onClick={() => openTicket(o.id)}>
                    <div className="ticket-id">#{o.id.slice(-6).toUpperCase()}</div>
                    <div className="ticket-customer">{o.customer_name || 'Sin nombre'}</div>
                    <div className="ticket-total">{fmtMoney(o.total_amount)}</div>
                    <span className="ticket-status open">En curso</span>
                  </div>
                ))
              ) : (
                <div className="empty-state"><span className="empty-icon">🏪</span><p>Sin ventas en curso</p></div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="section-label" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', marginTop: '16px' }}>CERRADAS (ÚLTIMAS 10)</div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>Cargando...</div>
          ) : (
            <div className="tickets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredClosed.length > 0 ? (
                filteredClosed.map(o => (
                  <div key={o.id} className="ticket-card" onClick={() => openTicket(o.id)}>
                    <div className="ticket-id">#{o.id.slice(-6).toUpperCase()}</div>
                    <div className="ticket-customer">{o.customer_name || 'Sin nombre'}</div>
                    <div className="ticket-total">{fmtMoney(o.total_amount)}</div>
                    <span className="ticket-status paid">Pagado</span>
                  </div>
                ))
              ) : (
                <div className="empty-state"><span className="empty-icon">📋</span><p>Sin ventas cerradas</p></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
