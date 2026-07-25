import {     Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock , TrendingDown , ArrowDown , PenSquare , Unlock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetCategories, dbGetProducts, dbAddItem, dbRemoveItem,
  dbCreateOrder, dbUpdateOrder, dbUpdateTable, dbCreatePayment,
  dbGetOpenSession, dbOpenSession, fmtMoney, dbRecalcOrder, sb, logActivity,
  dbGetZones, dbGetTables, dbGetOrder, dbDeductStockForOrder
} from '../../lib/supabase'
import Modal from '../../components/Modal'
import { CategoryIconDisplay } from '../../lib/categoryIcons'

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
  const [payEfectivo, setPayEfectivo] = useState('')
  const [payTarjeta, setPayTarjeta] = useState('')
  const [payTransferencia, setPayTransferencia] = useState('')
  const [excesoComoPropina, setExcesoComoPropina] = useState(false) // 'none', '10', 'custom'
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
    setCart(prev => {
      const existing = prev.find(i => i.product?.id === product.id)
      if (existing) return prev.map(i => i.product?.id === product.id ? { ...i, qty: i.qty + 1 } : i)
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
        const existing = prev.find(i => i.product?.id === product.id)
        if (!existing) return prev
        if (existing.qty <= 1) return prev.filter(i => i.product?.id !== product.id)
        return prev.map(i => i.product?.id === product.id ? { ...i, qty: i.qty - 1 } : i)
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
    if (!currentContext?.orderId) return
    setSaving(true)
    try {
      const amtEf = parseFloat(payEfectivo) || 0;
      const amtTa = parseFloat(payTarjeta) || 0;
      const amtTr = parseFloat(payTransferencia) || 0;
      const totalPaid = amtEf + amtTa + amtTr;

      if (totalPaid < grandTotal - 0.01) {
        alert('El monto pagado no cubre el total de la venta.')
        setSaving(false)
        return
      }

      const difference = totalPaid - grandTotal;
      let change = 0;
      let tip = 0;

      if (difference > 0.01) {
        if (excesoComoPropina) {
          tip = difference;
        } else {
          change = difference;
        }
      }

      const finalPayments = [];
      if (amtEf > 0) finalPayments.push({ method: 'cash', amount: amtEf, change: change > 0 ? change : 0 })
      if (amtTa > 0) finalPayments.push({ method: 'card', amount: amtTa, change: 0 })
      if (amtTr > 0) finalPayments.push({ method: 'transfer', amount: amtTr, change: 0 })

      if (finalPayments.length === 0) {
        finalPayments.push({ method: 'cash', amount: 0, change: 0 })
      }

      let sessionId = null
      try {
        const sess = await Promise.race([
          dbGetOpenSession(tenantId),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
        ])
        sessionId = sess?.id || null
      } catch (_) { }

      const paymentsWithTip = finalPayments.map((p, idx) => ({
        ...p,
        tip_amount: idx === 0 ? parseFloat(tip.toFixed(2)) : 0
      }))

      await dbCreatePayment(tenantId, currentContext.orderId, paymentsWithTip, sessionId)
      await dbUpdateOrder(currentContext.orderId, { status: isDeliveryOrder ? 'open' : 'paid', discount_amount: discountAmount })
      if (currentContext.tableDbId) {
        await dbUpdateTable(currentContext.tableDbId, { status: 'free', current_order_id: null })
      }

      const _orderId = currentContext.orderId
      const _ctx = { ...currentContext }
      dbDeductStockForOrder(tenantId, _orderId).catch(e =>
        console.warn('Stock deduction background error:', e.message)
      )
      sb.auth.getUser().then(({ data }) => {
        const authUser = data?.user
        logActivity(
          tenantId,
          authUser?.id,
          authUser?.email?.split('@')[0] || 'Empleado',
          'CLOSE_SALE',
          'order',
          {
            order_id: _orderId,
            context: _ctx.customerName || _ctx.tableName || _ctx.type,
            total: grandTotal,
            total_paid: totalPaid,
            methods: finalPayments.map(p => `${p.method}: $${p.amount}`),
            items_count: cart.length
          }
        )
      }).catch(() => {})

      clearCart()
      setPayModal(false)
      setPayEfectivo('')
      setPayTarjeta('')
      setPayTransferencia('')
      setExcesoComoPropina(false)
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
      ? "<><Grid size={16} style={{marginRight: 6}}/> " + currentContext.tableName + "</>"
      : currentContext.type === 'delivery'
        ? `🛵 ${currentContext.customerName || 'Delivery'}`
        : "<><MonitorSmartphone size={16} style={{marginRight: 6}}/> " + (currentContext.customerName || 'Mostrador') + "</>"
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

        <Modal show={openCajaModal} onClose={() => setOpenCajaModal(false)} title={<><Unlock size={16} style={{marginRight:6}}/> Abrir Caja</>}>
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
                  color: 'var(--text-primary)' 
                }}
                autoFocus
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setOpenCajaModal(false)}
                style={{ padding: '8px 14px', background: 'var(--border)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
          <span style={{ fontSize: '32px' }}>{isMostrador ? '' : '🛵'}</span>
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
              {currentContext?.type === 'mesa' && <h2 className="table-name"><Grid size={18} style={{marginRight:6}} /> {currentContext.tableName}</h2>}
              {currentContext?.type === 'mostrador' && <h2 className="table-name"><MonitorSmartphone size={18} style={{marginRight:6}} /> Mostrador</h2>}
              {currentContext?.type === 'delivery' && <h2 className="table-name">🛵 Delivery</h2>}
            </div>
          </div>
          <div className="client-name">
            <User size={14} style={{marginRight:4}} /> {currentContext?.customerName || 'Consumidor Final'}
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
        <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={openAssignTable}
            style={{
              width: '100%', padding: '12px', background: 'var(--accent)', color: 'white', 
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Grid size={16} style={{marginRight:6}} /> Asignar a una Mesa
          </button>
        </div>
      )}

      {/* Sección Desplegable de Datos de Delivery */}
      {currentContext && (currentContext.type === 'mostrador' || currentContext.type === 'delivery') && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
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
              color: 'var(--text-secondary)', 
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
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
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dirección *</label>
                    <input 
                      type="text" 
                      placeholder="Calle y altura..." 
                      value={delivStreet}
                      onChange={e => setDelivStreet(e.target.value)}
                      onBlur={() => saveDeliveryInfo(delivStreet, delivDesc, delivMapsUrl)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción / Indicaciones</label>
                    <input 
                      type="text" 
                      placeholder="Piso, depto, color de puerta..." 
                      value={delivDesc}
                      onChange={e => setDelivDesc(e.target.value)}
                      onBlur={() => saveDeliveryInfo(delivStreet, delivDesc, delivMapsUrl)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enlace de Google Maps</label>
                    <input 
                      type="text" 
                      placeholder="https://maps.app.goo.gl/..." 
                      value={delivMapsUrl}
                      onChange={e => setDelivMapsUrl(e.target.value)}
                      onBlur={() => saveDeliveryInfo(delivStreet, delivDesc, delivMapsUrl)}
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', outline: 'none', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                    />
                  </div>

                  
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search + Categories */}
      <div className="comanda-search-zone">
        <div className="search-bar">
          <Search size={16} />
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
                <span className="cat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIconDisplay iconId={c.icon} size={36} />
                </span>
                <span style={{ marginTop: '4px' }}>{c.name}</span>
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
              
            </div>
          ))
        )}
      </div>

      
      {/* Notas Generales del Pedido */}
      {cart.length > 0 && (
        <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <textarea
            placeholder="Notas del pedido (ej. sin cebolla en todo)..."
            defaultValue={cart.find(i => i.notes)?.notes || ''}
            onBlur={async (e) => {
              const val = e.target.value;
              const firstItem = cart[0];
              if (firstItem && firstItem.dbItemId) {
                try {
                  const { sb } = await import('../../lib/supabase');
                  await sb.from('order_items').update({ notes: val }).eq('id', firstItem.dbItemId);
                  setCart(prev => prev.map((it, idx) => idx === 0 ? { ...it, notes: val } : it));
                } catch(err) { console.error(err); }
              }
            }}
            style={{
              width: '100%', padding: '10px', fontSize: '13px', borderRadius: '6px',
              border: '1px dashed var(--border)', background: 'var(--bg)', color: 'var(--text-primary)',
              resize: 'vertical', minHeight: '60px', fontFamily: 'inherit'
            }}
          />
        </div>
      )}
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
          <button className="btn-discount" onClick={() => setDiscountModal(true)}><><FileText size={16} style={{marginRight:6}}/> Descuento</></button>
          {isNewOrder ? (
            <button
              className="btn-cobrar"
              disabled={cart.length === 0 || assigning}
              onClick={assignOrder}
              style={{ background: 'var(--accent, #f59e0b)' }}
            >
              {assigning ? 'Asignando...' : <><Check size={18} style={{marginRight:6}}/> ASIGNAR PEDIDO</>}
            </button>
          ) : (
            <>
              <button
                className="btn-cobrar"
                disabled={cart.length === 0}
                onClick={() => { setPayModal(true); setPayEfectivo(grandTotal.toString()); setPayTarjeta(''); setPayTransferencia(''); setExcesoComoPropina(false); }}
              ><CreditCard size={18} style={{marginRight:6}}/> COBRAR</button>
              {true && (
                <button
                  className="btn-discount"
                  style={{ background: 'var(--border)', color: 'var(--text-primary)', marginTop: '4px' }}
                  onClick={clearCart}
                >
                  <><ChefHat size={18} style={{marginRight:6}}/> GUARDAR (ENVIAR A COCINA)</>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Modal (Multi-Pago y Ticket) */}
      <Modal show={payModal} onClose={() => { setPayModal(false); setPayEfectivo(''); setPayTarjeta(''); setPayTransferencia(''); setExcesoComoPropina(false); }} wide>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '16px', color: 'var(--accent)', borderTop: '2px dashed var(--border)', paddingTop: '16px' }}>
                <span>TOTAL A PAGAR:</span>
                <span>{fmtMoney(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* MULTI PAGOS */}
          <div className="modal-right" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px' }}>
            <h3>Medio de Pago</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Banknote size={20} /> <span style={{width: '90px', fontWeight: 600}}>Efectivo</span>
                <input type="number" placeholder="0" value={payEfectivo} onChange={e => setPayEfectivo(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '16px'}} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} /> <span style={{width: '90px', fontWeight: 600}}>Tarjeta</span>
                <input type="number" placeholder="0" value={payTarjeta} onChange={e => setPayTarjeta(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '16px'}} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Banknote size={20} /> <span style={{width: '90px', fontWeight: 600}}>Transfer.</span>
                <input type="number" placeholder="0" value={payTransferencia} onChange={e => setPayTransferencia(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '16px'}} />
              </div>
            </div>

            <div style={{ background: 'var(--bg, #f8fafc)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: 'auto' }}>
              {(() => {
                const totalPaid = (parseFloat(payEfectivo)||0) + (parseFloat(payTarjeta)||0) + (parseFloat(payTransferencia)||0)
                const diff = totalPaid - grandTotal;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Total Pagado:</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{fmtMoney(totalPaid)}</span>
                    </div>
                    {diff > 0.01 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: excesoComoPropina ? 'var(--accent)' : 'var(--red)' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{excesoComoPropina ? 'Propina registrada:' : 'Vuelto a entregar:'}</span>
                          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{fmtMoney(diff)}</span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          <input type="checkbox" checked={excesoComoPropina} onChange={e => setExcesoComoPropina(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                          Registrar excedente como propina
                        </label>
                      </>
                    )}
                    {diff < -0.01 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--red)' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Falta cobrar:</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{fmtMoney(Math.abs(diff))}</span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {(() => {
              const totalPaid = (parseFloat(payEfectivo)||0) + (parseFloat(payTarjeta)||0) + (parseFloat(payTransferencia)||0)
              const isValid = totalPaid >= grandTotal - 0.01
              return (
                <button 
                  className="btn-close-sale" 
                  onClick={closeSale} 
                  disabled={saving || !isValid}
                  style={{ 
                    background: (saving || !isValid) ? 'var(--border)' : 'var(--green)',
                    color: (saving || !isValid) ? 'var(--text-muted)' : 'white',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: (saving || !isValid) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Procesando...' : <><Check size={18} style={{marginRight:6}}/> CERRAR VENTA</>}
                </button>
              )
            })()}
            <button 
              className="btn-cancel-modal" 
              onClick={() => { setPayModal(false); setPayEfectivo(''); setPayTarjeta(''); setPayTransferencia(''); setExcesoComoPropina(false); }}
              style={{ padding: '16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
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
