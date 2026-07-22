import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetZones, dbCreateZone, dbUpdateZone, dbDeleteZone,
  dbGetTables, dbCreateTable, dbUpdateTable, dbDeleteTable,
  fmtMoney, fmtTimer
} from '../../lib/supabase'
import { sb } from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function MesasModule() {
  const { tenantId, setCurrentContext, setCart, setDiscount, refreshTrigger } = useApp()
  const [zones, setZones] = useState([])
  const [tables, setTables] = useState([])
  const [activeZone, setActiveZone] = useState(null) // null = Todos
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Modals
  const [zoneModal, setZoneModal] = useState(false)
  const [tableModal, setTableModal] = useState(false)
  const [editZone, setEditZone] = useState(null)
  const [editTable, setEditTable] = useState(null)

  // Customer name modal
  const [customerModal, setCustomerModal] = useState(false)
  const [pendingTable, setPendingTable] = useState(null)
  const [customerName, setCustomerName] = useState('')

  // Context menu
  const [ctxMenu, setCtxMenu] = useState(null) // { tableId, x, y }
  const ctxRef = useRef(null)

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadData = useCallback(async () => {
    if (!tenantId) return
    const [z, t] = await Promise.all([dbGetZones(tenantId), dbGetTables(tenantId)])
    setZones(z)
    setTables(t)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { loadData() }, [loadData, refreshTrigger])

  // Realtime subscription
  useEffect(() => {
    if (!tenantId) return
    const tablesChannel = sb.channel('realtime-tables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_tables', filter: `tenant_id=eq.${tenantId}` },
        () => { loadData() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_zones', filter: `tenant_id=eq.${tenantId}` },
        () => { loadData() }
      )
      .subscribe()

    return () => {
      sb.removeChannel(tablesChannel)
    }
  }, [tenantId, loadData])

  // Close context menu on outside click
  useEffect(() => {
    const handler = e => {
      if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredTables = activeZone
    ? tables.filter(t => t.zone_id === activeZone)
    : tables

  const occupied = tables.filter(t => t.status !== 'free').length

  async function selectTable(table) {
    if (table.status !== 'free') {
      // Mesa ocupada: cargar pedido existente
      const { data: orders } = await sb.from('orders')
        .select('*, order_items(*, products(id, name, price))')
        .eq('tenant_id', tenantId)
        .eq('table_db_id', table.id)
        .eq('status', 'open')
        .limit(1)
      const order = orders?.[0] || null
      setCurrentContext({
        type: 'mesa',
        tableDbId: table.id,
        tableName: table.name,
        orderId: order?.id || null,
        customerName: order?.customer_name || null,
        hasOrder: !!order
      })
      if (order?.order_items) {
        setCart(order.order_items.map(oi => ({
          id: oi.id, product: oi.products, qty: oi.quantity, notes: oi.notes || '', dbItemId: oi.id
        })))
      } else {
        setCart([])
      }
    } else {
      // Mesa libre: pedir nombre del cliente antes de abrir
      setPendingTable(table)
      setCustomerName('')
      setCustomerModal(true)
    }
  }

  function confirmCustomer() {
    if (!pendingTable) return
    setCurrentContext({
      type: 'mesa',
      tableDbId: pendingTable.id,
      tableName: pendingTable.name,
      orderId: null,
      customerName: customerName.trim() || null,
      hasOrder: false
    })
    setCart([])
    setDiscount({ type: 'none', value: 0 })
    setCustomerModal(false)
    setPendingTable(null)
  }

  // ===== ZONE CRUD =====
  async function saveZone(name) {
    try {
      if (editZone) {
        await dbUpdateZone(editZone.id, { name })
      } else {
        await dbCreateZone(tenantId, name)
      }
      await loadData()
      setZoneModal(false)
      setEditZone(null)
      showToast(editZone ? 'Zona actualizada' : 'Zona creada', 'success')
    } catch (e) {
      showToast('Error: ' + e.message, 'error')
    }
  }

  async function deleteZone(zoneId) {
    if (!confirm('¿Eliminar esta zona? Las mesas quedarán sin zona.')) return
    try {
      await dbDeleteZone(zoneId)
      if (activeZone === zoneId) setActiveZone(null)
      await loadData()
      showToast('Zona eliminada', 'success')
    } catch (e) {
      showToast('Error al eliminar zona', 'error')
    }
  }

  // ===== TABLE CRUD =====
  async function saveTable(payload) {
    try {
      if (editTable) {
        await dbUpdateTable(editTable.id, payload)
        showToast('Mesa actualizada', 'success')
      } else {
        await dbCreateTable(tenantId, { ...payload, zone_id: activeZone || zones[0]?.id })
        showToast('Mesa agregada', 'success')
      }
      await loadData()
      setTableModal(false)
      setEditTable(null)
    } catch (e) {
      showToast('Error: ' + e.message, 'error')
    }
  }

  async function deleteTable(tableId) {
    if (!confirm('¿Eliminar esta mesa?')) return
    try {
      await dbDeleteTable(tableId)
      await loadData()
      setCtxMenu(null)
      showToast('Mesa eliminada', 'success')
    } catch (e) {
      showToast('Error al eliminar mesa', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="module-header">
        <div className="module-header-left">
          <div className="module-header-top">
            <h1>Mesas</h1>
            <span className="occupancy-pill">{occupied}/{tables.length} ocupadas</span>
          </div>
          {/* Zone Tabs */}
          <div className="zone-tabs">
            <button
              className={`zone-tab${!activeZone ? ' active' : ''}`}
              onClick={() => setActiveZone(null)}
            >
              Todos
            </button>
            {zones.map(z => (
              <button
                key={z.id}
                className={`zone-tab${activeZone === z.id ? ' active' : ''}`}
                onClick={() => setActiveZone(z.id)}
                onContextMenu={e => { e.preventDefault(); setEditZone(z); setZoneModal(true) }}
                title="Clic derecho para editar"
              >
                {z.name}
              </button>
            ))}
            <button className="btn-add-zone" onClick={() => { setEditZone(null); setZoneModal(true) }}>
              + Zona
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditTable(null); setTableModal(true) }}>
            + Mesa
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mesas-workspace">
        {loading ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>Cargando mesas...</p>
          </div>
        ) : filteredTables.length === 0 && zones.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🪑</span>
            <p>No hay mesas. Creá una zona primero.</p>
          </div>
        ) : (
          <div className="tables-grid">
            {filteredTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                onSelect={() => selectTable(table)}
                onContextMenu={e => {
                  e.preventDefault()
                  setCtxMenu({ table, x: e.clientX, y: e.clientY })
                }}
              />
            ))}
            {/* Add table button */}
            <button className="btn-add-table" onClick={() => { setEditTable(null); setTableModal(true) }}>
              <span>＋</span>
              <span>Mesa</span>
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="ctx-dropdown"
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 999 }}
        >
          <button className="ctx-item" onClick={() => {
            setEditTable(ctxMenu.table)
            setTableModal(true)
            setCtxMenu(null)
          }}>✏️ Editar Mesa</button>
          <button className="ctx-item danger" onClick={() => deleteTable(ctxMenu.table.id)}>
            🗑️ Eliminar
          </button>
        </div>
      )}

      {/* Zone Modal */}
      <ZoneModal
        show={zoneModal}
        zone={editZone}
        zones={zones}
        onClose={() => { setZoneModal(false); setEditZone(null) }}
        onSave={saveZone}
        onDelete={deleteZone}
      />

      {/* Table Modal */}
      <TableModal
        show={tableModal}
        table={editTable}
        zones={zones}
        activeZone={activeZone}
        onClose={() => { setTableModal(false); setEditTable(null) }}
        onSave={saveTable}
      />

      {/* Customer Name Modal */}
      <Modal show={customerModal} onClose={() => setCustomerModal(false)} title={`🪑 ${pendingTable?.name || 'Mesa'}`}>
        <form onSubmit={e => { e.preventDefault(); confirmCustomer() }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Ingresá el nombre del cliente para identificar el pedido (opcional).
          </p>
          <div className="form-row" style={{ marginBottom: 20 }}>
            <label>Nombre del cliente</label>
            <input
              autoFocus
              type="text"
              placeholder="Ej: Juan, Mesa cumpleaños, Familia García..."
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { confirmCustomer() }}>
              Sin nombre
            </button>
            <button type="submit" className="btn btn-primary">
              ✅ Abrir Mesa
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  )
}

// ===== TABLE CARD =====
function TableCard({ table, onSelect, onContextMenu }) {
  const status = table.status || 'free'
  const order = table.orders?.find(o => o.status === 'open' || o.status === 'billing')
  const shape = table.shape === 'circle' ? ' circle' : ''
  const num = table.name.replace(/[^0-9]/g, '') || table.name
  const statusLabel = status === 'free' ? 'Libre' : status === 'billing' ? 'Cobrando' : 'Ocupada'

  return (
    <div
      className={`table-card ${status}${shape}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      title={`${table.name} — ${statusLabel}`}
    >
      <div className="table-num">{num}</div>
      {order && (
        <>
          {order.customer_name && (
            <div className="table-customer" style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px', opacity: 0.9 }}>
              👤 {order.customer_name}
            </div>
          )}
          <div className="table-amount">{fmtMoney(order.total_amount)}</div>
          <div className="table-timer">{fmtTimer(order.created_at)}</div>
        </>
      )}
      <div className="table-meta">
        {status === 'free' ? '✓ Libre' : status === 'billing' ? '💳' : '🍽️'}
      </div>
    </div>
  )
}

// ===== ZONE MODAL =====
function ZoneModal({ show, zone, zones, onClose, onSave, onDelete }) {
  const [name, setName] = useState('')
  useEffect(() => { setName(zone?.name || '') }, [zone])

  function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <Modal show={show} onClose={onClose} title={zone ? `Editar zona: ${zone.name}` : '+ Nueva Zona'}>
      <form onSubmit={handleSave}>
        <div className="form-row">
          <label>Nombre de la zona</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Salón, Terraza, Barra..."
            required
          />
        </div>
        <div className="form-actions">
          {zone && (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { onClose(); onDelete(zone.id) }}>
              Eliminar
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            {zone ? 'Guardar' : 'Crear Zona'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ===== TABLE MODAL =====
function TableModal({ show, table, zones, activeZone, onClose, onSave }) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(4)
  const [zoneId, setZoneId] = useState('')
  const [shape, setShape] = useState('square')

  useEffect(() => {
    if (table) {
      setName(table.name)
      setCapacity(table.capacity || 4)
      setZoneId(table.zone_id || '')
      setShape(table.shape || 'square')
    } else {
      setName('')
      setCapacity(4)
      setZoneId(activeZone || zones[0]?.id || '')
      setShape('square')
    }
  }, [table, show, activeZone, zones])

  function handleSave(e) {
    e.preventDefault()
    onSave({ name: name.trim(), capacity: Number(capacity), zone_id: zoneId, shape })
  }

  return (
    <Modal show={show} onClose={onClose} title={table ? `Editar: ${table.name}` : '+ Nueva Mesa'}>
      <form onSubmit={handleSave}>
        <div className="form-row">
          <label>Zona / Sector</label>
          <select value={zoneId} onChange={e => setZoneId(e.target.value)} required>
            <option value="">— Seleccionar zona —</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Nombre de la mesa</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Mesa 5, Barra 1, VIP..."
            required
          />
        </div>
        <div className="form-row">
          <label>Capacidad (personas)</label>
          <input type="number" min={1} max={20} value={capacity} onChange={e => setCapacity(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Forma</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {[['square', '▪ Cuadrada'], ['circle', '● Circular']].map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: shape === val ? 700 : 400 }}>
                <input type="radio" name="shape" value={val} checked={shape === val} onChange={() => setShape(val)} />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            {table ? 'Guardar' : 'Crear Mesa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
