import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetCategories, dbGetProducts, dbAddItem, dbRemoveItem,
  dbCreateOrder, dbUpdateOrder, dbUpdateTable, dbCreatePayment,
  dbGetOpenSession, dbOpenSession, fmtMoney, dbRecalcOrder, sb
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
  const [payMethod, setPayMethod] = useState('efectivo')
  const [cashIn, setCashIn] = useState('')
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
        return
      }
      try {
        const order = await dbGetOrder(currentContext.orderId)
        if (order) {
          const hasAddr = !!order.delivery_address_id
          setIsDeliveryOrder(hasAddr || order.order_type === 'delivery')
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
    if (tenantId && activeCategory) {
      dbGetProducts(tenantId, activeCategory).then(setProducts)
    }
  }, [tenantId, activeCategory])

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

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

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
          order_type: 'takeaway',
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

  async function addToCart(product) {
    if (!currentContext) return
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

        const oType = isDeliveryOrder ? 'delivery' : (currentContext.type === 'mesa' ? 'dine_in' : 'takeaway')
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
      setCart(prev => {
        const existing = prev.find(i => i.product.id === product.id)
        if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        return [...prev, { product, qty: 1, notes: '' }]
      })
    } catch (e) {
      alert('Error al agregar al carrito: ' + e.message)
    }
  }

  async function changeQty(item, delta) {
    const newQty = item.qty + delta
    if (newQty <= 0) {
      if (item.dbItemId) await dbRemoveItem(item.dbItemId, currentContext?.orderId)
      setCart(prev => prev.filter(i => i.product.id !== item.product.id))
    } else {
      if (item.dbItemId && currentContext?.orderId) {
        const { sb } = await import('../../lib/supabase')
        await sb.from('order_items').update({ quantity: newQty, total_price: newQty * item.product.price }).eq('id', item.dbItemId)
        await dbRecalcOrder(currentContext.orderId)
      }
      setCart(prev => prev.map(i => i.product.id === item.product.id ? { ...i, qty: newQty } : i))
    }
  }

  async function closeSale() {
    if (!currentContext?.orderId || grandTotal === 0) return
    setSaving(true)
    try {
      const session = await dbGetOpenSession(tenantId)
      await dbCreatePayment(tenantId, currentContext.orderId, [{ method: payMethod, amount: grandTotal }], session?.id)
      await dbUpdateOrder(currentContext.orderId, { status: 'paid', discount_amount: discountAmount })
      if (currentContext.tableDbId) {
        await dbUpdateTable(currentContext.tableDbId, { status: 'free', current_order_id: null })
      }
      clearCart()
      setPayModal(false)
      setPayMethod('efectivo')
      setCashIn('')
    } catch (e) {
      alert('Error al cerrar venta: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Assign order (save to DB and mark table as occupied)
  async function assignOrder() {
    if (!currentContext || cart.length === 0) return
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
        }
      }
    } catch (e) {
      alert('Error al asignar pedido: ' + e.message)
    } finally {
      setAssigning(false)
    }
  }

  const change = (parseFloat(cashIn) || 0) - grandTotal

  const contextLabel = currentContext
    ? currentContext.type === 'mesa'
      ? `🪑 ${currentContext.tableName}`
      : currentContext.type === 'delivery' ? '🛵 Delivery' : '🏪 Mostrador'
    : null

  if (currentModule === 'mostrador' && loadingSession) {
    return (
      <aside className="comanda-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Cargando caja...
      </aside>
    )
  }

  if (currentModule === 'mostrador' && !session) {
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

  if ((currentModule === 'mostrador' || currentModule === 'delivery') && (!currentContext || (currentContext.type !== 'mostrador' && currentContext.type !== 'delivery'))) {
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
          <span className="comanda-title">
            {currentContext ? contextLabel : 'Selecciona una mesa'}
          </span>
          {currentContext && (
            <span className="comanda-context">
              {currentContext.orderId ? `🔴 Pedido activo (#${currentContext.orderId.slice(-6).toUpperCase()})` : '🟢 Nuevo Pedido'}
            </span>
          )}
        </div>
        {currentContext && (currentContext.type === 'mostrador' || currentContext.type === 'delivery') && (
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
            onChange={e => {
              setSearch(e.target.value)
              if (e.target.value) dbGetProducts(tenantId).then(setProducts)
            }}
          />
        </div>
        {!activeCategory || search ? (
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
            <div key={i} className="cart-item">
              <span className="cart-item-name">{item.product.name}</span>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => changeQty(item, -1)}>−</button>
                <span className="qty-display">{item.qty}</span>
                <button className="qty-btn" onClick={() => changeQty(item, 1)}>+</button>
              </div>
              <span className="cart-item-price">{fmtMoney(item.product.price * item.qty)}</span>
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

      {/* Payment Modal */}
      <Modal show={payModal} onClose={() => setPayModal(false)} wide>
        <div className="payment-modal">
          <div className="modal-left">
            <h2>Resumen del Pedido</h2>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span>{item.qty}x {item.product.name}</span>
                <span>{fmtMoney(item.product.price * item.qty)}</span>
              </div>
            ))}
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL A PAGAR</div>
              <div className="payment-total-big">{fmtMoney(grandTotal)}</div>
            </div>
          </div>
          <div className="modal-right">
            <h3>Medio de Pago</h3>
            <div className="pay-methods">
              {[['efectivo','💵 Efectivo'],['debito','💳 Débito'],['credito','💳 Crédito'],['mercadopago','📱 MercadoPago'],['transferencia','🏦 Transfer.']].map(([m, label]) => (
                <button key={m} className={`pay-method${payMethod === m ? ' selected' : ''}`} onClick={() => setPayMethod(m)}>{label}</button>
              ))}
            </div>
            {payMethod === 'efectivo' && (
              <div className="cash-section">
                <label>Paga con</label>
                <input type="number" placeholder="0.00" value={cashIn} onChange={e => setCashIn(e.target.value)} />
                {cashIn && <div className="change-display"><span>Vuelto:</span><span className="change-amount">{fmtMoney(Math.max(0, change))}</span></div>}
              </div>
            )}
            <button className="btn-close-sale" onClick={closeSale} disabled={saving}>
              {saving ? 'Procesando...' : '✅ CERRAR VENTA'}
            </button>
            <button className="btn-cancel-modal" onClick={() => setPayModal(false)}>Cancelar</button>
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
