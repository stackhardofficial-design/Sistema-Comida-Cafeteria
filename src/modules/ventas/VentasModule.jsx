import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOrders, dbGetOrder, dbUpdateOrder, fmtMoney, fmtDate, sb } from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function VentasModule() {
  const { tenantId } = useApp()
  const todayStr = new Date().toISOString().split('T')[0]
  
  const [from, setFrom] = useState(todayStr)
  const [to, setTo] = useState(todayStr)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Modales
  const [detailModal, setDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  const [pinModal, setPinModal] = useState(false)
  const [orderToAnul, setOrderToAnul] = useState(null)
  const [pinInput, setPinInput] = useState('')

  async function loadVentas() {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await dbGetOrders(tenantId, {
        from: from ? from + 'T00:00:00' : null,
        to: to ? to + 'T23:59:59' : null,
        status: status || null
      })
      setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVentas()
  }, [tenantId, from, to, status])

  useEffect(() => {
    if (!tenantId) return
    const ordersChannel = sb.channel('realtime-ventas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => { loadVentas() }
      )
      .subscribe()

    return () => {
      sb.removeChannel(ordersChannel)
    }
  }, [tenantId])

  const filteredOrders = orders.filter(o => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      o.id.toLowerCase().includes(s) ||
      (o.customer_name || '').toLowerCase().includes(s)
    )
  })

  // Stats
  const total = filteredOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
  const paidCount = filteredOrders.filter(o => o.status === 'paid').length
  const average = filteredOrders.length ? total / filteredOrders.length : 0

  async function viewVenta(orderId) {
    try {
      const order = await dbGetOrder(orderId)
      setSelectedOrder(order)
      setDetailModal(true)
    } catch (e) {
      alert('Error al obtener detalle del pedido')
    }
  }

  function startAnular(orderId) {
    setOrderToAnul(orderId)
    setPinInput('')
    setPinModal(true)
  }

  async function confirmAnular() {
    // PIN admin por defecto 1234
    if (pinInput !== '1234') {
      alert('PIN Incorrecto')
      return
    }
    try {
      await dbUpdateOrder(orderToAnul, { status: 'cancelled' })
      setPinModal(false)
      loadVentas()
    } catch (e) {
      alert('Error al anular la venta')
    }
  }

  const typeLabel = { dine_in: '🪑 Mesa', takeaway: '🏪 Mostrador', delivery: '🛵 Delivery' }
  const statusBadge = {
    paid: <span className="badge badge-green">Pagado</span>,
    open: <span className="badge badge-yellow">Abierto</span>,
    cancelled: <span className="badge badge-red">Anulado</span>,
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="module-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Historial de Ventas</h1>
      </div>

      <div className="data-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div className="data-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" className="filter-date" value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>hasta</span>
          <input type="date" className="filter-date" value={to} onChange={e => setTo(e.target.value)} />
          
          <input
            className="filter-input"
            placeholder="Buscar cliente, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />

          <select className="filter-date" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="paid">Pagado</option>
            <option value="open">Abierto</option>
            <option value="cancelled">Anulado</option>
          </select>
        </div>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Ventas</div>
            <div className="stat-value">{fmtMoney(total)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tickets</div>
            <div className="stat-value">{filteredOrders.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cerradas</div>
            <div className="stat-value">{paidCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Promedio</div>
            <div className="stat-value">{fmtMoney(average)}</div>
          </div>
        </div>

        <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Ticket</th>
                <th>Fecha/Hora</th>
                <th>Origen</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Cargando...
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td><code style={{ fontSize: '12px' }}>{o.id.slice(-8).toUpperCase()}</code></td>
                    <td>{fmtDate(o.created_at)}</td>
                    <td>{typeLabel[o.order_type] || o.order_type}</td>
                    <td>{o.customer_name || '-'}</td>
                    <td style={{ fontWeight: '700' }}>{fmtMoney(o.total_amount)}</td>
                    <td>{statusBadge[o.status] || o.status}</td>
                    <td>
                      <button className="btn-icon" onClick={() => viewVenta(o.id)} title="Ver detalle">👁️</button>
                      {o.status !== 'cancelled' && (
                        <button className="btn-icon del" onClick={() => startAnular(o.id)} title="Anular" style={{ marginLeft: '6px' }}>🚫</button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="empty-state">
                      <span className="empty-icon">📊</span>
                      <p>Sin ventas para el período</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle */}
      <Modal show={detailModal} onClose={() => setDetailModal(false)} title={`Detalle Venta #${selectedOrder?.id.slice(-8).toUpperCase()}`}>
        {selectedOrder && (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
              {fmtDate(selectedOrder.created_at)} | {selectedOrder.customer_name || 'Sin cliente'}
            </p>
            <div>
              {(selectedOrder.order_items || []).map((item, i) => (
                <div key={i} className="payment-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{item.quantity}x {item.products?.name}</span>
                  <span>{fmtMoney(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px' }}>
              <span>Total</span>
              <span>{fmtMoney(selectedOrder.total_amount)}</span>
            </div>
            <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setDetailModal(false)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal PIN de Seguridad */}
      <Modal show={pinModal} onClose={() => setPinModal(false)} title="Confirmar PIN de Seguridad">
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Ingresa el PIN de Administrador para anular esta venta.
          </p>
          <div className="form-row">
            <input
              type="password"
              placeholder="PIN de Administrador"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-secondary" onClick={() => setPinModal(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={confirmAnular}>Anular Venta</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
