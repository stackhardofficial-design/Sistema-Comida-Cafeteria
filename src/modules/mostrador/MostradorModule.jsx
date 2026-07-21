import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOrders, dbGetOrder, dbCreateOrder, fmtMoney, sb } from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function MostradorModule() {
  const { tenantId, setCurrentContext, setCart, setDiscount } = useApp()
  const [openOrders, setOpenOrders] = useState([])
  const [closedOrders, setClosedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal de nuevo pedido
  const [newOrderModal, setNewOrderModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadData() {
    if (!tenantId) return
    try {
      setLoading(true)
      const [open, closed] = await Promise.all([
        dbGetOrders(tenantId, { status: 'open', type: 'takeaway' }),
        dbGetOrders(tenantId, { status: 'paid', type: 'takeaway', limit: 5 })
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

  useEffect(() => {
    if (!tenantId) return
    const mostradorChannel = sb.channel('realtime-mostrador')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => { loadData() }
      )
      .subscribe()

    return () => {
      sb.removeChannel(mostradorChannel)
    }
  }, [tenantId])

  async function handleCreateOrder(e) {
    e.preventDefault()
    if (!customerName.trim()) return
    setCreating(true)
    try {
      const order = await dbCreateOrder(
        tenantId,
        'takeaway',
        null,
        customerName.trim() || null,
        customerPhone.trim() || null
      )
      // Activar la comanda para este nuevo pedido
      setCurrentContext({
        type: 'mostrador',
        orderId: order.id,
        customerName: customerName.trim(),
      })
      setCart([])
      setDiscount({ type: 'none', value: 0 })
      // Agregar el pedido a la lista local inmediatamente
      setOpenOrders(prev => [order, ...prev])
      // Resetear y cerrar modal
      setCustomerName('')
      setCustomerPhone('')
      setNewOrderModal(false)
    } catch (e) {
      alert('Error al crear pedido: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  async function openTicket(order) {
    try {
      const fullOrder = await dbGetOrder(order.id)
      if (!fullOrder) return
      setCurrentContext({
        type: 'mostrador',
        orderId: order.id,
        customerName: order.customer_name || '',
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
      <style>{`
        .table-row-hover:hover {
          background-color: #f1f5f9 !important;
        }
        .btn-new-order {
          background: #334155;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-new-order:hover {
          background: #1e293b;
        }
        .mostrador-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          background: #f8fafc;
          color: #1e293b;
        }
        .mostrador-input:focus {
          border-color: #334155;
          background: white;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Mostrador
        </h1>
        <button className="btn-new-order" onClick={() => setNewOrderModal(true)}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span> Nuevo Pedido
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Buscador */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 14px',
          gap: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por etiqueta o nombre"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              width: '100%',
              fontSize: '14px'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>✕</button>
          )}
        </div>

        {/* Sección EN CURSO */}
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            En Curso
          </h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>Cargando...</div>
          ) : (
            <OrdersTable
              orders={filteredOpen}
              emptyText="Sin ventas en curso."
              onSelect={openTicket}
              isClosedTable={false}
            />
          )}
        </div>

        {/* Sección CERRADAS */}
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Cerradas (Últimas 5)
          </h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>Cargando...</div>
          ) : (
            <OrdersTable
              orders={filteredClosed}
              emptyText="Sin ventas cerradas."
              onSelect={openTicket}
              isClosedTable={true}
            />
          )}
        </div>
      </div>

      {/* Modal Nuevo Pedido */}
      <Modal show={newOrderModal} onClose={() => { setNewOrderModal(false); setCustomerName(''); setCustomerPhone('') }} title="🏪 Nuevo Pedido Mostrador">
        <form onSubmit={handleCreateOrder}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nombre del Cliente *
              </label>
              <input
                className="mostrador-input"
                type="text"
                placeholder="Ej: Juan García"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Teléfono <span style={{ fontWeight: '400', color: '#94a3b8' }}>(opcional)</span>
              </label>
              <input
                className="mostrador-input"
                type="text"
                placeholder="Ej: 11-1234-5678"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setNewOrderModal(false); setCustomerName(''); setCustomerPhone('') }}
              style={{
                padding: '9px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: '#64748b'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !customerName.trim()}
              style={{
                padding: '9px 20px',
                background: creating || !customerName.trim() ? '#94a3b8' : '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: creating || !customerName.trim() ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                transition: 'background 0.15s'
              }}
            >
              {creating ? 'Creando...' : '🏪 Crear Pedido'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function OrdersTable({ orders, emptyText, onSelect, isClosedTable }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <th style={{ padding: '10px 16px', fontWeight: '700' }}>ID / Etiqueta</th>
            <th style={{ padding: '10px 16px', fontWeight: '700' }}>Hora Inicio</th>
            <th style={{ padding: '10px 16px', fontWeight: '700' }}>Estado</th>
            <th style={{ padding: '10px 16px', fontWeight: '700' }}>Cliente</th>
            <th style={{ padding: '10px 16px', fontWeight: '700', textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map(o => {
              const orderTime = new Date(o.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              return (
                <tr
                  key={o.id}
                  onClick={() => onSelect(o)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--accent)' }}>
                    #{o.id.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>
                    {orderTime}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      background: isClosedTable ? '#f1f5f9' : '#d1fae5',
                      color: isClosedTable ? '#475569' : '#065f46',
                      textTransform: 'uppercase'
                    }}>
                      {isClosedTable ? 'Pagado' : 'En curso'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155', fontWeight: '500' }}>
                    {o.customer_name || 'Sin nombre'}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', color: '#1e293b' }}>
                    {fmtMoney(o.total_amount)}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
