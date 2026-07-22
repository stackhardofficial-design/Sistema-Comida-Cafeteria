import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetCategories, dbGetProducts, dbAddItem, dbRemoveItem,
  dbCreateOrder, dbUpdateOrder, dbUpdateTable, dbCreatePayment,
  dbGetOpenSession, dbOpenSession, fmtMoney, dbRecalcOrder, sb, logActivity,
  dbGetZones, dbGetTables, dbGetOrder, dbDeductStockForOrder
} from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function ComandaPanel() {
  const {
    tenantId, currentContext, setCurrentContext,
    cart, setCart, discount, setDiscount, clearCart,
    cartTotal, discountAmount, grandTotal, refreshTrigger,
    currentModule, triggerRefresh
  } = useApp()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [discountModal, setDiscountModal] = useState(false)
  const [payMethod, setPayMethod] = useState('cash')
  const [payAmount, setPayAmount] = useState('')
  const [payments, setPayments] = useState([])
  const [tipMode, setTipMode] = useState('none') // 'none', '10', 'custom'
  const [customTip, setCustomTip] = useState('')
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Estados para arqueo de caja (mostrador)
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [openCajaModal, setOpenCajaModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')

  // Estados locales para delivery
  const [isDeliveryOrder, setIsDeliveryOrder] = useState(false)
  const [delivStreet, setDelivStreet] = useState('')
  const [delivDesc, setDelivDesc] = useState('')
  const [delivMapsUrl, setDelivMapsUrl] = useState('')
  const [delivExpanded, setDelivExpanded] = useState(false)

  // Estados para trasladar a mesa
  const [assignTableModal, setAssignTableModal] = useState(false)
  const [zones, setZones] = useState([])
  const [tables, setTables] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [loadingTables, setLoadingTables] = useState(false)

  async function loadSession() {
    if (!tenantId) return
    try {
      setLoadingSession(true)
      const activeSession = await dbGetOpenSession(tenantId)
      setSession(activeSession)
    } catch (e) {
      console.error('Error al cargar la sesión de caja:', e)
    } finally {
      setLoadingSession(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [tenantId, refreshTrigger])

  // Cargar datos de la dirección al cambiar el pedido
  useEffect(() => {
    async function fetchOrderDetails() {
      if (!currentContext?.orderId) {
        const isDelivMod = currentContext?.type === 'delivery'
        setIsDeliveryOrder(isDelivMod)
        setDelivStreet(currentContext?.address || '')
        setDelivDesc('')
        setDelivMapsUrl('')
        setDelivExpanded(isDelivMod)
        return
      }
      try {
        const order = await dbGetOrder(currentContext.orderId)
        if (order) {
          const hasAddr = !!order.delivery_address_id
          const isDeliv = hasAddr || order.order_type === 'delivery'
          setIsDeliveryOrder(isDeliv)
          setDelivExpanded(isDeliv)
          if (order.delivery_addresses) {
            setDelivStreet(order.delivery_addresses.street_address || '')
            const [desc, maps] = (order.delivery_addresses.reference || '').split(' | ')
            setDelivDesc(desc || '')
            setDelivMapsUrl(maps || '')
          } else {
            setDelivStreet('')
            setDelivDesc('')
            setDelivMapsUrl('')
          }
        }
      } catch (e) {
        console.error('Error al cargar detalles de la orden en comanda:', e)
      }
    }
    fetchOrderDetails()
  }, [currentContext?.orderId, currentContext?.type])

  // true when this is a new order that hasn't been assigned yet
  const isNewOrder = currentContext?.type === 'mesa' && !currentContext?.hasOrder && !currentContext?.orderId

  const refreshCats = useCallback(() => {
    if (tenantId) dbGetCategories(tenantId).then(setCategories)
  }, [tenantId])

  const refreshProds = useCallback(() => {
    if (tenantId) {
      dbGetProducts(tenantId).then(setProducts)
    }
  }, [tenantId])

  useEffect(() => {
    refreshCats()
  }, [refreshCats, refreshTrigger])

  useEffect(() => {
    refreshProds()
  }, [refreshProds, refreshTrigger])

  useEffect(() => {
    if (!tenantId) return
    const comandaChannel = sb.channel('realtime-comanda')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `tenant_id=eq.${tenantId}` },
        () => { refreshCats() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `tenant_id=eq.${tenantId}` },
        () => { refreshProds() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_register_sessions', filter: `tenant_id=eq.${tenantId}` },
        () => { loadSession() }
      )
      .subscribe()

    return () => {
      sb.removeChannel(comandaChannel)
    }
  }, [tenantId, refreshCats, refreshProds])

  async function handleAbrirCaja() {
    const amount = parseFloat(openingAmount) || 0
    try {
      await dbOpenSession(tenantId, amount)
      setOpenCajaModal(false)
      setOpeningAmount('')
      triggerRefresh()
    } catch (e) {
      alert('Error al abrir caja: ' + e.message)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    const matchCategory = activeCategory ? p.category_id === activeCategory : true
    return matchSearch && matchCategory
  })

  async function saveDeliveryInfo(street, desc, maps) {
    if (!currentContext?.orderId) return
    try {
      const fullReference = `${desc || ''} | ${maps || ''}`
      const order = await dbGetOrder(currentContext.orderId)
      if (order.delivery_address_id) {
        await sb.from('delivery_addresses').update({
          street_address: street || '',
          reference: fullReference
        }).eq('id', order.delivery_address_id)
      } else {
        const { data: addr, error: errAddr } = await sb.from('delivery_addresses').insert({
          tenant_id: tenantId,
          customer_name: order.customer_name || 'Cliente Delivery',
          street_address: street || '',
          reference: fullReference,
          country: 'AR'
        }).select().single()
        if (errAddr) throw errAddr
        
        await sb.from('orders').update({
          delivery_address_id: addr.id,
          order_type: 'delivery'
        }).eq('id', order.id)
      }
      triggerRefresh()
    } catch (e) {
      console.error('Error al guardar datos de delivery:', e)
    }
  }

  async function handleToggleDeliveryType(e) {
    const checked = e.target.checked
    setIsDeliveryOrder(checked)
    
    if (!currentContext?.orderId) return
    
    try {
      if (checked) {
        const { data: addr } = await sb.from('delivery_addresses').insert({
          tenant_id: tenantId,
          customer_name: currentContext.customerName || 'Cliente Mostrador',
          street_address: delivStreet || '',
          reference: `${delivDesc || ''} | ${delivMapsUrl || ''}`,
          country: 'AR'
        }).select().single()
        
        await sb.from('orders').update({
          order_type: 'delivery',
          delivery_address_id: addr?.id || null
        }).eq('id', currentContext.orderId)
      } else {
        const order = await dbGetOrder(currentContext.orderId)
        await sb.from('orders').update({
          order_type: 'dine_in',
          delivery_address_id: null
        }).eq('id', currentContext.orderId)
        
        if (order.delivery_address_id) {
          await sb.from('delivery_addresses').delete().eq('id', order.delivery_address_id)
        }
      }
      triggerRefresh()
    } catch (e) {
      console.error('Error al cambiar tipo de pedido:', e)
    }
  }

  async function openAssignTable() {
    setAssignTableModal(true)
    setLoadingTables(true)
    try {
      const [z, t] = await Promise.all([dbGetZones(tenantId), dbGetTables(tenantId)])
      setZones(z)
      setTables(t)
      if (z.length > 0) setSelectedZone(z[0].id)
    } catch (e) {
      console.error('Error loading tables:', e)
    } finally {
      setLoadingTables(false)
    }
  }

  async function handleAssignTable() {
    if (!selectedTable) return
    setAssigning(true)
    try {
      const order = await dbGetOrder(currentContext.orderId)

      // Update order: assign table and set type to dine_in
      const { error } = await sb.from('orders').update({
        order_type: 'dine_in',
        table_db_id: selectedTable.id,
        delivery_address_id: null
      }).eq('id', currentContext.orderId)
      if (error) throw error

      // Mark table as occupied
      await sb.from('restaurant_tables').update({
        status: 'occupied',
        current_order_id: currentContext.orderId
      }).eq('id', selectedTable.id)

      // Clean up delivery address if it existed
      if (order.delivery_address_id) {
        await sb.from('delivery_addresses').delete().eq('id', order.delivery_address_id)
      }

      setCurrentContext({
        type: 'mesa',
        orderId: currentContext.orderId,
        tableName: selectedTable.name,
        tableDbId: selectedTable.id
      })
      
      setAssignTableModal(false)
      setSelectedTable(null)
      triggerRefresh()
    } catch (e) {
      console.error('Error asignando mesa:', e)
      alert('Error al asignar mesa: ' + (e.message || e))
    } finally {
      setAssigning(false)
    }
  }

  async function addToCart(product) {
    if (!currentContext) return
    // --- OPTIMISTIC UPDATE: Show in cart immediately ---
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1, notes: '' }]
    })
    // --- SYNC TO DB IN BACKGROUND ---
    try {
      let orderId = currentContext.orderId
      if (!orderId) {
        let addressId = null
        if (isDeliveryOrder) {
          const { data: addr } = await sb.from('delivery_addresses').insert({
            tenant_id: tenantId,
            customer_name: currentContext.customerName || 'Cliente Delivery',
            street_address: delivStreet || '',
            reference: `${delivDesc || ''} | ${delivMapsUrl || ''}`,
            country: 'AR'
          }).select().single()
          addressId = addr?.id
        }
        const oType = isDeliveryOrder ? 'delivery' : 'dine_in'
        const order = await dbCreateOrder(tenantId, oType, currentContext.tableDbId)
        orderId = order.id
        if (addressId) {
          await sb.from('orders').update({ delivery_address_id: addressId }).eq('id', orderId)
        }
        setCurrentContext(prev => ({ ...prev, orderId }))
        if (currentContext.tableDbId) {
          await dbUpdateTable(currentContext.tableDbId, { status: 'occupied', current_order_id: orderId })
        }
      }
      await dbAddItem(tenantId, orderId, product)
    } catch (e) {
      // Rollback optimistic update on failure
      setCart(prev => {
        const existing = prev.find(i => i.product.id === product.id)
        if (!existing) return prev
        if (existing.qty <= 1) return prev.filter(i => i.product.id !== product.id)
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty - 1 } : i)
      })
      alert('Error al agregar al carrito: ' + e.message)
    }
  }

  async function changeQty(item, delta) {
    const newQty = item.qty + delta
    if (newQty <= 0) {
      if (item.dbItemId) await dbRemoveItem(item.dbItemId, currentContext?.orderId)
      setCart(prev => prev.filter(i => i.product?.id !== item.product?.id))
    } else {
      if (item.dbItemId && currentContext?.orderId) {
        const { sb } = await import('../../lib/supabase')
        await sb.from('order_items').update({ quantity: newQty, total_price: newQty * (item.product?.price || 0) }).eq('id', item.dbItemId)
        await dbRecalcOrder(currentContext.orderId)
      }
      setCart(prev => prev.map(i => i.product?.id === item.product?.id ? { ...i, qty: newQty } : i))
    }
  }

  async function closeSale() {
    if (!currentContext?.orderId || payments.length === 0) return
    setSaving(true)
    try {
      const session = await dbGetOpenSession(tenantId)
      const calculatedTip = tipMode === '10' ? grandTotal * 0.1 : (tipMode === 'custom' ? parseFloat(customTip) || 0 : 0)
      const totalPaid = payments.reduce((s, p) => s + p.amount - (p.change || 0), 0)
      
      const tipTotal = calculatedTip
      // Attach tip_amount proportionally to each payment
      const paymentsWithTip = payments.map((p, idx) => ({
        ...p,
        tip_amount: idx === payments.length - 1 ? parseFloat(tipTotal.toFixed(2)) : 0
      }))
      await dbCreatePayment(tenantId, currentContext.orderId, paymentsWithTip, session?.id)
      await dbUpdateOrder(currentContext.orderId, { status: 'paid', discount_amount: discountAmount })

      // Log the payment activity
      const { data: { user: authUser } } = await sb.auth.getUser()
      logActivity(
        tenantId,
        authUser?.id,
        authUser?.email?.split('@')[0] || 'Empleado',
        'CLOSE_SALE',
        'order',
        {
          order_id: currentContext.orderId,
          context: currentContext.customerName || currentContext.tableName || currentContext.type,
          total: grandTotal,
          total_paid: totalPaid,
          methods: payments.map(p => `${p.method}: $${p.amount}`),
          items_count: cart.length
        }
      )

      if (currentContext.tableDbId) {
        await dbUpdateTable(currentContext.tableDbId, { status: 'free', current_order_id: null })
      }
      // Deduct ingredient stock based on recipe
      await dbDeductStockForOrder(tenantId, currentContext.orderId)
      clearCart()
      setPayModal(false)
      setPayments([])
      setPayAmount('')
      setTipMode('none')
      setCustomTip('')
      setPayMethod('cash')
      triggerRefresh()
    } catch (e) {
      alert('Error al cerrar venta: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Assign order (save to DB and mark table as occupied)
  async function assignOrder() {
    if (!currentContext) return
    setAssigning(true)
    try {
      let orderId = currentContext.orderId
      if (!orderId) {
        const order = await dbCreateOrder(
          tenantId,
          'dine_in',
          currentContext.tableDbId,
          currentContext.customerName || null
        )
        orderId = order.id
        setCurrentContext(prev => ({ ...prev, orderId, hasOrder: true }))
        if (currentContext.tableDbId) {
          await dbUpdateTable(currentContext.tableDbId, { status: 'occupied', current_order_id: orderId })
          triggerRefresh()
        }
      }
    } catch (e) {
      alert('Error al asignar pedido: ' + e.message)
    } finally {
      setAssigning(false)
    }
  }

  const contextLabel = currentContext
    ? currentContext.type === 'mesa'
      ? `🪑 ${currentContext.tableName}`
      : currentContext.type === 'delivery'
        ? `🛵 ${currentContext.customerName || 'Delivery'}`
        : `🏪 ${currentContext.customerName || 'Mostrador'}`
    : null

  if (currentModule === 'mostrador' && loadingSession && currentContext?.type !== 'delivery') {
    return (
      <aside className="comanda-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Cargando caja...
      </aside>
    )
  }

  if (currentModule === 'mostrador' && !session && currentContext?.type !== 'delivery') {
    return (
      <aside className="comanda-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px', textAlign: 'center', gap: '16px' }}>
          <div style={{ fontSize: '48px' }}>🏧</div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Arqueo de caja cerrado</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Abrí uno para darle seguimiento a las ventas.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setOpenCajaModal(true)}
            style={{ 
              padding: '10px 16px', 
              background: 'var(--accent)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: '600', 
              cursor: 'pointer' 
            }}
          >
            Nuevo arqueo
          </button>
        </div>

        <Modal show={openCajaModal} onClose={() => setOpenCajaModal(false)} title="🔓 Abrir Caja">
          <div>
            <div className="form-row" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Saldo Inicial (cambio en caja)</label>
              <input
                type="number"
                placeholder="0.00"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border)', 
                  background: 'var(--input-bg, #fff)', 
                  color: 'var(--text)' 
                }}
                autoFocus
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setOpenCajaModal(false)}
                style={{ padding: '8px 14px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
               </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAbrirCaja}
                style={{ padding: '8px 14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Abrir Caja
              </button>
            </div>
          </div>
        </Modal>
      </aside>
    )
  }

  if ((currentModule === 'mostrador' || currentModule === 'delivery') && !currentContext) {
    const isMostrador = currentModule === 'mostrador'
    return (
      <aside className="comanda-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px', textAlign: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>{isMostrador ? '🏪' : '🛵'}</span>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isMostrador ? 'Seleccioná un pedido del mostrador' : 'Seleccioná un pedido de delivery'}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>‹ o creá uno nuevo</span>
        </div>
      </aside>
    )
  }

  return (
    <aside className="comanda-panel">
      {/* Header */}
      <div className="comanda-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="order-number">{currentContext?.orderId ? `#${currentContext.orderId.slice(-6).toUpperCase()}` : ''}</span>
              {currentContext?.type === 'mesa' && <h2 className="table-name">🪑 {currentContext.tableName}</h2>}
              {currentContext?.type === 'mostrador' && <h2 className="table-name">🏪 Mostrador</h2>}
              {currentContext?.type === 'delivery' && <h2 className="table-name">🛵 Delivery</h2>}
            </div>
          </div>
          <div className="client-name">
            👤 {currentContext?.customerName || 'Consumidor Final'}
          </div>
        </div>
        {currentContext && ['mostrador', 'delivery'].includes(currentModule) && (
          <button 
            onClick={clearCart} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Volver al mostrador (Guardar)"
          >
            ✕
          </button>
        )}
      </div>

      {/* Acción Prominente: Trasladar a Mesa (Solo Mostrador) */}
      {currentContext?.type === 'mostrador' && currentContext?.orderId && (
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={openAssignTable}
            style={{
              width: '100%', padding: '12px', background: 'var(--accent)', color: 'white', 
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: '16px' }}>🪑</span> Asignar a una Mesa
          </button>
        </div>
      )}

      {/* Sección Desplegable de Datos de Delivery */}
      {currentContext && (currentContext.type === 'mostrador' || currentContext.type === 'delivery') && (
        <div style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
          <button 
            onClick={() => setDelivExpanded(!delivExpanded)}
            style={{ 
              width: '100%', 
              padding: '10px 16px', 
              background: 'none', 
              border: 'none', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              color: '#475569', 
              cursor: 'pointer' 
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛵</span> Datos de Envío {isDeliveryOrder ? '(Activo)' : '(Inactivo)'}
            </span>
            <span>{delivExpanded ? '▲' : '▼'}</span>
          </button>
          
          {delivExpanded && (
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)' }}>
              {currentContext.type === 'mostrador' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={isDeliveryOrder} 
                    onChange={handleToggleDeliveryType} 
                  />
                  Enviar por Delivery
                </label>
              )}

              {isDeliveryOrder && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Dirección *</label>
                    <input 
                      type="text" 
                      placeholder="Calle y altura..." 
                      value={delivStreet}
                      onChange={e => setDelivStreet(e.target.value)}
                      onBlur={() => saveDeliveryInfo(delivStreet, delivDesc, delivMapsUrl)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white', color: '#334155' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Descripción / Indicaciones</label>
                    <input 
                      type="text" 
                      placeholder="Piso, depto, color de puerta..." 
                      value={delivDesc}
                      onChange={e => setDelivDesc(e.target.value)}
                      onBlur={() => saveDeliveryInfo(delivStreet, delivDesc, delivMapsUrl)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white', color: '#334155' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Enlace de Google Maps</label>
                    <input 
                      type="text" 
                      placeholder="https://maps.app.goo.gl/..." 
                      value={delivMapsUrl}
                      onChange={e => setDelivMapsUrl(e.target.value)}
                      onBlur={() => saveDeliveryInfo(delivStreet, delivDesc, delivMapsUrl)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white', color: '#334155' }}
                    />
                  </div>

                  {(delivMapsUrl || delivStreet) && (
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Vista previa de ubicación:
                      </span>
                      <iframe 
                        width="100%" 
                        height="160" 
                        frameBorder="0" 
                        style={{ border: 0, borderRadius: '8px', background: '#e2e8f0' }} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(delivMapsUrl ? delivMapsUrl : delivStreet)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search + Categories */}
      <div className="comanda-search-zone">
        <div className="search-bar">
          <span>🔍</span>
          <input
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {!activeCategory && !search ? (
          <div className="category-grid">
            {categories.map(c => (
              <button key={c.id} className="cat-btn" onClick={() => { setActiveCategory(c.id); setSearch('') }}>
                <span className="cat-icon">{c.icon || '🍽️'}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button className="btn-back" onClick={() => setActiveCategory(null)}>← Volver</button>
            <div className="products-list">
              {filteredProducts.map(p => (
                <button key={p.id} className="product-btn" onClick={() => addToCart(p)} disabled={!currentContext}>
                  <span className="prod-name">{p.name}</span>
                  <span className="prod-price">{fmtMoney(p.price)}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Sin productos</p>}
            </div>
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="comanda-cart">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p>Carrito vacío</p>
          </div>
        ) : (
          cart.map((item, i) => (
            <div key={i} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="cart-item-name">{item.product?.name || 'Producto eliminado'}</span>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => changeQty(item, -1)}>−</button>
                  <span className="qty-display">{item.qty}</span>
                  <button className="qty-btn" onClick={() => changeQty(item, 1)}>+</button>
                </div>
                <span className="cart-item-price">{fmtMoney((item.product?.price || 0) * item.qty)}</span>
              </div>
              <input
                type="text"
                placeholder="Ej. sin cebolla..."
                value={item.notes || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setCart(prev => prev.map((it, idx) => idx === i ? { ...it, notes: val } : it))
                }}
                onBlur={async (e) => {
                  if (item.dbItemId && currentContext?.orderId) {
                    try {
                      const { sb } = await import('../../lib/supabase')
                      await sb.from('order_items').update({ notes: e.target.value }).eq('id', item.dbItemId)
                    } catch(err) { console.error(err) }
                  }
                }}
                style={{
                  marginTop: '6px', padding: '6px 8px', fontSize: '11px', borderRadius: '4px',
                  border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)',
                  width: '100%', boxSizing: 'border-box'
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="comanda-footer">
        <div className="comanda-totals">
          <div className="total-row"><span>Subtotal</span><span>{fmtMoney(cartTotal)}</span></div>
          {discountAmount > 0 && (
            <div className="total-row" style={{ color: 'var(--red)' }}>
              <span>Descuento</span><span>-{fmtMoney(discountAmount)}</span>
            </div>
          )}
          <div className="total-grand"><span>TOTAL</span><span>{fmtMoney(grandTotal)}</span></div>
        </div>
        <div className="comanda-btns">
          <button className="btn-discount" onClick={() => setDiscountModal(true)}>🏷️ Descuento</button>
          {isNewOrder ? (
            <button
              className="btn-cobrar"
              disabled={cart.length === 0 || assigning}
              onClick={assignOrder}
              style={{ background: 'var(--accent, #f59e0b)' }}
            >
              {assigning ? 'Asignando...' : '📋 ASIGNAR PEDIDO'}
            </button>
          ) : (
            <>
              <button
                className="btn-cobrar"
                disabled={cart.length === 0}
                onClick={() => setPayModal(true)}
              >
                💳 COBRAR
              </button>
              {(currentContext?.type === 'mostrador' || currentContext?.type === 'delivery') && (
                <button
                  className="btn-discount"
                  style={{ background: 'var(--border)', color: 'var(--text-primary)', marginTop: '4px' }}
                  onClick={clearCart}
                >
                  💾 GUARDAR Y VOLVER
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal (Multi-Pago y Ticket) */}
      <Modal show={payModal} onClose={() => { setPayModal(false); setPayments([]); setPayAmount(''); setIncludeTip(false); }} wide>
        <div className="payment-modal">
          {/* TICKET PROFESIONAL */}
          <div className="modal-left" style={{ background: 'var(--surface, #fff)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px dashed var(--border)', paddingBottom: '16px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>TICKET DE VENTA</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Comprobante interno</div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '30vh' }}>
              {cart.map((item, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 600, marginRight: 8 }}>{item.qty}x</span>
                      <span>{item.product?.name || 'Producto eliminado'}</span>
                    </div>
                    <span style={{ fontWeight: 500 }}>{fmtMoney((item.product?.price || 0) * item.qty)}</span>
                  </div>
                  {item.notes && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px', fontStyle: 'italic', paddingLeft: '24px' }}>
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ paddingTop: '16px', borderTop: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Subtotal:</span>
                <span>{fmtMoney(cartTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--red)' }}>
                  <span>Descuento:</span>
                  <span>-{fmtMoney(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                <span>Total sin propina:</span>
                <span>{fmtMoney(grandTotal)}</span>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Propina a registrar:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setTipMode('none')} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', borderRadius: '6px', border: '1px solid', borderColor: tipMode === 'none' ? 'var(--accent)' : 'var(--border)', background: tipMode === 'none' ? 'var(--accent)' : 'var(--surface)', color: tipMode === 'none' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>0%</button>
                  <button onClick={() => setTipMode('10')} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', borderRadius: '6px', border: '1px solid', borderColor: tipMode === '10' ? 'var(--accent)' : 'var(--border)', background: tipMode === '10' ? 'var(--accent)' : 'var(--surface)', color: tipMode === '10' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>10% ({fmtMoney(grandTotal * 0.1)})</button>
                  <button onClick={() => { setTipMode('custom'); setCustomTip('') }} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', borderRadius: '6px', border: '1px solid', borderColor: tipMode === 'custom' ? 'var(--accent)' : 'var(--border)', background: tipMode === 'custom' ? 'var(--accent)' : 'var(--surface)', color: tipMode === 'custom' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Monto...</button>
                </div>
                {tipMode === 'custom' && (
                  <input type="number" placeholder="Monto exacto de propina" value={customTip} onChange={e => setCustomTip(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 'bold' }} autoFocus />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '16px', color: 'var(--accent)', borderTop: '2px dashed var(--border)', paddingTop: '16px' }}>
                <span>TOTAL A PAGAR:</span>
                <span>{fmtMoney(grandTotal + (tipMode === '10' ? grandTotal * 0.1 : (tipMode === 'custom' ? parseFloat(customTip) || 0 : 0)))}</span>
              </div>
            </div>
          </div>

          {/* MULTI PAGOS */}
          <div className="modal-right" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px' }}>
            <h3>Medio de Pago</h3>
            
            <div className="pay-methods" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[['cash','💵 Efectivo'],['card','💳 Tarjeta'],['transfer','🏦 Transfer.']].map(([m, label]) => (
                <button 
                  key={m} 
                  className={`pay-method${payMethod === m ? ' selected' : ''}`} 
                  onClick={() => setPayMethod(m)}
                  style={{ padding: '12px 8px', fontSize: '13px', borderRadius: '6px' }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--bg, #f8fafc)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Saldo Restante:</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--red)' }}>
                  {fmtMoney(Math.max(0, (grandTotal + (tipMode === '10' ? grandTotal * 0.1 : (tipMode === 'custom' ? parseFloat(customTip) || 0 : 0))) - payments.reduce((sum, p) => sum + p.amount - (p.change || 0), 0)))}
                </span>
              </div>
              
              {(() => {
                const currentAmt = parseFloat(payAmount) || 0;
                const calculatedTotal = grandTotal + (tipMode === '10' ? grandTotal * 0.1 : (tipMode === 'custom' ? parseFloat(customTip) || 0 : 0));
                const currentBalance = calculatedTotal - payments.reduce((sum, p) => sum + p.amount - (p.change || 0), 0);
                const change = currentAmt > currentBalance ? currentAmt - currentBalance : 0;
                
                return (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="number" 
                        placeholder="Monto a pagar" 
                        value={payAmount} 
                        onChange={e => setPayAmount(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                      <button 
                        className="btn btn-primary"
                        disabled={!payAmount || parseFloat(payAmount) <= 0}
                        onClick={() => {
                          const amt = parseFloat(payAmount)
                          if (amt <= 0) return
                          let finalChange = 0
                          if (payMethod === 'cash' && amt > currentBalance) {
                            finalChange = amt - currentBalance
                          }
                          setPayments([...payments, { method: payMethod, amount: amt, change: finalChange }])
                          setPayAmount('')
                        }}
                        style={{ padding: '0 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600' }}
                      >
                        Añadir
                      </button>
                    </div>
                    {change > 0 && payMethod === 'cash' && (
                      <div style={{ marginTop: '8px', padding: '10px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', fontSize: '13px', color: '#065f46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Vuelto calculado: <strong>{fmtMoney(change)}</strong></span>
                        <button 
                          onClick={() => {
                            setTipMode('custom')
                            const currentTip = tipMode === 'custom' ? (parseFloat(customTip) || 0) : (tipMode === '10' ? grandTotal * 0.1 : 0)
                            setCustomTip((currentTip + change).toString())
                          }}
                          style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                        >
                          ¿Vuelto como propina?
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {payments.length > 0 && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Pagos Añadidos:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg, #f8fafc)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px' }}>
                          {p.method === 'cash' ? '💵' : p.method === 'card' ? '💳' : '🏦'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>
                            {p.method === 'cash' ? 'Efectivo' : p.method === 'card' ? 'Tarjeta' : 'Transferencia'}
                          </span>
                          {p.change > 0 && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Vuelto: {fmtMoney(p.change)}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600 }}>{fmtMoney(p.amount)}</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px' }}
                          onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const targetTotal = grandTotal + (tipMode === '10' ? grandTotal * 0.1 : (tipMode === 'custom' ? parseFloat(customTip) || 0 : 0));
              const currentPaid = payments.reduce((sum, p) => sum + p.amount - (p.change || 0), 0);
              const pending = targetTotal - currentPaid;
              const isReady = payments.length > 0 && pending <= 0.01;
              return (
                <button 
                  className="btn-close-sale" 
                  onClick={closeSale} 
                  disabled={saving || !isReady}
                  style={{ 
                    marginTop: 'auto', 
                    background: (saving || !isReady) ? 'var(--border)' : 'var(--green)',
                    color: 'white',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: (saving || !isReady) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Procesando...' : '✅ CERRAR VENTA'}
                </button>
              )
            })()}
            <button 
              className="btn-cancel-modal" 
              onClick={() => { setPayModal(false); setPayments([]); setPayAmount(''); setTipMode('none'); setCustomTip(''); }}
              style={{ padding: '16px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Discount Modal */}
      <Modal show={discountModal} onClose={() => setDiscountModal(false)} title="Aplicar Descuento">
        <DiscountForm discount={discount} setDiscount={setDiscount} cartTotal={cartTotal} onClose={() => setDiscountModal(false)} />
      </Modal>
    </aside>
  )
}

function DiscountForm({ discount, setDiscount, cartTotal, onClose }) {
  const [type, setType] = useState(discount.type === 'none' ? 'percent' : discount.type)
  const [value, setValue] = useState(discount.value || '')
  const preview = type === 'percent' ? cartTotal * (value / 100) : parseFloat(value) || 0

  function apply(e) {
    e.preventDefault()
    setDiscount({ type, value: parseFloat(value) || 0 })
    onClose()
  }

  return (
    <form onSubmit={apply}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 13 }}>
        {[['percent', 'Porcentaje (%)'], ['fixed', 'Monto fijo ($)']].map(([t, label]) => (
          <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="radio" checked={type === t} onChange={() => setType(t)} /> {label}
          </label>
        ))}
      </div>
      <div className="form-row">
        <input type="number" min={0} value={value} onChange={e => setValue(e.target.value)} placeholder="0" autoFocus />
      </div>
      {value > 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Descuento: <strong style={{ color: 'var(--red)' }}>{fmtMoney(preview)}</strong>
      </p>}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => { setDiscount({ type: 'none', value: 0 }); onClose() }}>Quitar</button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Aplicar</button>
      </div>
    </form>
  )
}
