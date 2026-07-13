import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetDeliveryOrders, dbUpdateOrder, fmtMoney, fmtDate } from '../../lib/supabase'

const COLS = [
  { key: 'open', label: 'Pendientes', color: 'var(--orange)', emoji: '⏳' },
  { key: 'in_transit', label: 'En Camino', color: 'var(--accent)', emoji: '🛵' },
  { key: 'delivered', label: 'Entregados', color: 'var(--green-border)', emoji: '✅' },
]

export default function DeliveryModule() {
  const { tenantId, setCurrentContext, setCart, setDiscount } = useApp()
  const [orders, setOrders] = useState([])
  const [dragId, setDragId] = useState(null)

  useEffect(() => {
    if (tenantId) load()
  }, [tenantId])

  async function load() {
    const data = await dbGetDeliveryOrders(tenantId)
    setOrders(data)
  }

  async function moveOrder(orderId, newStatus) {
    await dbUpdateOrder(orderId, { status: newStatus })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  function handleDragStart(e, orderId) {
    setDragId(orderId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e, colKey) {
    e.preventDefault()
    if (dragId) moveOrder(dragId, colKey)
    setDragId(null)
    document.querySelectorAll('.kanban-cards').forEach(el => el.classList.remove('drag-over'))
  }

  function openOrder(order) {
    setCurrentContext({ type: 'delivery', orderId: order.id, tableName: order.customer_name || 'Delivery' })
    setCart([])
    setDiscount({ type: 'none', value: 0 })
  }

  return (
    <div className="delivery-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>Delivery</h1>
        <button className="btn btn-primary btn-sm" onClick={() => {
          setCurrentContext({ type: 'delivery', orderId: null, tableName: 'Delivery' })
          setCart([])
        }}>+ Nuevo Pedido</button>
      </div>
      <div className="delivery-board">
        {COLS.map(col => {
          const colOrders = orders.filter(o => o.status === col.key)
          return (
            <div key={col.key} className={`kanban-col ${col.key}`}>
              <div className="kanban-col-header" style={{ color: col.color }}>
                {col.emoji} {col.label}
                <span className="count-badge">{colOrders.length}</span>
              </div>
              <div
                className="kanban-cards"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                onDrop={e => handleDrop(e, col.key)}
              >
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    className={`delivery-card${dragId === order.id ? ' dragging' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, order.id)}
                    onClick={() => openOrder(order)}
                  >
                    <div className="delivery-card-name">{order.customer_name || 'Sin nombre'}</div>
                    <div className="delivery-card-info">
                      {order.customer_phone && <div>📞 {order.customer_phone}</div>}
                      <div>🕐 {fmtDate(order.created_at)}</div>
                      <div>{order.order_items?.length || 0} ítems</div>
                    </div>
                    <div className="delivery-card-total">{fmtMoney(order.total_amount)}</div>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
