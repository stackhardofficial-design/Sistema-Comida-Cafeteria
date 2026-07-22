import {     Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock , TrendingDown , Unlock , ArrowDown , PenSquare } from 'lucide-react';
import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOrders, dbGetOrder, dbCreateOrder, dbCreateDeliveryOrder, fmtMoney, sb, dbGetZones, dbGetTables } from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function MostradorModule() {
  const { tenantId, setCurrentContext, setCart, setDiscount } = useApp()
  const [openOrders, setOpenOrders] = useState([])
  const [closedOrders, setClosedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal de nuevo pedido - paso 1: datos del cliente
  const [newOrderModal, setNewOrderModal] = useState(false)
  const [step, setStep] = useState(1) // 1: cliente | 2: delivery | 3: mesa
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('mostrador') // mostrador | delivery | mesa
  
  const [zones, setZones] = useState([])
  const [tables, setTables] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [loadingTables, setLoadingTables] = useState(false)
  // Paso 2: datos de delivery (opcionales)
  const [delivStreet, setDelivStreet] = useState('')
  const [delivDesc, setDelivDesc] = useState('')
  const [delivMapsUrl, setDelivMapsUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  async function loadData() {
    if (!tenantId) return
    try {
      setLoading(true)
      const [open, closed] = await Promise.all([
        dbGetOrders(tenantId, { status: 'open' }),
        dbGetOrders(tenantId, { status: 'paid', limit: 5 })
      ])
      setOpenOrders(open)
      setClosedOrders(closed)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    const ch = sb.channel('realtime-mostrador')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, loadData)
      .subscribe()
    return () => sb.removeChannel(ch)
  }, [tenantId])

  async function openModal() {
    setCustomerName('')
    setCustomerPhone('')
    setOrderType('mostrador')
    setDelivStreet('')
    setDelivDesc('')
    setDelivMapsUrl('')
    setFormError('')
    setStep(1)
    setSelectedTable(null)
    setNewOrderModal(true)
    
    setLoadingTables(true)
    try {
      const [z, t] = await Promise.all([dbGetZones(tenantId), dbGetTables(tenantId)])
      setZones(z)
      setTables(t)
      if (z.length > 0) setSelectedZone(z[0].id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTables(false)
    }
  }

  function closeModal() {
    setNewOrderModal(false)
    setFormError('')
    setStep(1)
  }

  function handleStep1(e) {
    e.preventDefault()
    if (!customerName.trim()) { setFormError('El nombre del cliente es requerido.'); return }
    setFormError('')
    if (orderType === 'delivery') {
      setStep(2)
    } else if (orderType === 'mesa') {
      setStep(3)
    } else {
      handleCreateMostrador()
    }
  }

  async function handleCreateMostrador() {
    setCreating(true)
    try {
      const order = await dbCreateOrder(tenantId, 'dine_in', null, customerName.trim(), customerPhone.trim() || null)
      setCurrentContext({ type: 'mostrador', orderId: order.id, customerName: customerName.trim() })
      setCart([])
      setDiscount({ type: 'none', value: 0 })
      setOpenOrders(prev => [order, ...prev])
      closeModal()
    } catch (e) {
      setFormError('Error al crear pedido: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleCreateDelivery(e) {
    e.preventDefault()
    setCreating(true)
    setFormError('')
    try {
      const reference = [delivDesc.trim(), delivMapsUrl.trim()].filter(Boolean).join(' | ')
      const order = await dbCreateDeliveryOrder(tenantId, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '',
        streetAddress: delivStreet.trim() || '',
        city: '',
        reference: reference || null,
      })
      setCurrentContext({
        type: 'delivery',
        orderId: order.id,
        customerName: customerName.trim(),
        address: delivStreet.trim(),
      })
      setCart([])
      setDiscount({ type: 'none', value: 0 })
      closeModal()
    } catch (e) {
      setFormError('Error al crear pedido: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleCreateMesa(e) {
    e.preventDefault()
    if (!selectedTable) return
    setCreating(true)
    setFormError('')
    try {
      const order = await dbCreateOrder(tenantId, 'dine_in', selectedTable.id, customerName.trim(), customerPhone.trim() || null)

      // Mark the table as occupied
      await sb.from('restaurant_tables').update({
        status: 'occupied',
        current_order_id: order.id
      }).eq('id', selectedTable.id)

      setCurrentContext({ 
        type: 'mesa', 
        orderId: order.id, 
        customerName: customerName.trim(), 
        tableName: selectedTable.name, 
        tableDbId: selectedTable.id 
      })
      setCart([])
      setDiscount({ type: 'none', value: 0 })
      setOpenOrders(prev => [order, ...prev])
      closeModal()
    } catch (e) {
      setFormError('Error al crear pedido en mesa: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  async function openTicket(order) {
    try {
      const isDelivOrd = order.order_type === 'delivery'
      const isMesaOrd = !isDelivOrd && !!order.table_db_id
      
      // Respuesta visual inmediata
      setCurrentContext({
        type: isDelivOrd ? 'delivery' : (isMesaOrd ? 'mesa' : 'mostrador'),
        orderId: order.id,
        customerName: order.customer_name || '',
        tableName: order.restaurant_tables?.name || '',
        tableDbId: order.table_db_id || null,
        address: '',
      })
      setCart([])
      setDiscount({ type: 'none', value: 0 })

      // Carga asíncrona de detalles en segundo plano
      const fullOrder = await dbGetOrder(order.id)
      if (!fullOrder) return
      const isMesaFull = !isDelivOrd && !!fullOrder.table_db_id
      setCurrentContext({
        type: isDelivOrd ? 'delivery' : (isMesaFull ? 'mesa' : 'mostrador'),
        orderId: order.id,
        customerName: order.customer_name || '',
        tableName: fullOrder.restaurant_tables?.name || order.restaurant_tables?.name || '',
        tableDbId: fullOrder.table_db_id || null,
        address: fullOrder.delivery_addresses?.street_address || '',
      })
      setCart((fullOrder.order_items || []).map(oi => ({
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

  const filterFn = (o) => {
    if (!search) return true
    const s = search.toLowerCase()
    return o.id.slice(-6).toLowerCase().includes(s) || (o.customer_name || '').toLowerCase().includes(s)
  }

  const filteredOpen = openOrders.filter(filterFn)
  const filteredClosed = closedOrders.filter(filterFn)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px', background: 'var(--bg)', overflowY: 'auto' }}>
      <style>{`
        .table-row-hover:hover { background-color: #f1f5f9 !important; }
        .btn-new-order {
          background: #334155; color: white; border: none; padding: 8px 16px;
          border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer;
          transition: background 0.15s; display: flex; align-items: center; gap: 6px;
        }
        .btn-new-order:hover { background: #1e293b; }
        .mos-input {
          width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
          font-size: 14px; outline: none; transition: border-color 0.15s;
          box-sizing: border-box; background: #f8fafc; color: #1e293b;
        }
        .mos-input:focus { border-color: #334155; background: white; }
        .mos-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
        .mos-field { display: flex; flex-direction: column; gap: 4px; }
        .delivery-toggle {
          display: flex; align-items: center; gap: 10px; padding: 12px;
          border-radius: 8px; cursor: pointer; transition: background 0.15s;
          border: 2px solid #e2e8f0; background: white; margin-top: 4px;
        }
        .delivery-toggle.active { border-color: #f97316; background: #fff7ed; }
        .delivery-toggle-icon { font-size: 22px; }
        .delivery-toggle-label { font-size: 13px; font-weight: 700; color: #334155; }
        .delivery-toggle-sub { font-size: 11px; color: #94a3b8; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Mostrador
        </h1>
        <button className="btn-new-order" onClick={openModal}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span> Nuevo Pedido
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por etiqueta o nombre"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%', fontSize: '14px' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }}>✕</button>}
        </div>

        {/* En Curso */}
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>En Curso</h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>Cargando...</div>
          ) : (
            <OrdersTable orders={filteredOpen} emptyText="Sin ventas en curso." onSelect={openTicket} isClosedTable={false} />
          )}
        </div>

        {/* Cerradas */}
        <div>
          <h2 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Cerradas (Últimas 5)</h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>Cargando...</div>
          ) : (
            <OrdersTable orders={filteredClosed} emptyText="Sin ventas cerradas." onSelect={openTicket} isClosedTable={true} />
          )}
        </div>
      </div>

      {/* Modal Nuevo Pedido */}
      <Modal show={newOrderModal} onClose={closeModal} title={step === 1 ? <><MonitorSmartphone size={16} style={{marginRight:6}}/> Nuevo Pedido</> : <><Bike size={16} style={{marginRight:6}}/> Datos de Entrega</>}>
        {step === 1 ? (
          <form onSubmit={handleStep1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div className="mos-field">
                <label className="mos-label">Nombre del Cliente *</label>
                <input className="mos-input" type="text" placeholder="Ej: Juan García" value={customerName} onChange={e => setCustomerName(e.target.value)} autoFocus required />
              </div>
              <div className="mos-field">
                <label className="mos-label">Teléfono <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(opcional)</span></label>
                <input className="mos-input" type="text" placeholder="Ej: 11-1234-5678" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>

              {/* Selector de tipo de pedido */}
              <div className="mos-field">
                <label className="mos-label">Tipo de Pedido</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`delivery-toggle${orderType === 'mostrador' ? ' active' : ''}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setOrderType('mostrador')}
                  >
                    <span className="delivery-toggle-icon"><MonitorSmartphone size={16} /></span>
                    <div>
                      <div className="delivery-toggle-label">Mostrador</div>
                      <div className="delivery-toggle-sub">Retira en local</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`delivery-toggle${orderType === 'delivery' ? ' active' : ''}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setOrderType('delivery')}
                  >
                    <span className="delivery-toggle-icon"><Bike size={16} /></span>
                    <div>
                      <div className="delivery-toggle-label">Delivery</div>
                      <div className="delivery-toggle-sub">Envío a domicilio</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`delivery-toggle${orderType === 'mesa' ? ' active' : ''}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => setOrderType('mesa')}
                  >
                    <span className="delivery-toggle-icon">🪑</span>
                    <div>
                      <div className="delivery-toggle-label">Mesa</div>
                      <div className="delivery-toggle-sub">Consumo local</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{formError}</div>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={closeModal} style={{ padding: '9px 16px', background: 'var(--bg)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={creating || !customerName.trim()} style={{ padding: '9px 20px', background: creating || !customerName.trim() ? '#94a3b8' : '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: creating || !customerName.trim() ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700' }}>
                {orderType !== 'mostrador' ? 'Siguiente →' : (creating ? 'Creando...' : <><MonitorSmartphone size={16} style={{marginRight:6}}/> Crear Pedido</>)}
              </button>
            </div>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleCreateDelivery}>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#9a3412' }}>
              🛵 Pedido delivery para <strong>{customerName}</strong>{customerPhone && ` · ${customerPhone}`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div className="mos-field">
                <label className="mos-label">Dirección de entrega <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(opcional)</span></label>
                <input className="mos-input" type="text" placeholder="Ej: Av. Corrientes 1234, Piso 3" value={delivStreet} onChange={e => setDelivStreet(e.target.value)} autoFocus />
              </div>
              <div className="mos-field">
                <label className="mos-label">Descripción / Indicaciones <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(opcional)</span></label>
                <input className="mos-input" type="text" placeholder="Ej: Dpto 4B, timbre García" value={delivDesc} onChange={e => setDelivDesc(e.target.value)} />
              </div>
              <div className="mos-field">
                <label className="mos-label">Enlace Google Maps <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>(opcional)</span></label>
                <input className="mos-input" type="text" placeholder="https://maps.app.goo.gl/..." value={delivMapsUrl} onChange={e => setDelivMapsUrl(e.target.value)} />
              </div>
            </div>

            {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{formError}</div>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setStep(1)} style={{ padding: '9px 16px', background: 'var(--bg)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                ← Atrás
              </button>
              <button type="submit" disabled={creating} style={{ padding: '9px 20px', background: creating ? '#94a3b8' : '#f97316', color: 'white', border: 'none', borderRadius: '6px', cursor: creating ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700' }}>
                {creating ? 'Creando...' : '🛵 Crear Pedido Delivery'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateMesa}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#065f46' }}>
              🪑 Pedido en mesa para <strong>{customerName}</strong>{customerPhone && ` · ${customerPhone}`}
            </div>

            {loadingTables ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando zonas...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {zones.map(z => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setSelectedZone(z.id)}
                      style={{
                        padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                        background: selectedZone === z.id ? 'var(--accent)' : '#f1f5f9',
                        color: selectedZone === z.id ? 'white' : '#475569',
                        fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      {z.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  {tables.filter(t => t.zone_id === selectedZone).length > 0 ? (
                    tables.filter(t => t.zone_id === selectedZone).map(t => {
                      const isOpen = t.orders?.some(o => o.status === 'open' || o.status === 'in_transit')
                      return (
                        <div
                          key={t.id}
                          onClick={() => !isOpen && setSelectedTable(t)}
                          style={{
                            background: isOpen ? '#fee2e2' : (selectedTable?.id === t.id ? '#d1fae5' : '#f8fafc'),
                            border: `2px solid ${isOpen ? '#fca5a5' : (selectedTable?.id === t.id ? '#10b981' : '#e2e8f0')}`,
                            borderRadius: '12px', padding: '16px 8px', textAlign: 'center', cursor: isOpen ? 'not-allowed' : 'pointer',
                            opacity: isOpen ? 0.6 : 1, transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{isOpen ? '🍽️' : '🪑'}</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.name}</div>
                          <div style={{ fontSize: '10px', color: isOpen ? '#ef4444' : '#10b981', fontWeight: '700', marginTop: '4px' }}>
                            {isOpen ? 'OCUPADA' : 'LIBRE'}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No hay mesas en esta zona.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setStep(1)} style={{ padding: '9px 16px', background: 'var(--bg)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                ← Atrás
              </button>
              <button type="submit" disabled={creating || !selectedTable} style={{ padding: '9px 20px', background: creating || !selectedTable ? '#94a3b8' : 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: creating || !selectedTable ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700' }}>
                {creating ? 'Creando...' : '🪑 Asignar Mesa'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function OrdersTable({ orders, emptyText, onSelect, isClosedTable }) {
  const { tenantId } = useApp()
  const handleMarkReady = async (e, orderId) => {
    e.stopPropagation()
    try {
      const { dbUpdateKitchenStatus } = await import('../../lib/supabase')
      await dbUpdateKitchenStatus(orderId, 'ready')
    } catch(err) {
      alert(err.message)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <th style={{ padding: '10px 16px' }}>ID / Etiqueta</th>
            <th style={{ padding: '10px 16px' }}>Hora</th>
            <th style={{ padding: '10px 16px' }}>Tipo</th>
            <th style={{ padding: '10px 16px' }}>Estado</th>
            <th style={{ padding: '10px 16px' }}>Cliente</th>
            <th style={{ padding: '10px 16px', textAlign: 'right' }}>Total</th>
            {!isClosedTable && <th style={{ padding: '10px 16px', textAlign: 'center' }}>Cocina</th>}
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? orders.map(o => {
            const orderTime = new Date(o.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
            const isDelivOrd = o.order_type === 'delivery'
            const isMesaOrd = !isDelivOrd && !!o.table_db_id
            
            const isReady = o.kitchen_status === 'ready'

            return (
              <tr key={o.id} onClick={() => onSelect(o)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }} className="table-row-hover">
                <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--accent)' }}>
                  #{o.id.slice(-6).toUpperCase()}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{orderTime}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isDelivOrd ? '🛵' : (isMesaOrd ? (
                      <>🪑 <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{o.restaurant_tables?.name || 'Mesa'}</span></>
                    ) : '')}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: isClosedTable ? '#f1f5f9' : '#d1fae5', color: isClosedTable ? '#475569' : '#065f46', textTransform: 'uppercase' }}>
                      {isClosedTable ? 'Pagado' : 'En curso'}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>{o.customer_name || 'Sin nombre'}</td>
                <td style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right', color: 'var(--text-primary)' }}>{fmtMoney(o.total_amount)}</td>
                {!isClosedTable && (
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {isReady ? (
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', background: '#10b981', color: 'white' }}>
                        <><Check size={16} style={{marginRight:4}} /> LISTO</>
                      </span>
                    ) : (
                      <button onClick={(e) => handleMarkReady(e, o.id)} style={{ padding: '4px 10px', borderRadius: '12px', border: '1px solid #f59e0b', background: '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
                        ⏳ PENDIENTE
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          }) : (
            <tr><td colSpan={isClosedTable ? 6 : 7} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
