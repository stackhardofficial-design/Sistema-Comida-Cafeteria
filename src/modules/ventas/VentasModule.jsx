import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOrders, dbGetOrder, dbUpdateOrder, fmtMoney, fmtDate, sb } from '../../lib/supabase'
import Modal from '../../components/Modal'

const METHOD_LABELS = {
  cash: '💵 Efectivo', card: '💳 Tarjeta', transfer: '🏦 Transferencia',
  efectivo: '💵 Efectivo', debito: '💳 Débito', credito: '💳 Crédito', transferencia: '🏦 Transferencia'
}
const TYPE_LABELS = { dine_in: '🪑 Mesa', takeaway: '🏪 Mostrador', delivery: '🛵 Delivery' }
const TYPE_COLORS = { dine_in: '#6366f1', takeaway: '#f59e0b', delivery: '#10b981' }

function StatusBadge({ status }) {
  const map = {
    paid: { label: 'Pagado', color: '#10b981', bg: '#d1fae5' },
    delivered: { label: 'Pagado / Entregado', color: '#10b981', bg: '#d1fae5' },
    in_transit: { label: 'En Camino', color: '#3b82f6', bg: '#dbeafe' },
    open: { label: 'Abierto', color: '#f59e0b', bg: '#fef3c7' },
    cancelled: { label: 'Anulado', color: '#ef4444', bg: '#fee2e2' },
  }
  const s = map[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
      background: s.bg, color: s.color, whiteSpace: 'nowrap'
    }}>{s.label}</span>
  )
}

function StatCard({ label, value, sub, color = 'var(--accent)', icon }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '16px 20px', borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '4px'
    }}>
      <div style={{ fontSize: '20px' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  )
}

export default function VentasModule() {
  const { tenantId } = useApp()
  const todayStr = new Date().toISOString().split('T')[0]

  const [from, setFrom] = useState(todayStr)
  const [to, setTo] = useState(todayStr)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Detalle
  const [detailModal, setDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Anular
  const [pinModal, setPinModal] = useState(false)
  const [orderToAnul, setOrderToAnul] = useState(null)
  const [pinInput, setPinInput] = useState('')

  // Vista: tabla o tarjetas
  const [view, setView] = useState('table')

  // Período rápido
  function setQuickPeriod(period) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    if (period === 'today') { setFrom(todayStr); setTo(todayStr) }
    else if (period === 'yesterday') {
      const y = new Date(today); y.setDate(y.getDate() - 1)
      const s = y.toISOString().split('T')[0]; setFrom(s); setTo(s)
    }
    else if (period === 'week') {
      const w = new Date(today); w.setDate(w.getDate() - 6)
      setFrom(w.toISOString().split('T')[0]); setTo(todayStr)
    }
    else if (period === 'month') {
      setFrom(todayStr.slice(0, 7) + '-01'); setTo(todayStr)
    }
  }

  async function loadVentas() {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await dbGetOrders(tenantId, {
        from: from ? from + 'T00:00:00' : null,
        to: to ? to + 'T23:59:59' : null,
        status: filterStatus || null,
        type: filterType || null,
      })
      setOrders(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVentas() }, [tenantId, from, to, filterStatus, filterType])

  useEffect(() => {
    if (!tenantId) return
    const ch = sb.channel('realtime-ventas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, () => loadVentas())
      .subscribe()
    return () => sb.removeChannel(ch)
  }, [tenantId])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (search) {
        const s = search.toLowerCase()
        const match = o.id.toLowerCase().includes(s) || (o.customer_name || '').toLowerCase().includes(s)
        if (!match) return false
      }
      if (filterMethod) {
        const hasMeth = (o.payments || []).some(p => p.payment_method === filterMethod)
        if (!hasMeth) return false
      }
      return true
    })
  }, [orders, search, filterMethod])

  // Stats
  const isPaid = o => o.status === 'paid' || o.status === 'delivered'
  const isOpen = o => o.status === 'open' || o.status === 'in_transit'
  
  const totalRevenue = filteredOrders.filter(isPaid).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
  const paidCount = filteredOrders.filter(isPaid).length
  const openCount = filteredOrders.filter(isOpen).length
  const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length
  const avgTicket = paidCount ? totalRevenue / paidCount : 0
  const totalItems = filteredOrders.reduce((s, o) => s + (o.order_items || []).length, 0)
  const byMethod = {}
  filteredOrders.filter(isPaid).forEach(o => {
    (o.payments || []).forEach(p => {
      const k = METHOD_LABELS[p.payment_method] || p.payment_method
      byMethod[k] = (byMethod[k] || 0) + parseFloat(p.amount)
    })
  })

  async function viewVenta(orderId) {
    setLoadingDetail(true)
    setDetailModal(true)
    try {
      const order = await dbGetOrder(orderId)
      setSelectedOrder(order)
    } catch (e) {
      alert('Error al obtener detalle del pedido')
    } finally {
      setLoadingDetail(false)
    }
  }

  function startAnular(orderId) { setOrderToAnul(orderId); setPinInput(''); setPinModal(true) }

  async function confirmAnular() {
    if (pinInput !== '1234') { alert('PIN Incorrecto'); return }
    try {
      await dbUpdateOrder(orderToAnul, { status: 'cancelled' })
      setPinModal(false)
      loadVentas()
    } catch (e) { alert('Error al anular la venta') }
  }

  const inputStyle = {
    padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', outline: 'none'
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📊 Ventas</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {filteredOrders.length} registros · {from === to ? from : `${from} → ${to}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['today', 'yesterday', 'week', 'month'].map((p, i) => (
            <button key={p} onClick={() => setQuickPeriod(p)} style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
            }}>
              {['Hoy', 'Ayer', 'Semana', 'Mes'][i]}
            </button>
          ))}
          <button onClick={loadVentas} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', alignItems: 'center' }}>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>→</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">Estado: Todos</option>
          <option value="paid,delivered">✅ Pagado / Entregado</option>
          <option value="open,in_transit">🟡 Abierto / En Camino</option>
          <option value="cancelled">❌ Anulado</option>
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={inputStyle}>
          <option value="">Canal: Todos</option>
          <option value="dine_in">🪑 Mesa</option>
          <option value="takeaway">🏪 Mostrador</option>
          <option value="delivery">🛵 Delivery</option>
        </select>

        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={inputStyle}>
          <option value="">Pago: Todos</option>
          <option value="cash">💵 Efectivo</option>
          <option value="card">💳 Tarjeta</option>
          <option value="transfer">🏦 Transferencia</option>
        </select>

        <input
          placeholder="🔍 Buscar cliente, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
        />

        {(filterStatus || filterType || filterMethod || search) && (
          <button onClick={() => { setFilterStatus(''); setFilterType(''); setFilterMethod(''); setSearch('') }} style={{
            padding: '8px 12px', background: 'transparent', border: '1px solid var(--border)',
            borderRadius: '7px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px'
          }}>✕ Limpiar</button>
        )}
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <StatCard icon="💰" label="Ingresos" value={fmtMoney(totalRevenue)} color="#10b981" />
        <StatCard icon="🧾" label="Ventas cerradas" value={paidCount} color="#6366f1" />
        <StatCard icon="📋" label="Ticket promedio" value={fmtMoney(avgTicket)} color="#f59e0b" />
        <StatCard icon="🟡" label="En curso" value={openCount} color="#f59e0b" />
        <StatCard icon="❌" label="Anuladas" value={cancelledCount} color="#ef4444" />
        <StatCard icon="🍽️" label="Artículos vendidos" value={totalItems} color="#8b5cf6" />
      </div>

      {/* DESGLOSE POR MÉTODO */}
      {Object.keys(byMethod).length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: '600', textTransform: 'uppercase' }}>Por método:</span>
          {Object.entries(byMethod).map(([m, v]) => (
            <div key={m} style={{
              padding: '6px 14px', borderRadius: '20px', background: 'var(--surface)',
              border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600'
            }}>
              {m} · <span style={{ color: 'var(--accent)' }}>{fmtMoney(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 1 }}>
              {['ID Ticket', 'Hora apertura', 'Hora cierre', 'Canal', 'Mesa / Cliente', 'Artículos', 'Métodos de pago', 'Total', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Cargando ventas...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Sin ventas para el período o filtros seleccionados.</p>
              </td></tr>
            ) : filteredOrders.map((o, i) => {
              const isMostrador = o.order_type === 'dine_in' && !o.table_db_id
              const effType = isMostrador ? 'takeaway' : o.order_type
              const typeLbl = TYPE_LABELS[effType] || effType
              const typeColor = TYPE_COLORS[effType] || '#64748b'
              const mesa = o.restaurant_tables?.name || null
              const client = o.customer_name || null
              const label = mesa && client ? `${mesa} · ${client}` : mesa || client || '—'
              const itemCount = (o.order_items || []).length
              const methodsSummary = [...new Set((o.payments || []).map(p => METHOD_LABELS[p.payment_method] || p.payment_method))].join(' + ') || '—'
              const closedAt = (o.status === 'paid' || o.status === 'delivered' || o.status === 'cancelled') ? o.updated_at : null

              return (
                <tr key={o.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg, rgba(0,0,0,0.02))',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light, rgba(99,102,241,0.05))'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg, rgba(0,0,0,0.02))'}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <code style={{ fontSize: '11px', background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      #{o.id.slice(-8).toUpperCase()}
                    </code>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {fmtDate(o.created_at)}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {closedAt ? fmtDate(closedAt) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 9px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '700', background: `${typeColor}22`, color: typeColor, whiteSpace: 'nowrap'
                    }}>{typeLbl}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'center' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>{itemCount}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {methodsSummary}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    {fmtMoney(o.total_amount)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <StatusBadge status={o.status} />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => viewVenta(o.id)}
                        title="Ver detalle"
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '5px', cursor: 'pointer', padding: '5px 8px', fontSize: '14px' }}
                      >👁️</button>
                      {o.status !== 'cancelled' && (
                        <button
                          onClick={() => startAnular(o.id)}
                          title="Anular venta"
                          style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '5px', cursor: 'pointer', padding: '5px 8px', fontSize: '14px', color: '#ef4444' }}
                        >🚫</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredOrders.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>{filteredOrders.length} registros · {paidCount} pagados · {openCount} abiertos · {cancelledCount} anulados</span>
          <span style={{ fontWeight: '700', color: 'var(--accent)' }}>Total cobrado: {fmtMoney(totalRevenue)}</span>
        </div>
      )}

      {/* MODAL DETALLE */}
      <Modal show={detailModal} onClose={() => { setDetailModal(false); setSelectedOrder(null) }} wide>
        {loadingDetail ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando detalle...</div>
        ) : selectedOrder && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* TICKET LADO IZQUIERDO */}
            <div style={{ flex: '1 1 280px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🧾</div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>TICKET #{selectedOrder.id.slice(-8).toUpperCase()}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {fmtDate(selectedOrder.created_at)}
                </div>
                {selectedOrder.customer_name && (
                  <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '6px' }}>
                    👤 {selectedOrder.customer_name}
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                    background: TYPE_COLORS[selectedOrder.order_type === 'dine_in' && !selectedOrder.table_db_id ? 'takeaway' : selectedOrder.order_type] + '22',
                    color: TYPE_COLORS[selectedOrder.order_type === 'dine_in' && !selectedOrder.table_db_id ? 'takeaway' : selectedOrder.order_type]
                  }}>
                    {TYPE_LABELS[selectedOrder.order_type === 'dine_in' && !selectedOrder.table_db_id ? 'takeaway' : selectedOrder.order_type] || selectedOrder.order_type}
                  </span>
                </div>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '220px', marginBottom: '12px' }}>
                {(selectedOrder.order_items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontWeight: '700', marginRight: '6px' }}>{item.quantity}x</span>
                      {item.products?.name || 'Producto'}
                    </div>
                    <span style={{ fontWeight: '600' }}>{fmtMoney(item.total_price)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedOrder.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444' }}>
                    <span>Descuento:</span>
                    <span>-{fmtMoney(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px' }}>
                  <span>TOTAL:</span>
                  <span style={{ color: 'var(--accent)' }}>{fmtMoney(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* INFO LADO DERECHO */}
            <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>MÉTODOS DE PAGO</h3>
              {selectedOrder.order_payments?.length > 0 || selectedOrder.payments?.length > 0 ? (
                (selectedOrder.payments || selectedOrder.order_payments || []).map((p, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{METHOD_LABELS[p.payment_method] || p.payment_method}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{fmtMoney(p.amount)}</div>
                      {p.change_amount > 0 && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Vuelto: {fmtMoney(p.change_amount)}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
                  Sin registros de pago
                </div>
              )}

              <div style={{ marginTop: 'auto' }}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estado:</span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  {selectedOrder.restaurant_tables?.name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mesa:</span>
                      <span style={{ fontWeight: '600' }}>{selectedOrder.restaurant_tables.name}</span>
                    </div>
                  )}
                  {selectedOrder.customer_phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Teléfono:</span>
                      <span style={{ fontWeight: '600' }}>{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  {selectedOrder.status !== 'cancelled' && (
                    <button onClick={() => { setDetailModal(false); startAnular(selectedOrder.id) }} style={{
                      flex: 1, padding: '10px', background: '#fee2e2', color: '#ef4444',
                      border: '1px solid #fecaca', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '13px'
                    }}>🚫 Anular</button>
                  )}
                  <button onClick={() => { setDetailModal(false); setSelectedOrder(null) }} style={{
                    flex: 1, padding: '10px', background: 'var(--accent)', color: 'white',
                    border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700', fontSize: '13px'
                  }}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL PIN */}
      <Modal show={pinModal} onClose={() => setPinModal(false)} title="🔐 Confirmar Anulación">
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Esta acción anulará la venta y no puede deshacerse. Ingresá el PIN de administrador para confirmar.
          </p>
          <input
            type="password"
            placeholder="PIN de Administrador"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmAnular()}
            autoFocus
            style={{ width: '100%', padding: '12px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '16px', textAlign: 'center', letterSpacing: '4px', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => setPinModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
            <button onClick={confirmAnular} style={{ flex: 1, padding: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '700' }}>
              Anular Venta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
