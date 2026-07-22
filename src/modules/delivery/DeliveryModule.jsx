import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetDeliveryOrders, dbCreateDeliveryOrder, dbUpdateOrder, dbGetOrder,
  fmtMoney, fmtTimer, sb
} from '../../lib/supabase'
import Modal from '../../components/Modal'

const STATUS_GROUPS = [
  {
    key: 'open',
    label: 'En Preparación',
    headerColor: '#f97316',
    headerBg: '#fff7ed',
    badgeBg: '#fed7aa',
    badgeColor: '#9a3412',
    icon: '⏳',
    dotColor: '#f97316',
  },
  {
    key: 'in_transit',
    label: 'Listo para Entregar',
    headerColor: '#3b82f6',
    headerBg: '#eff6ff',
    badgeBg: '#bfdbfe',
    badgeColor: '#1d4ed8',
    icon: '🛵',
    dotColor: '#3b82f6',
  },
  {
    key: 'delivered',
    label: 'Enviados',
    headerColor: '#eab308',
    headerBg: '#fefce8',
    badgeBg: '#fef08a',
    badgeColor: '#713f12',
    icon: '✅',
    dotColor: '#eab308',
  },
]

export default function DeliveryModule() {
  const { tenantId, setCurrentContext, setCart, setDiscount } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCounts, setVisibleCounts] = useState({ open: 5, in_transit: 5, delivered: 5 })
  const [newOrderModal, setNewOrderModal] = useState(false)

  // Form state for new delivery order
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    reference: '',
  })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const loadOrders = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await dbGetDeliveryOrders(tenantId)
      setOrders(data)
    } catch (e) {
      console.error('Error loading delivery orders:', e)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return
    const channel = sb.channel('realtime-delivery')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => loadOrders()
      )
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [tenantId, loadOrders])

  async function openOrder(order) {
    try {
      const fullOrder = await dbGetOrder(order.id)
      if (!fullOrder) return
      setCurrentContext({
        type: 'delivery',
        orderId: order.id,
        tableName: order.customer_name || 'Delivery',
        customerName: order.customer_name,
        address: order.delivery_addresses?.street_address || '',
      })
      setCart((fullOrder.order_items || []).map(oi => ({
        id: oi.id,
        product: oi.products,
        qty: oi.quantity,
        notes: oi.notes || '',
        dbItemId: oi.id
      })))
      setDiscount({ type: 'none', value: 0 })
    } catch (e) {
      alert('Error al cargar pedido: ' + e.message)
    }
  }

  async function moveOrder(orderId, newStatus) {
    try {
      await dbUpdateOrder(orderId, { status: newStatus })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (e) {
      alert('Error al actualizar estado: ' + e.message)
    }
  }

  async function handleCreateOrder(e) {
    e.preventDefault()
    if (!formData.customerName.trim()) {
      setFormError('El nombre del cliente es requerido.')
      return
    }
    setCreating(true)
    setFormError('')
    try {
      const order = await dbCreateDeliveryOrder(tenantId, formData)
      setOrders(prev => [order, ...prev])
      // Open order in comanda panel directly
      setCurrentContext({
        type: 'delivery',
        orderId: order.id,
        tableName: formData.customerName,
        customerName: formData.customerName,
        address: formData.streetAddress,
      })
      setCart([])
      setDiscount({ type: 'none', value: 0 })
      setNewOrderModal(false)
      setFormData({ customerName: '', customerPhone: '', streetAddress: '', city: '', state: '', postalCode: '', reference: '' })
    } catch (e) {
      setFormError('Error al crear pedido: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  function showMore(statusKey) {
    setVisibleCounts(prev => ({ ...prev, [statusKey]: prev[statusKey] + 10 }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', overflowY: 'auto', padding: '24px' }}>
      <style>{`
        .del-table-row:hover { background: #f1f5f9 !important; }
        .del-btn-move {
          padding: 4px 10px;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .del-btn-open {
          border: none;
          background: none;
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          padding: 2px 4px;
        }
        .del-btn-open:hover { opacity: 0.7; }
        .del-show-more {
          margin: 8px auto 0;
          display: block;
          border: 1px solid #cbd5e1;
          background: white;
          color: #64748b;
          padding: 7px 20px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .del-show-more:hover { background: #f1f5f9; color: #334155; }
        .del-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          border-bottom: 2px solid rgba(0,0,0,0.08);
          font-weight: 700;
          font-size: 13px;
        }
        .del-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .del-form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .del-form-field label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .del-form-field input {
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          background: #f8fafc;
        }
        .del-form-field input:focus { border-color: var(--accent, #3b82f6); background: white; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Delivery
        </h1>
        <button
          onClick={() => setNewOrderModal(true)}
          style={{
            background: '#f97316',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#ea580c'}
          onMouseOut={e => e.currentTarget.style.background = '#f97316'}
        >
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span> Nuevo Pedido
        </button>
      </div>

      {/* Status Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {STATUS_GROUPS.map(group => {
          const groupOrders = orders.filter(o => o.status === group.key)
          const visible = groupOrders.slice(0, visibleCounts[group.key])
          const hasMore = groupOrders.length > visibleCounts[group.key]

          return (
            <div key={group.key}>
              {/* Section Header */}
              <div className="del-section-header" style={{ background: group.headerBg }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: group.dotColor, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: group.headerColor }}>{group.label}</span>
                <span style={{
                  background: group.badgeBg,
                  color: group.badgeColor,
                  borderRadius: '12px',
                  padding: '1px 8px',
                  fontSize: '11px',
                  fontWeight: '800',
                }}>
                  {groupOrders.length}
                </span>
              </div>

              {/* Table */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 12px' }}>ID</th>
                      <th style={{ padding: '8px 12px' }}>Hora Inicio</th>
                      <th style={{ padding: '8px 12px' }}>Dirección</th>
                      <th style={{ padding: '8px 12px' }}>Teléfono</th>
                      <th style={{ padding: '8px 12px' }}>Cliente</th>
                      {group.key !== 'delivered' && <th style={{ padding: '8px 12px' }}>Tiempo</th>}
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '8px 12px' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Cargando...</td>
                      </tr>
                    ) : visible.length > 0 ? (
                      visible.map(order => {
                        const addr = order.delivery_addresses
                        const orderTime = new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
                        return (
                          <tr
                            key={order.id}
                            className="del-table-row"
                            style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                          >
                            <td style={{ padding: '10px 12px' }}>
                              <button className="del-btn-open" onClick={() => openOrder(order)}>
                                #{order.id.slice(-6).toUpperCase()}
                              </button>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{orderTime}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {addr?.street_address || order.notes || '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {order.customer_phone || '—'}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#334155' }}>
                              {order.customer_name || 'Sin nombre'}
                            </td>
                            {group.key !== 'delivered' && (
                              <td style={{ padding: '10px 12px', color: '#f97316', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                {fmtTimer(order.created_at)}
                              </td>
                            )}
                            <td style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right', color: '#1e293b', whiteSpace: 'nowrap' }}>
                              {fmtMoney(order.total_amount)}
                            </td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                              {group.key === 'open' && (
                                <button
                                  className="del-btn-move"
                                  style={{ background: '#dbeafe', color: '#1d4ed8' }}
                                  onClick={e => { e.stopPropagation(); moveOrder(order.id, 'in_transit') }}
                                >
                                  🛵 Enviar
                                </button>
                              )}
                              {group.key === 'in_transit' && (
                                <button
                                  className="del-btn-move"
                                  style={{ background: '#d1fae5', color: '#065f46' }}
                                  onClick={e => { e.stopPropagation(); moveOrder(order.id, 'delivered') }}
                                >
                                  ✅ Entregado
                                </button>
                              )}
                              {group.key === 'delivered' && (
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                          No hay pedidos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {hasMore && (
                  <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                    <button className="del-show-more" onClick={() => showMore(group.key)}>
                      Mostrar más resultados
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Nuevo Pedido */}
      <Modal show={newOrderModal} onClose={() => { setNewOrderModal(false); setFormError('') }} title="🛵 Nuevo Pedido Delivery">
        <form onSubmit={handleCreateOrder}>
          <div className="del-form-grid" style={{ marginBottom: 16 }}>
            <div className="del-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Nombre del Cliente *</label>
              <input
                type="text"
                placeholder="Ej: Juan García"
                value={formData.customerName}
                onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="del-form-field">
              <label>Teléfono</label>
              <input
                type="text"
                placeholder="Ej: 11-1234-5678"
                value={formData.customerPhone}
                onChange={e => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              />
            </div>
            <div className="del-form-field">
              <label>Ciudad</label>
              <input
                type="text"
                placeholder="Ej: Buenos Aires"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="del-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Dirección</label>
              <input
                type="text"
                placeholder="Ej: Av. Corrientes 1234"
                value={formData.streetAddress}
                onChange={e => setFormData(prev => ({ ...prev, streetAddress: e.target.value }))}
              />
            </div>
            <div className="del-form-field">
              <label>Código Postal</label>
              <input
                type="text"
                placeholder="Ej: 1043"
                value={formData.postalCode}
                onChange={e => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
            <div className="del-form-field">
              <label>Referencia / Piso / Dpto</label>
              <input
                type="text"
                placeholder="Ej: 3° B, timbre García"
                value={formData.reference}
                onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>
          </div>

          {formError && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setNewOrderModal(false); setFormError('') }}
              style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '9px 20px',
                background: creating ? '#94a3b8' : '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'background 0.15s'
              }}
            >
              {creating ? 'Creando...' : '🛵 Crear Pedido'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
