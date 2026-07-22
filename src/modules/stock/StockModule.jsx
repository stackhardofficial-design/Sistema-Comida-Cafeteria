import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetIngredients, dbCreateIngredient, dbUpdateIngredient, dbDeleteIngredient,
  dbGetProductIngredients, dbSetProductIngredients,
  dbGetStockMovements, dbGetProducts, dbGetCategories,
  dbAdjustIngredientStock, fmtMoney
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 0' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>📦 Stock</h1>
        </div>
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', marginTop: '12px' }}>
          {[
            { id: 'control', label: '📊 Control de Stock' },
            { id: 'ingredientes', label: '🧂 Ingredientes' },
            { id: 'recetas', label: '📋 Fichas Técnicas' },
            { id: 'movimientos', label: '📈 Movimientos' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: tab === t.id ? '700' : '500',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.15s'
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {tab === 'control' && <TabControl tenantId={tenantId} />}
        {tab === 'ingredientes' && <TabIngredientes tenantId={tenantId} />}
        {tab === 'recetas' && <TabRecetas tenantId={tenantId} />}
        {tab === 'movimientos' && <TabMovimientos tenantId={tenantId} />}
      </div>
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

  async function handleAdjust() {
    if (!editItem || editStock === '') return
    setSaving(true)
    try {
      const amount = parseFloat(editStock)
      await dbAdjustIngredientStock(tenantId, editItem.id, amount, editReason, editItem.current_stock)
      setEditItem(null)
      setEditStock('')
      load()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total ingredientes', value: ingredients.length, icon: '🧂', color: '#6366f1' },
          { label: 'Agotados', value: ingredients.filter(i => parseFloat(i.current_stock) === 0).length, icon: '❌', color: '#ef4444' },
          { label: 'Poco stock', value: ingredients.filter(i => { const s = parseFloat(i.current_stock); const m = parseFloat(i.min_stock); return s > 0 && m > 0 && s <= m }).length, icon: '⚠️', color: '#f59e0b' },
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Buscar ingrediente..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', minWidth: '200px' }}
        />
        {[
          { id: 'all', label: 'Todos' },
          { id: 'ok', label: '✅ Disponibles' },
          { id: 'poco', label: '⚠️ Poco stock' },
          { id: 'agotados', label: '❌ Agotados' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
            background: filter === f.id ? 'var(--accent)' : 'var(--surface)',
            color: filter === f.id ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px', fontWeight: filter === f.id ? '700' : '500', transition: 'all 0.15s'
          }}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Ingrediente', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Costo unit.', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin ingredientes</td></tr>
            ) : filtered.map(i => {
              const status = getStockStatus(i)
              return (
                <tr key={i.id} style={{ borderTop: '1px solid var(--border)' }} className="table-row-hover">
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{i.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{i.unit}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: status.color }}>{parseFloat(i.current_stock)} {i.unit}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{parseFloat(i.min_stock)} {i.unit}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: status.bg, color: status.color }}>{status.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{fmtMoney(i.cost || 0)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => { setEditItem(i); setEditStock(''); setEditReason('compra') }}
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

      {/* Adjust Modal */}
      <Modal show={!!editItem} onClose={() => setEditItem(null)} title={`Ajustar Stock: ${editItem?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '320px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Tipo de movimiento</label>
            <select value={editReason} onChange={e => setEditReason(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }}>
              <option value="compra">📦 Entrada (Compra)</option>
              <option value="ajuste">✏️ Ajuste manual</option>
              <option value="desperdicio">🗑️ Salida (Desperdicio)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Cantidad a {editReason === 'desperdicio' ? 'descontar' : 'sumar'} ({editItem?.unit})
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number" min="0" step="0.001" value={editStock}
                onChange={e => setEditStock(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', fontWeight: '600' }}
                autoFocus
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{editItem?.unit}</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
              Stock actual: <strong>{parseFloat(editItem?.current_stock || 0)} {editItem?.unit}</strong>
              {editStock && <> → nuevo: <strong style={{ color: 'var(--accent)' }}>{(parseFloat(editItem?.current_stock || 0) + (editReason === 'desperdicio' ? -1 : 1) * parseFloat(editStock || 0)).toFixed(3)} {editItem?.unit}</strong></>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditItem(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
            <button onClick={handleAdjust} disabled={!editStock || saving} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', opacity: (!editStock || saving) ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── TAB INGREDIENTES ────────────────────────────────────────────────────────
function TabIngredientes({ tenantId }) {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | ingredient object
  const [form, setForm] = useState({ name: '', unit: 'gr', cost: '', current_stock: '', min_stock: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const data = await dbGetIngredients(tenantId)
    setIngredients(data)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  function openNew() {
    setForm({ name: '', unit: 'gr', cost: '', current_stock: '', min_stock: '' })
    setModal('new')
  }

  function openEdit(i) {
    setForm({ name: i.name, unit: i.unit, cost: i.cost || '', current_stock: i.current_stock || '', min_stock: i.min_stock || '' })
    setModal(i)
  }

  async function handleSave() {
    if (!form.name || !form.unit) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        cost: parseFloat(form.cost) || 0,
        current_stock: parseFloat(form.current_stock) || 0,
        min_stock: parseFloat(form.min_stock) || 0,
      }
      if (modal === 'new') {
        await dbCreateIngredient(tenantId, payload)
      } else {
        await dbUpdateIngredient(modal.id, payload)
      }
      setModal(null)
      load()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este ingrediente? Se eliminará también de las fichas técnicas.')) return
    try {
      await dbDeleteIngredient(id)
      load()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input
          placeholder="🔍 Buscar ingrediente..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '260px' }}
        />
        <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No hay ingredientes. <button onClick={openNew} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}>Crear primero</button>
              </td></tr>
            ) : filtered.map(i => (
              <tr key={i.id} style={{ borderTop: '1px solid var(--border)' }} className="table-row-hover">
                <td style={{ padding: '12px 16px', fontWeight: '600' }}>{i.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{i.unit}</td>
                <td style={{ padding: '12px 16px', fontWeight: '700' }}>{parseFloat(i.current_stock)} {i.unit}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{parseFloat(i.min_stock)} {i.unit}</td>
                <td style={{ padding: '12px 16px' }}>{fmtMoney(i.cost || 0)}</td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(i)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✏️ Editar</button>
                  <button onClick={() => handleDelete(i.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? '🧂 Nuevo Ingrediente' : '✏️ Editar Ingrediente'}>
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

// ─── TAB FICHAS TÉCNICAS ─────────────────────────────────────────────────────
function TabRecetas({ tenantId }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recipe, setRecipe] = useState([]) // [{ ingredient_id, ingredient, quantity }]
  const [addIngId, setAddIngId] = useState('')
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
    setRecipe(rows.map(r => ({
      id: r.id,
      ingredient_id: r.ingredient_id,
      ingredient: r.ingredients,
      quantity: r.quantity
    })))
  }

  function addRow() {
    if (!addIngId || !addQty) return
    const ing = ingredients.find(i => i.id === addIngId)
    if (!ing) return
    if (recipe.find(r => r.ingredient_id === addIngId)) {
      alert('Ese ingrediente ya está en la receta.')
      return
    }
    setRecipe(prev => [...prev, { ingredient_id: addIngId, ingredient: ing, quantity: parseFloat(addQty) }])
    setAddIngId('')
    setAddQty('')
  }

  function removeRow(ing_id) {
    setRecipe(prev => prev.filter(r => r.ingredient_id !== ing_id))
  }

  function updateQty(ing_id, newQty) {
    setRecipe(prev => prev.map(r => r.ingredient_id === ing_id ? { ...r, quantity: newQty } : r))
  }

  async function saveRecipe() {
    if (!selectedProduct) return
    setSaving(true)
    try {
      await dbSetProductIngredients(tenantId, selectedProduct.id, recipe.map(r => ({
        ingredient_id: r.ingredient_id,
        quantity: parseFloat(r.quantity) || 0
      })))
      alert('Ficha técnica guardada ✅')
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredProds = products.filter(p => {
    const matchCat = filterCat === 'all' || p.category_id === filterCat
    const matchSearch = p.name.toLowerCase().includes(searchProd.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: '100%' }}>
      {/* Left: product list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <input
            placeholder="🔍 Buscar producto..."
            value={searchProd} onChange={e => setSearchProd(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg, #f8fafc)', fontSize: '13px', boxSizing: 'border-box' }}
          />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ width: '100%', marginTop: '8px', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg, #f8fafc)', fontSize: '12px' }}>
            <option value="all">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredProds.map(p => (
            <button key={p.id} onClick={() => selectProduct(p)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 16px', textAlign: 'left', background: selectedProduct?.id === p.id ? 'var(--accent)' : 'none',
                color: selectedProduct?.id === p.id ? 'white' : 'var(--text)', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: selectedProduct?.id === p.id ? '700' : '500', transition: 'all 0.1s'
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
            <span style={{ fontSize: '40px' }}>📋</span>
            <p>Seleccioná un producto para ver o editar su ficha técnica</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>📋 {selectedProduct.name}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Ingredientes necesarios para 1 porción / unidad</p>
              </div>
              <button onClick={saveRecipe} disabled={saving}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : '💾 Guardar Ficha'}
              </button>
            </div>

            {/* Ingredient rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {recipe.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>Sin ingredientes asignados aún. Agregá uno abajo.</p>
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
                          <button onClick={() => removeRow(r.ingredient_id)}
                            style={{ padding: '4px 8px', border: 'none', background: '#fee2e2', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Add ingredient row */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--surface-2, #f8fafc)', padding: '12px', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ingrediente</label>
                  <select value={addIngId} onChange={e => setAddIngId(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px' }}>
                    <option value="">Seleccionar...</option>
                    {ingredients.filter(i => !recipe.find(r => r.ingredient_id === i.id)).map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Cantidad</label>
                  <input type="number" min="0" step="0.01" placeholder="0" value={addQty} onChange={e => setAddQty(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '13px', boxSizing: 'border-box' }}
                    onKeyDown={e => e.key === 'Enter' && addRow()} />
                </div>
                <button onClick={addRow} disabled={!addIngId || !addQty}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: !addIngId || !addQty ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                  + Agregar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
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
    dbGetStockMovements(tenantId).then(data => {
      setMovements(data)
      setLoading(false)
    })
  }, [tenantId])

  const REASON_LABELS = {
    venta: { label: 'Venta', icon: '💳', color: '#ef4444' },
    compra: { label: 'Compra / Entrada', icon: '📦', color: '#10b981' },
    ajuste: { label: 'Ajuste Manual', icon: '✏️', color: '#6366f1' },
    desperdicio: { label: 'Desperdicio', icon: '🗑️', color: '#f59e0b' },
  }

  const filtered = filter === 'all' ? movements : movements.filter(m => m.reason === filter)

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'venta', label: '💳 Ventas' },
          { id: 'compra', label: '📦 Compras' },
          { id: 'ajuste', label: '✏️ Ajustes' },
          { id: 'desperdicio', label: '🗑️ Desperdicios' },
        ].map(f => (
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
              {['Tipo', 'Evento', 'Ingrediente', 'Stock Anterior', 'Cambio', 'Stock Nuevo', 'Fecha'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin movimientos registrados</td></tr>
            ) : filtered.map(m => {
              const info = REASON_LABELS[m.reason] || { label: m.reason, icon: '📌', color: '#64748b' }
              const change = parseFloat(m.change_amount)
              const date = new Date(m.created_at)
              return (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }} className="table-row-hover">
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '18px' }}>{info.icon}</span></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: info.color + '20', color: info.color }}>{info.label}</span></td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{m.ingredients?.name || m.item_id?.slice(0, 8)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{parseFloat(m.previous_stock)} {m.ingredients?.unit || ''}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: change >= 0 ? '#10b981' : '#ef4444' }}>
                    {change >= 0 ? '+' : ''}{change} {m.ingredients?.unit || ''}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>{parseFloat(m.new_stock)} {m.ingredients?.unit || ''}</td>
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
