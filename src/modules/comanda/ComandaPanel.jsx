import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetCategories, dbGetProducts, dbAddItem, dbRemoveItem,
  dbCreateOrder, dbUpdateOrder, dbUpdateTable, dbCreatePayment,
  dbGetOpenSession, fmtMoney, dbRecalcOrder, sb
} from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function ComandaPanel() {
  const {
    tenantId, currentContext, setCurrentContext,
    cart, setCart, discount, setDiscount, clearCart,
    cartTotal, discountAmount, grandTotal, refreshTrigger
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
      .subscribe()

    return () => {
      sb.removeChannel(comandaChannel)
    }
  }, [tenantId, refreshCats, refreshProds])

  const filteredProducts = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  async function addToCart(product) {
    if (!currentContext) return
    // Ensure order exists
    let orderId = currentContext.orderId
    if (!orderId) {
      const order = await dbCreateOrder(tenantId, currentContext.type === 'mesa' ? 'dine_in' : 'takeaway', currentContext.tableDbId)
      orderId = order.id
      setCurrentContext(prev => ({ ...prev, orderId }))
      if (currentContext.tableDbId) {
        await dbUpdateTable(currentContext.tableDbId, { status: 'occupied', current_order_id: orderId })
      }
    }
    await dbAddItem(tenantId, orderId, product)
    // Update local cart
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1, notes: '' }]
    })
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

  const change = payMethod === 'efectivo' && cashIn ? parseFloat(cashIn) - grandTotal : 0

  const contextLabel = currentContext
    ? currentContext.type === 'mesa'
      ? `🪑 ${currentContext.tableName}`
      : currentContext.type === 'delivery' ? '🛵 Delivery' : '🏪 Mostrador'
    : null

  return (
    <aside className="comanda-panel">
      {/* Header */}
      <div className="comanda-header">
        <span className="comanda-title">
          {currentContext ? contextLabel : 'Selecciona una mesa'}
        </span>
        {currentContext && (
          <span className="comanda-context">
            {currentContext.orderId ? '🔴 Pedido activo' : '🟢 Mesa libre'}
          </span>
        )}
      </div>

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
          <button className="btn-cobrar" disabled={cart.length === 0} onClick={() => setPayModal(true)}>
            💳 COBRAR
          </button>
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
