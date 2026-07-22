import {    Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock , TrendingDown , Unlock , ArrowDown } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetIngredients, dbCreateIngredient, dbUpdateIngredient, dbDeleteIngredient,
  dbGetProductIngredients, dbSetProductIngredients,
  dbGetStockMovements, dbGetProducts, dbGetCategories,
  dbAdjustIngredientStock, dbAdjustProductStock, dbUpdateProduct,
  dbGetFixedCosts, dbCreateFixedCost, dbUpdateFixedCost, dbDeleteFixedCost,
  fmtMoney
} from '../../lib/supabase'
import Modal from '../../components/Modal'

const UNITS = ['gr', 'kg', 'ml', 'l', 'unidad', 'porción', 'taza', 'sobre']

export default function StockModule() {
  const { tenantId } = useApp()
  const [tab, setTab] = useState('control')

  return (
    <div className="module-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header con tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px 0' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}><Package size={16} style={{marginRight:6}}/> Stock & Costos</h1>
        </div>
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', marginTop: '12px', overflowX: 'auto' }}>
          {[
            { id: 'control',      label: '📊 Control de Ingredientes' },
            { id: 'productos',    label: <><Package size={16} style={{marginRight:6}}/> Stock de Productos</> },
            { id: 'ingredientes', label: '🧂 Ingredientes' },
            { id: 'recetas',      label: '🍽️ Ingredientes por Producto' },
            { id: 'rentabilidad', label: <><Banknote size={16} style={{marginRight:6}}/> Costos y Rentabilidad</> },
            { id: 'movimientos',  label: '📈 Movimientos' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', background: 'none', border: 'none', whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: tab === t.id ? '700' : '500', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s'
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {tab === 'control'      && <TabControl tenantId={tenantId} />}
        {tab === 'productos'    && <TabProductosStock tenantId={tenantId} />}
        {tab === 'ingredientes' && <TabIngredientes tenantId={tenantId} />}
        {tab === 'recetas'      && <TabRecetas tenantId={tenantId} />}
        {tab === 'rentabilidad' && <TabRentabilidad tenantId={tenantId} />}
        {tab === 'movimientos'  && <TabMovimientos tenantId={tenantId} />}
      </div>
    </div>
  )
}

// ─── SEARCHABLE INGREDIENT SELECTOR ─────────────────────────────────────────
function IngredientSearch({ ingredients, onSelect, excluded = [] }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const filtered = ingredients.filter(i =>
    !excluded.includes(i.id) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(ing) {
    onSelect(ing)
    setSearch('')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar  Buscar ingrediente..."
        style={{
          width: '100%', padding: '8px 12px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box'
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
        }}>
          {filtered.map(i => (
            <button key={i.id} onClick={() => handleSelect(i)} style={{
              display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
              background: 'none', border: 'none', borderBottom: '1px solid var(--border)',
              cursor: 'pointer', fontSize: '13px', color: 'var(--text)'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft, #f0f4ff)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontWeight: '600' }}>{i.name}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '11px' }}>({i.unit})</span>
            </button>
          ))}
        </div>
      )}
      {open && search && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
          padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px'
        }}>
          No se encontraron ingredientes con "{search}"
        </div>
      )}
    </div>
  )
}

// ─── TAB CONTROL DE STOCK ───────────────────────────────────────────────────
function TabControl({ tenantId }) {
  const [ingredients, setIngredients] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [editStock, setEditStock] = useState('')
  const [editReason, setEditReason] = useState('compra')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const data = await dbGetIngredients(tenantId)
    setIngredients(data)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const filtered = ingredients.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const stock = parseFloat(i.current_stock) || 0
    const minStock = parseFloat(i.min_stock) || 0
    if (filter === 'agotados' && stock > 0) return false
    if (filter === 'poco' && (stock === 0 || stock > minStock)) return false
    if (filter === 'ok' && stock <= minStock) return false
    return matchSearch
  })

  function getStockStatus(i) {
    const stock = parseFloat(i.current_stock) || 0
    const min = parseFloat(i.min_stock) || 0
    if (stock === 0) return { label: 'Agotado', color: '#ef4444', bg: '#fee2e2' }
    if (min > 0 && stock <= min) return { label: 'Poco stock', color: '#f59e0b', bg: '#fef3c7' }
    return { label: 'Disponible', color: '#10b981', bg: '#d1fae5' }
  }

  async function handleAdjust(reason) {
    if (!editItem || editStock === '') return
    setSaving(true)
    try {
      const amount = parseFloat(editStock)
      await dbAdjustIngredientStock(tenantId, editItem.id, amount, reason, editItem.current_stock)
      setEditItem(null); setEditStock(''); load()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total ingredientes', value: ingredients.length, icon: '🧂', color: '#6366f1' },
          { label: 'Agotados', value: ingredients.filter(i => parseFloat(i.current_stock) === 0).length, icon: <X size={16} style={{marginRight:6}} />, color: '#ef4444' },
          { label: 'Poco stock', value: ingredients.filter(i => { const s = parseFloat(i.current_stock), m = parseFloat(i.min_stock); return s > 0 && m > 0 && s <= m }).length, icon: '⚠️', color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input placeholder="Buscar  Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', minWidth: '200px' }} />
        {[{ id: 'all', label: 'Todos' }, { id: 'ok', label: <><Check size={16} style={{marginRight:6}}/> Disponibles</> }, { id: 'poco', label: '⚠️ Poco stock' }, { id: 'agotados', label: <><X size={16} style={{marginRight:6}}/> Agotados</> }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
            background: filter === f.id ? 'var(--accent)' : 'var(--surface)',
            color: filter === f.id ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px', fontWeight: filter === f.id ? '700' : '500', transition: 'all 0.15s'
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Ingrediente', 'Unidad', 'Stock Actual', 'Mínimo', 'Estado', 'Costo unit.', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin ingredientes</td></tr>
                : filtered.map(i => {
                  const status = getStockStatus(i)
                  return (
                    <tr key={i.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{i.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{i.unit}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: status.color }}>{parseFloat(i.current_stock)} {i.unit}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{parseFloat(i.min_stock)} {i.unit}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: status.bg, color: status.color }}>{status.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{fmtMoney(i.cost || 0)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => { setEditItem(i); setEditStock(''); }}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                          Ajustar Stock
                        </button>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      <Modal show={!!editItem} onClose={() => setEditItem(null)} title={`Ajustar Stock: ${editItem?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '320px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Cantidad a sumar o restar ({editItem?.unit})
            </label>
            <input type="number" min="0.001" step="0.001" value={editStock} onChange={e => setEditStock(e.target.value)} placeholder="Ej: 1.5"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '16px', textAlign: 'center' }} autoFocus />
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Stock actual: <strong>{parseFloat(editItem?.current_stock || 0)} {editItem?.unit}</strong>
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
            <button onClick={() => handleAdjust('compra')} disabled={saving || !editStock || editStock <= 0} 
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--green)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', opacity: (saving || !editStock) ? 0.6 : 1 }}><Plus size={14}/> Sumar Stock
            </button>
            <button onClick={() => handleAdjust('desperdicio')} disabled={saving || !editStock || editStock <= 0} 
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--red)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', opacity: (saving || !editStock) ? 0.6 : 1 }}><Minus size={14}/> Restar Stock
            </button>
          </div>
          <button onClick={() => setEditItem(null)} disabled={saving} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', width: '100%' }}>Cancelar</button>
        </div>
      </Modal>
    </div>
  )
}
// ─── TAB STOCK DE PRODUCTOS ───────────────────────────────────────────────────
function TabProductosStock({ tenantId }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [editStock, setEditStock] = useState('')
  const [editReason, setEditReason] = useState('ajuste')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const data = await dbGetProducts(tenantId)
    setProducts(data)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const stock = p.stock_quantity
    
    // Filter out products that don't have direct stock tracked, UNLESS searching explicitly
    if (filter === 'all' && stock === null) return true // Show all by default so they can init stock
    if (filter === 'con_stock' && stock === null) return false // Only those with explicit stock
    if (filter === 'agotados' && (stock === null || stock > 0)) return false

    return matchSearch
  })

  function getStockStatus(p) {
    if (p.stock_quantity === null) return { label: 'No trackeado', color: 'var(--text-secondary)', bg: 'var(--surface-2)' }
    if (p.stock_quantity === 0) return { label: 'Agotado', color: '#ef4444', bg: '#fee2e2' }
    if (p.stock_quantity <= 10) return { label: 'Poco stock', color: '#f59e0b', bg: '#fef3c7' }
    return { label: 'Disponible', color: '#10b981', bg: '#d1fae5' }
  }

  async function handleAdjust(reason) {
    if (!editItem || editStock === '') return
    setSaving(true)
    try {
      const amount = parseFloat(editStock)
      await dbAdjustProductStock(tenantId, editItem.id, amount, reason, editItem.stock_quantity)
      setEditItem(null); setEditStock(''); load()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleStopTracking(prod) {
    if(!confirm(`¿Dejar de trackear stock para ${prod.name}? (Su stock actual de ${prod.stock_quantity} se perderá y dependerá de recetas si tiene)`)) return
    try {
      await dbUpdateProduct(prod.id, { stock_quantity: null })
      load()
    } catch (e) { alert('Error: ' + e.message) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Productos con stock', value: products.filter(p => p.stock_quantity !== null).length, icon: <Package size={16} style={{marginRight:6}} />, color: '#6366f1' },
          { label: 'Agotados', value: products.filter(p => p.stock_quantity === 0).length, icon: <X size={16} style={{marginRight:6}} />, color: '#ef4444' },
          { label: 'Poco stock (<10)', value: products.filter(p => p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity <= 10).length, icon: '⚠️', color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: c.color }}>{c.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input placeholder="Buscar  Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', minWidth: '200px' }} />
        {[{ id: 'all', label: 'Todos' }, { id: 'con_stock', label: <><Check size={16} style={{marginRight:6}}/> Trackeados</> }, { id: 'agotados', label: <><X size={16} style={{marginRight:6}}/> Agotados</> }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
            background: filter === f.id ? 'var(--accent)' : 'var(--surface)',
            color: filter === f.id ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px', fontWeight: filter === f.id ? '700' : '500', transition: 'all 0.15s'
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['SKU', 'Producto', 'Categoría', 'Stock', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin productos</td></tr>
                : filtered.map(p => {
                  const status = getStockStatus(p)
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}><code>{p.sku || '-'}</code></td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{p.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.categories?.name || '-'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: status.color }}>{p.stock_quantity !== null ? p.stock_quantity : '∞'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: status.bg, color: status.color }}>{status.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditItem(p); setEditStock(''); }}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                          Ajustar
                        </button>
                        {p.stock_quantity !== null && (
                          <button onClick={() => handleStopTracking(p)}
                            style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--red)', fontWeight: '600' }}>
                            Dejar de trackear
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      <Modal show={!!editItem} onClose={() => setEditItem(null)} title={`Ajustar Stock: ${editItem?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '320px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Cantidad a sumar o restar
            </label>
            <input type="number" min="1" step="1" value={editStock} onChange={e => setEditStock(e.target.value)} placeholder="Ej: 10"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '16px', textAlign: 'center' }} autoFocus />
            {editItem?.stock_quantity === null && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                ℹ️ Al realizar el ajuste, este producto pasará a trackearse automáticamente.
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
            <button onClick={() => handleAdjust('ajuste')} disabled={saving || !editStock || editStock <= 0} 
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--green)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', opacity: (saving || !editStock) ? 0.6 : 1 }}><Plus size={14}/> Sumar Stock
            </button>
            <button onClick={() => handleAdjust('desperdicio')} disabled={saving || !editStock || editStock <= 0} 
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--red)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', opacity: (saving || !editStock) ? 0.6 : 1 }}><Minus size={14}/> Restar Stock
            </button>
          </div>
          <button onClick={() => setEditItem(null)} disabled={saving} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', width: '100%' }}>Cancelar</button>
        </div>
      </Modal>
    </div>
  )
}

// ─── TAB INGREDIENTES ────────────────────────────────────────────────────────
function TabIngredientes({ tenantId }) {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', unit: 'gr', cost: '', current_stock: '', min_stock: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setIngredients(await dbGetIngredients(tenantId))
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  function openNew() { setForm({ name: '', unit: 'gr', cost: '', current_stock: '', min_stock: '' }); setModal('new') }
  function openEdit(i) { setForm({ name: i.name, unit: i.unit, cost: i.cost || '', current_stock: i.current_stock || '', min_stock: i.min_stock || '' }); setModal(i) }

  async function handleSave() {
    if (!form.name || !form.unit) return
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), unit: form.unit, cost: parseFloat(form.cost) || 0, current_stock: parseFloat(form.current_stock) || 0, min_stock: parseFloat(form.min_stock) || 0 }
      if (modal === 'new') await dbCreateIngredient(tenantId, payload)
      else await dbUpdateIngredient(modal.id, payload)
      setModal(null); load()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este ingrediente?')) return
    try { await dbDeleteIngredient(id); load() }
    catch (e) { alert('Error: ' + e.message) }
  }

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input placeholder="Buscar  Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '260px' }} />
        <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
          + Nuevo Ingrediente
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Nombre', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Costo unit.', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No hay ingredientes.</td></tr>
                : filtered.map(i => (
                  <tr key={i.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{i.name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{i.unit}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>{parseFloat(i.current_stock)} {i.unit}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{parseFloat(i.min_stock)} {i.unit}</td>
                    <td style={{ padding: '12px 16px' }}>{fmtMoney(i.cost || 0)}</td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(i)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}><PenSquare size={14} style={{marginRight:6}}/> Editar</button>
                      <button onClick={() => handleDelete(i.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Modal show={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? '🧂 Nuevo Ingrediente' : ' Editar Ingrediente'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '340px' }}>
          {[
            { key: 'name', label: 'Nombre *', type: 'text', placeholder: 'Ej: Pan brioche' },
            { key: 'cost', label: 'Costo por unidad ($)', type: 'number', placeholder: '0.00' },
            { key: 'current_stock', label: 'Stock inicial', type: 'number', placeholder: '0' },
            { key: 'min_stock', label: 'Stock mínimo (alerta)', type: 'number', placeholder: '0' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Unidad de medida *</label>
            <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px' }}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={() => setModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSave} disabled={!form.name || saving}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: !form.name || saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── TAB INGREDIENTES POR PRODUCTO ───────────────────────────────────────────
function TabRecetas({ tenantId }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recipe, setRecipe] = useState([])
  const [addQty, setAddQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [searchProd, setSearchProd] = useState('')

  useEffect(() => {
    if (!tenantId) return
    dbGetCategories(tenantId).then(setCategories)
    dbGetProducts(tenantId).then(setProducts)
    dbGetIngredients(tenantId).then(setIngredients)
  }, [tenantId])

  async function selectProduct(p) {
    setSelectedProduct(p)
    const rows = await dbGetProductIngredients(p.id)
    setRecipe(rows.map(r => ({ id: r.id, ingredient_id: r.ingredient_id, ingredient: r.ingredients, quantity: r.quantity })))
  }

  function addIngredient(ing) {
    if (!ing) return
    if (recipe.find(r => r.ingredient_id === ing.id)) { alert('Ese ingrediente ya está en la receta.'); return }
    setRecipe(prev => [...prev, { ingredient_id: ing.id, ingredient: ing, quantity: '' }])
  }

  function removeRow(ing_id) { setRecipe(prev => prev.filter(r => r.ingredient_id !== ing_id)) }
  function updateQty(ing_id, newQty) { setRecipe(prev => prev.map(r => r.ingredient_id === ing_id ? { ...r, quantity: newQty } : r)) }

  async function saveRecipe() {
    if (!selectedProduct) return
    setSaving(true)
    try {
      await dbSetProductIngredients(tenantId, selectedProduct.id, recipe.map(r => ({ ingredient_id: r.ingredient_id, quantity: parseFloat(r.quantity) || 0 })))
      alert('Ingredientes guardados ')
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  const filteredProds = products.filter(p => {
    const matchCat = filterCat === 'all' || p.category_id === filterCat
    const matchSearch = p.name.toLowerCase().includes(searchProd.toLowerCase())
    return matchCat && matchSearch
  })

  const excludedIds = recipe.map(r => r.ingredient_id)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: '100%' }}>
      {/* Left: product list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <input placeholder="Buscar  Buscar producto..." value={searchProd} onChange={e => setSearchProd(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px', boxSizing: 'border-box' }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ width: '100%', marginTop: '8px', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '12px' }}>
            <option value="all">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredProds.map(p => (
            <button key={p.id} onClick={() => selectProduct(p)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '10px 16px', textAlign: 'left',
              background: selectedProduct?.id === p.id ? 'var(--accent)' : 'none',
              color: selectedProduct?.id === p.id ? 'white' : 'var(--text)',
              border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px',
              fontWeight: selectedProduct?.id === p.id ? '700' : '500', transition: 'all 0.1s'
            }}>
              <span>{p.name}</span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>{fmtMoney(p.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: recipe editor */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
        {!selectedProduct ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '40px' }}>🍽️</span>
            <p>Seleccioná un producto para ver o editar sus ingredientes</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>🍽️ {selectedProduct.name}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Ingredientes necesarios para 1 porción / unidad</p>
              </div>
              <button onClick={saveRecipe} disabled={saving}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : <><Save size={16} style={{marginRight:6}}/> Guardar</>}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {recipe.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>Sin ingredientes asignados. Buscá uno abajo para agregar.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ingrediente</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cantidad</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unidad</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.map(r => (
                      <tr key={r.ingredient_id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: '600' }}>{r.ingredient?.name || '?'}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input type="number" min="0" step="0.01" value={r.quantity}
                            onChange={e => updateQty(r.ingredient_id, e.target.value)}
                            style={{ width: '80px', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', fontWeight: '600' }} />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>{r.ingredient?.unit}</td>
                        <td style={{ padding: '4px' }}>
                          <button onClick={() => removeRow(r.ingredient_id)} style={{ padding: '4px 8px', border: 'none', background: '#fee2e2', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Searchable ingredient add */}
              <div style={{ background: 'var(--surface-2, #f8fafc)', padding: '12px', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregar ingrediente</p>
                <IngredientSearch ingredients={ingredients} excluded={excludedIds} onSelect={ing => addIngredient(ing)} />
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  💡 Buscá el ingrediente, hacé clic para agregarlo y luego ingresá la cantidad.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── TAB COSTOS Y RENTABILIDAD ───────────────────────────────────────────────
function TabRentabilidad({ tenantId }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [fixedCosts, setFixedCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [searchProd, setSearchProd] = useState('')
  const [savingCost, setSavingCost] = useState({})
  const [editingCost, setEditingCost] = useState({})
  const [fcModal, setFcModal] = useState(null)
  const [fcForm, setFcForm] = useState({ name: '', amount: '', frequency: 'monthly' })
  const [savingFc, setSavingFc] = useState(false)
  const [section, setSection] = useState('products') // 'products' | 'fixed'

  const loadAll = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const [prods, cats, fcs] = await Promise.all([
      dbGetProducts(tenantId),
      dbGetCategories(tenantId),
      dbGetFixedCosts(tenantId)
    ])
    setProducts(prods)
    setCategories(cats)
    setFixedCosts(fcs)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { loadAll() }, [loadAll])

  async function saveCost(productId, cost) {
    setSavingCost(p => ({ ...p, [productId]: true }))
    try {
      await dbUpdateProduct(productId, { cost: parseFloat(cost) || 0 })
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, cost: parseFloat(cost) || 0 } : p))
      setEditingCost(p => { const n = { ...p }; delete n[productId]; return n })
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSavingCost(p => ({ ...p, [productId]: false })) }
  }

  // Fixed costs CRUD
  async function saveFc() {
    if (!fcForm.name || !fcForm.amount) return
    setSavingFc(true)
    try {
      if (fcModal === 'new') await dbCreateFixedCost(tenantId, { name: fcForm.name, amount: parseFloat(fcForm.amount), frequency: fcForm.frequency })
      else await dbUpdateFixedCost(fcModal.id, { name: fcForm.name, amount: parseFloat(fcForm.amount), frequency: fcForm.frequency })
      setFcModal(null)
      loadAll()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSavingFc(false) }
  }

  async function deleteFc(id) {
    if (!confirm('¿Eliminar este costo fijo?')) return
    await dbDeleteFixedCost(id)
    loadAll()
  }

  const filteredProds = products.filter(p => {
    const matchCat = filterCat === 'all' || p.category_id === filterCat
    const matchSearch = p.name.toLowerCase().includes(searchProd.toLowerCase())
    return matchCat && matchSearch
  })

  const totalFixedMonthly = fixedCosts.reduce((s, fc) => s + (parseFloat(fc.amount) || 0), 0)

  function getMarginColor(pct) {
    if (pct >= 60) return '#10b981'
    if (pct >= 35) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>💼</span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{fmtMoney(totalFixedMonthly)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Costos fijos mensuales</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}><Package size={16} style={{marginRight:6}}/></span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#6366f1' }}>{products.filter(p => (p.cost || 0) > 0).length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Productos con costo cargado</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📈</span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>
              {products.filter(p => (p.cost || 0) > 0).length > 0
                ? Math.round(products.filter(p => (p.cost || 0) > 0).reduce((s, p) => s + ((p.price - p.cost) / p.price * 100), 0) / products.filter(p => (p.cost || 0) > 0).length) + '%'
                : '--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Margen promedio</div>
          </div>
        </div>
      </div>

      {/* Section switch */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setSection('products')} style={{
          padding: '8px 18px', borderRadius: '8px', border: 'none',
          background: section === 'products' ? 'var(--accent)' : 'var(--surface)',
          color: section === 'products' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--border)', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
        }}><Package size={16} style={{marginRight:6}}/> Rentabilidad por Producto</button>
        <button onClick={() => setSection('fixed')} style={{
          padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--border)',
          background: section === 'fixed' ? 'var(--accent)' : 'var(--surface)',
          color: section === 'fixed' ? 'white' : 'var(--text-secondary)',
          cursor: 'pointer', fontWeight: '600', fontSize: '13px'
        }}>💼 Costos Fijos</button>
      </div>

      {section === 'products' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input placeholder="Buscar  Buscar producto..." value={searchProd} onChange={e => setSearchProd(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '220px' }} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }}>
              <option value="all">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
                  {['Producto', 'Precio Venta', 'Costo', 'Ganancia', 'Margen %', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
                  : filteredProds.map(p => {
                    const cost = parseFloat(p.cost) || 0
                    const price = parseFloat(p.price) || 0
                    const profit = price - cost
                    const marginPct = price > 0 && cost > 0 ? ((profit / price) * 100).toFixed(1) : null
                    const editing = editingCost[p.id] !== undefined

                    return (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{p.name}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#10b981' }}>{fmtMoney(price)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {editing ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input type="number" min="0" step="0.01"
                                value={editingCost[p.id]}
                                onChange={e => setEditingCost(prev => ({ ...prev, [p.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && saveCost(p.id, editingCost[p.id])}
                                style={{ width: '90px', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--accent)', background: 'var(--surface)', fontSize: '13px', fontWeight: '700' }}
                                autoFocus />
                              <button onClick={() => saveCost(p.id, editingCost[p.id])} disabled={savingCost[p.id]}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                ✓
                              </button>
                              <button onClick={() => setEditingCost(prev => { const n = { ...prev }; delete n[p.id]; return n })}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '11px' }}>
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingCost(prev => ({ ...prev, [p.id]: cost || '' }))}
                              style={{ background: 'none', border: '1px dashed var(--border)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: cost > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                              {cost > 0 ? fmtMoney(cost) : '+ cargar costo'}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: profit > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                          {cost > 0 ? fmtMoney(profit) : '--'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {marginPct !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, parseFloat(marginPct))}%`, height: '100%', background: getMarginColor(parseFloat(marginPct)), borderRadius: '3px', transition: 'width 0.3s' }} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: getMarginColor(parseFloat(marginPct)), minWidth: '40px' }}>{marginPct}%</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sin costo</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}></td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {section === 'fixed' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Registrá los gastos fijos mensuales de tu negocio (alquiler, sueldos, servicios, etc.)</p>
            <button onClick={() => { setFcForm({ name: '', amount: '', frequency: 'monthly' }); setFcModal('new') }}
              style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
              + Agregar Costo Fijo
            </button>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
                  {['Descripción', 'Monto mensual', 'Frecuencia', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fixedCosts.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Sin costos fijos registrados. Agregá uno con el botón de arriba.
                  </td></tr>
                ) : fixedCosts.map(fc => (
                  <tr key={fc.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{fc.name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#ef4444' }}>{fmtMoney(fc.amount)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{fc.frequency === 'monthly' ? 'Mensual' : fc.frequency}</td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setFcForm({ name: fc.name, amount: fc.amount, frequency: fc.frequency }); setFcModal(fc) }}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px' }}><PenSquare size={16} style={{marginRight:6}}/></button>
                      <button onClick={() => deleteFc(fc.id)}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {fixedCosts.length > 0 && (
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2, #f8fafc)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '800' }}>TOTAL</td>
                    <td style={{ padding: '12px 16px', fontWeight: '800', color: '#ef4444', fontSize: '16px' }}>{fmtMoney(totalFixedMonthly)}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Fixed cost modal */}
      <Modal show={!!fcModal} onClose={() => setFcModal(null)} title={fcModal === 'new' ? '💼 Nuevo Costo Fijo' : ' Editar Costo Fijo'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '320px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Descripción *</label>
            <input type="text" placeholder="Ej: Alquiler, Sueldo empleado, Gas..." value={fcForm.name}
              onChange={e => setFcForm(p => ({ ...p, name: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Monto ($) *</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={fcForm.amount}
              onChange={e => setFcForm(p => ({ ...p, amount: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Frecuencia</label>
            <select value={fcForm.frequency} onChange={e => setFcForm(p => ({ ...p, frequency: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px' }}>
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
              <option value="annual">Anual</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setFcModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={saveFc} disabled={!fcForm.name || !fcForm.amount || savingFc}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: !fcForm.name || !fcForm.amount || savingFc ? 0.6 : 1 }}>
              {savingFc ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── TAB MOVIMIENTOS ─────────────────────────────────────────────────────────
function TabMovimientos({ tenantId }) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    dbGetStockMovements(tenantId).then(data => { setMovements(data); setLoading(false) })
  }, [tenantId])

  const REASON_LABELS = {
    venta:      { label: 'Venta', icon: <CreditCard size={16} style={{marginRight:6}} />, color: '#ef4444' },
    compra:     { label: 'Compra / Entrada', icon: <Package size={16} style={{marginRight:6}} />, color: '#10b981' },
    ajuste:     { label: 'Ajuste Manual', icon: '', color: '#6366f1' },
    desperdicio:{ label: 'Desperdicio', icon: <Trash2 size={16} style={{marginRight:6}} />, color: '#f59e0b' },
  }

  const filtered = filter === 'all' ? movements : movements.filter(m => m.reason === filter)

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'Todos' }, { id: 'venta', label: '💳 Ventas' }, { id: 'compra', label: <><Package size={16} style={{marginRight:6}}/> Compras</> }, { id: 'ajuste', label: <><PenSquare size={16} style={{marginRight:6}}/> Ajustes</> }, { id: 'desperdicio', label: <><Trash2 size={16} style={{marginRight:6}}/> Desperdicios</> }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)',
            background: filter === f.id ? 'var(--accent)' : 'var(--surface)',
            color: filter === f.id ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px', fontWeight: filter === f.id ? '700' : '500', transition: 'all 0.15s'
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Tipo', 'Evento', 'Ingrediente', 'Stock Ant.', 'Cambio', 'Stock Nuevo', 'Fecha'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin movimientos</td></tr>
                : filtered.map(m => {
                  const info = REASON_LABELS[m.reason] || { label: m.reason, icon: '📌', color: 'var(--text-muted)' }
                  const change = parseFloat(m.change_amount)
                  const date = new Date(m.created_at)
                  return (
                    <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '18px' }}>{info.icon}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: info.color + '20', color: info.color }}>{info.label}</span></td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{m.ingredients?.name || '--'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{parseFloat(m.previous_stock)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: change >= 0 ? '#10b981' : '#ef4444' }}>
                        {change >= 0 ? '+' : ''}{change} {m.ingredients?.unit || ''}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>{parseFloat(m.new_stock)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        {date.toLocaleDateString('es-AR')} {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
