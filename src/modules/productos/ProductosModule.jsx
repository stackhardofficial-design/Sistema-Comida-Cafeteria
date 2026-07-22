import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetAllProducts, dbGetCategories, dbSaveProduct, dbDeleteProduct,
  dbSaveCategory, dbDeleteCategory, fmtMoney, sb
} from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function ProductosModule() {
  const { tenantId, triggerRefresh } = useApp()
  const [activeTab, setActiveTab] = useState('productos') // 'productos' | 'categorias'
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchProd, setSearchProd] = useState('')
  const [selectedCatFilter, setSelectedCatFilter] = useState('')

  // Modales Producto
  const [prodModal, setProdModal] = useState(false)
  const [editingProd, setEditingProd] = useState(null) // null para nuevo
  const [pName, setPName] = useState('')
  const [pSku, setPSku] = useState('')
  const [pCat, setPCat] = useState('')
  const [pPrice, setPPrice] = useState('')
  const [pActive, setPActive] = useState('true')
  const [pDesc, setPDesc] = useState('')

  // Modales Categoría
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [cName, setCName] = useState('')
  const [cDesc, setCDesc] = useState('')

  async function loadData() {
    if (!tenantId) return
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([
        dbGetAllProducts(tenantId),
        dbGetCategories(tenantId)
      ])
      setProducts(prods)
      setCategories(cats)
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
    const prodChannel = sb.channel('realtime-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `tenant_id=eq.${tenantId}` },
        () => { loadData() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `tenant_id=eq.${tenantId}` },
        () => { loadData() }
      )
      .subscribe()

    return () => {
      sb.removeChannel(prodChannel)
    }
  }, [tenantId])

  // Guardar Producto
  async function saveProduct(e) {
    e.preventDefault()
    if (!pName || !pPrice || !pCat) {
      alert('Completá nombre, categoría y precio')
      return
    }
    try {
      const payload = {
        name: pName,
        sku: pSku,
        category_id: pCat,
        price: parseFloat(pPrice),
        description: pDesc,
        is_active: pActive === 'true'
      }
      await dbSaveProduct(tenantId, payload, editingProd?.id || null)
      setProdModal(false)
      loadData()
      triggerRefresh()
    } catch (e) {
      alert('Error al guardar producto: ' + e.message)
    }
  }

  // Eliminar Producto
  async function deleteProduct(prod) {
    if (!confirm(`¿Eliminar "${prod.name}"?`)) return
    try {
      await dbDeleteProduct(prod.id)
      loadData()
      triggerRefresh()
    } catch (e) {
      alert('Error al eliminar producto')
    }
  }

  function openNewProd() {
    setEditingProd(null)
    setPName('')
    setPSku('')
    setPCat(categories[0]?.id || '')
    setPPrice('')
    setPActive('true')
    setPDesc('')
    setProdModal(true)
  }

  function openEditProd(prod) {
    setEditingProd(prod)
    setPName(prod.name)
    setPSku(prod.sku || '')
    setPCat(prod.category_id || '')
    setPPrice(prod.price)
    setPActive(prod.is_active ? 'true' : 'false')
    setPDesc(prod.description || '')
    setProdModal(true)
  }

  // Guardar Categoría
  async function saveCategory(e) {
    e.preventDefault()
    if (!cName) {
      alert('Ingresá un nombre')
      return
    }
    try {
      const payload = {
        name: cName,
        description: cDesc,
        is_active: true
      }
      const newCat = await dbSaveCategory(tenantId, payload, editingCat?.id || null)
      setCatModal(false)
      // Recargar datos y seleccionar la nueva categoría
      const [prods, cats] = await Promise.all([
        dbGetAllProducts(tenantId),
        dbGetCategories(tenantId)
      ])
      setProducts(prods)
      setCategories(cats)
      if (newCat && !editingCat) {
        setPCat(newCat.id)
      }
      triggerRefresh()
    } catch (e) {
      alert('Error al guardar categoría: ' + e.message)
    }
  }

  // Eliminar Categoría
  async function deleteCategory(cat) {
    if (!confirm(`¿Eliminar "${cat.name}"?`)) return
    try {
      await dbDeleteCategory(cat.id)
      loadData()
      triggerRefresh()
    } catch (e) {
      alert('Error al eliminar categoría')
    }
  }

  function openNewCat() {
    setEditingCat(null)
    setCName('')
    setCDesc('')
    setCatModal(true)
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchProd || p.name.toLowerCase().includes(searchProd.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchProd.toLowerCase())
    const matchCat = !selectedCatFilter || p.category_id === selectedCatFilter
    return matchSearch && matchCat
  })

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Productos</h1>
          <div className="tab-buttons" style={{ display: 'flex', background: 'var(--card-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button
              className={`tab-btn${activeTab === 'productos' ? ' active' : ''}`}
              onClick={() => setActiveTab('productos')}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: activeTab === 'productos' ? 'var(--primary)' : 'transparent', color: activeTab === 'productos' ? 'white' : 'var(--text-secondary)' }}
            >
              Productos
            </button>
            <button
              className={`tab-btn${activeTab === 'categorias' ? ' active' : ''}`}
              onClick={() => setActiveTab('categorias')}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: activeTab === 'categorias' ? 'var(--primary)' : 'transparent', color: activeTab === 'categorias' ? 'white' : 'var(--text-secondary)' }}
            >
              Categorías
            </button>
          </div>
        </div>
        {activeTab === 'productos' ? (
          <button className="btn btn-primary" onClick={openNewProd}>+ Nuevo Producto</button>
        ) : (
          <button className="btn btn-primary" onClick={openNewCat}>+ Nueva Categoría</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Cargando datos...</div>
      ) : activeTab === 'productos' ? (
        <div className="data-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div className="data-toolbar" style={{ display: 'flex', gap: '12px' }}>
            <input
              className="filter-input"
              placeholder="Buscar por nombre o código..."
              value={searchProd}
              onChange={e => setSearchProd(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="filter-date"
              value={selectedCatFilter}
              onChange={e => setSelectedCatFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td><code style={{ fontSize: '11px' }}>{p.sku || '-'}</code></td>
                      <td style={{ fontWeight: '600' }}>{p.name}</td>
                      <td>{p.categories?.name || '-'}</td>
                      <td style={{ fontWeight: '700' }}>{fmtMoney(p.price)}</td>
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                          {p.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon edit" onClick={() => openEditProd(p)} title="Editar">✏️</button>
                        <button className="btn-icon del" onClick={() => deleteProduct(p)} title="Eliminar" style={{ marginLeft: '6px' }}>🗑️</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                      <div className="empty-state">
                        <span className="empty-icon">📦</span>
                        <p>Sin productos registrados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="data-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? (
                  categories.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600' }}>{c.name}</td>
                      <td>{c.description || '-'}</td>
                      <td>
                        <button className="btn-icon del" onClick={() => deleteCategory(c)} title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px' }}>
                      <div className="empty-state">
                        <span className="empty-icon">🍽️</span>
                        <p>Sin categorías registradas</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal CRUD Producto */}
      <Modal show={prodModal} onClose={() => setProdModal(false)} title={`${editingProd ? 'Editar' : 'Nuevo'} Producto`}>
        <form onSubmit={saveProduct}>
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-row">
              <label>Nombre *</label>
              <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Nombre del producto" required />
            </div>
            <div className="form-row">
              <label>Código (SKU)</label>
              <input value={pSku} onChange={e => setPSku(e.target.value)} placeholder="BEB001" />
            </div>
            <div className="form-row">
              <label>Categoría *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={pCat} onChange={e => setPCat(e.target.value)} required style={{ flex: 1 }}>
                  <option value="">Selecciona...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary" onClick={openNewCat} style={{ padding: '0 12px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>＋</button>
              </div>
            </div>
            <div className="form-row">
              <label>Precio *</label>
              <input type="number" step="any" value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="form-row">
              <label>Estado</label>
              <select value={pActive} onChange={e => setPActive(e.target.value)}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: '20px' }}>
            <label>Descripción</label>
            <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Descripción del producto..." style={{ width: '100%', minHeight: '80px' }} />
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setProdModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Modal CRUD Categoría */}
      <Modal show={catModal} onClose={() => setCatModal(false)} title="Nueva Categoría">
        <form onSubmit={saveCategory}>
          <div className="form-row" style={{ marginBottom: '12px' }}>
            <label>Nombre *</label>
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Bebidas, Postres..." required />
          </div>
          <div className="form-row" style={{ marginBottom: '20px' }}>
            <label>Descripción</label>
            <input value={cDesc} onChange={e => setCDesc(e.target.value)} placeholder="Descripción opcional" />
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCatModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
