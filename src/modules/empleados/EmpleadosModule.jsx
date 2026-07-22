import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetEmployees, dbCreateEmployee, dbToggleEmployeeStatus,
  dbUpdateEmployee, dbGetEmployeeHours, dbAddEmployeeHours,
  dbUpdateEmployeeHours, dbDeleteEmployeeHours, dbGetTips
} from '../../lib/admin'
import { fmtMoney } from '../../lib/supabase'
import Modal from '../../components/Modal'

const MODULE_OPTIONS = [
  { id: 'mesas',      label: '🪑 Mesas' },
  { id: 'mostrador',  label: '🏪 Mostrador' },
  { id: 'delivery',   label: '📦 Delivery' },
  { id: 'ventas',     label: '📊 Ventas' },
  { id: 'caja',       label: '🏧 Caja' },
  { id: 'clientes',   label: '👥 Clientes' },
  { id: 'productos',  label: '🍽️ Productos' },
]

export default function EmpleadosModule() {
  const { tenantId, userRoles } = useApp()
  const [tab, setTab] = useState('empleados')
  const isOwner = userRoles.includes('owner') || userRoles.includes('super_admin')

  if (!isOwner) return (
    <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>No tenés acceso a este módulo.</div>
  )

  return (
    <div className="module-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>👤 Empleados</h1>
        </div>
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', marginTop: '12px' }}>
          {[
            { id: 'empleados', label: '👤 Equipo' },
            { id: 'horas',     label: '⏱️ Horas Trabajadas' },
            { id: 'propinas',  label: '💸 Propinas' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', background: 'none', border: 'none', whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: tab === t.id ? '700' : '500', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {tab === 'empleados' && <TabEquipo tenantId={tenantId} />}
        {tab === 'horas'     && <TabHoras tenantId={tenantId} />}
        {tab === 'propinas'  && <TabPropinas tenantId={tenantId} />}
      </div>
    </div>
  )
}

// ─── TAB EQUIPO ─────────────────────────────────────────────────────────────
function TabEquipo({ tenantId }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editEmp, setEditEmp] = useState(null)

  // New employee form
  const [newForm, setNewForm] = useState({ email: '', password: '', firstName: '', lastName: '', modules: [], hourly_rate: '' })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try { setEmployees(await dbGetEmployees(tenantId)) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const filtered = employees.filter(e => {
    const s = search.toLowerCase()
    return (e.first_name || '').toLowerCase().includes(s) || (e.last_name || '').toLowerCase().includes(s)
  })

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true); setErrorMsg('')
    try {
      const emp = await dbCreateEmployee(tenantId, newForm.email, newForm.password, newForm.firstName, newForm.lastName, newForm.modules)
      if (newForm.hourly_rate) await dbUpdateEmployee(emp.id, { hourly_rate: parseFloat(newForm.hourly_rate) })
      setShowNew(false)
      setNewForm({ email: '', password: '', firstName: '', lastName: '', modules: [], hourly_rate: '' })
      load()
    } catch (e) { setErrorMsg('Error: ' + (e.message || 'Desconocido')) }
    finally { setSaving(false) }
  }

  async function toggleStatus(emp) {
    if (emp.role === 'owner') return alert('No podés desactivar al dueño')
    await dbToggleEmployeeStatus(emp.id, !emp.is_active)
    load()
  }

  async function saveEdit() {
    if (!editEmp) return
    setSaving(true)
    try {
      await dbUpdateEmployee(editEmp.id, {
        roles: editEmp.roles,
        hourly_rate: parseFloat(editEmp.hourly_rate) || 0
      })
      setEditEmp(null); load()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input placeholder="🔍 Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', width: '260px' }} />
        <button onClick={() => setShowNew(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
          + Nuevo Empleado
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Nombre', 'Rol', 'Permisos', 'Sueldo/h', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin empleados.</td></tr>
                : filtered.map(emp => (
                  <tr key={emp.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{emp.first_name} {emp.last_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: emp.role === 'owner' ? '#dbeafe' : '#f1f5f9', color: emp.role === 'owner' ? '#1e40af' : '#475569' }}>
                        {emp.role === 'owner' ? 'Dueño' : 'Empleado'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                      {emp.role === 'owner' ? 'Acceso Total' : (emp.roles || []).join(', ') || 'Sin acceso'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>{emp.hourly_rate ? fmtMoney(emp.hourly_rate) + '/h' : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>No asignado</span>}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: emp.is_active ? '#16a34a' : '#dc2626' }}>{emp.is_active ? '● Activo' : '● Inactivo'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                      {emp.role !== 'owner' && (
                        <>
                          <button onClick={() => setEditEmp({ ...emp, hourly_rate: emp.hourly_rate || '' })}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            ✏️ Editar
                          </button>
                          <button onClick={() => toggleStatus(emp)}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', color: emp.is_active ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
                            {emp.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Nuevo Empleado */}
      <Modal show={showNew} onClose={() => setShowNew(false)} title="➕ Nuevo Empleado">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '380px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input required value={newForm.firstName} onChange={e => setNewForm(p => ({ ...p, firstName: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Apellido *</label>
                <input required value={newForm.lastName} onChange={e => setNewForm(p => ({ ...p, lastName: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Email *</label>
              <input required type="email" value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Contraseña *</label>
              <input required type="password" minLength={6} value={newForm.password} onChange={e => setNewForm(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sueldo por hora ($)</label>
              <input type="number" min="0" step="0.01" placeholder="Ej: 1200" value={newForm.hourly_rate} onChange={e => setNewForm(p => ({ ...p, hourly_rate: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Módulos accesibles</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {MODULE_OPTIONS.map(mod => (
                  <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: newForm.modules.includes(mod.id) ? 'var(--accent)' : 'none', color: newForm.modules.includes(mod.id) ? 'white' : 'var(--text)', transition: 'all 0.1s' }}>
                    <input type="checkbox" checked={newForm.modules.includes(mod.id)} onChange={() => setNewForm(p => ({ ...p, modules: p.modules.includes(mod.id) ? p.modules.filter(m => m !== mod.id) : [...p.modules, mod.id] }))} style={{ display: 'none' }} />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>
            {errorMsg && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNew(false)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creando...' : 'Crear Empleado'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar permisos y sueldo */}
      <Modal show={!!editEmp} onClose={() => setEditEmp(null)} title={`✏️ Editar: ${editEmp?.first_name} ${editEmp?.last_name}`}>
        {editEmp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '380px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Sueldo por hora ($)</label>
              <input type="number" min="0" step="0.01" placeholder="Ej: 1200" value={editEmp.hourly_rate}
                onChange={e => setEditEmp(p => ({ ...p, hourly_rate: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Módulos accesibles</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {MODULE_OPTIONS.map(mod => {
                  const checked = (editEmp.roles || []).includes(mod.id)
                  return (
                    <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: checked ? 'var(--accent)' : 'none', color: checked ? 'white' : 'var(--text)', transition: 'all 0.1s' }}>
                      <input type="checkbox" checked={checked} onChange={() => setEditEmp(p => ({ ...p, roles: (p.roles || []).includes(mod.id) ? (p.roles || []).filter(m => m !== mod.id) : [...(p.roles || []), mod.id] }))} style={{ display: 'none' }} />
                      {mod.label}
                    </label>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditEmp(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveEdit} disabled={saving}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── TAB HORAS TRABAJADAS ────────────────────────────────────────────────────
function TabHoras({ tenantId }) {
  const [employees, setEmployees] = useState([])
  const [hours, setHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEmp, setFilterEmp] = useState('all')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ user_id: '', work_date: new Date().toISOString().slice(0, 10), hours_worked: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const [emps, hrs] = await Promise.all([
      dbGetEmployees(tenantId),
      dbGetEmployeeHours(tenantId, {
        userId: filterEmp !== 'all' ? filterEmp : undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      })
    ])
    setEmployees(emps)
    setHours(hrs)
    setLoading(false)
  }, [tenantId, filterEmp, filterFrom, filterTo])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.user_id || !form.work_date || !form.hours_worked) return
    setSaving(true)
    try {
      if (modal === 'new') await dbAddEmployeeHours(tenantId, form.user_id, form.work_date, parseFloat(form.hours_worked), form.notes)
      else await dbUpdateEmployeeHours(modal.id, parseFloat(form.hours_worked), form.notes)
      setModal(null); load()
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este registro?')) return
    await dbDeleteEmployeeHours(id)
    load()
  }

  // Summary by employee
  const summaryByEmp = employees.filter(e => e.role !== 'owner').map(emp => {
    const empHours = hours.filter(h => h.user_id === emp.id)
    const totalH = empHours.reduce((s, h) => s + parseFloat(h.hours_worked || 0), 0)
    const totalPay = totalH * (parseFloat(emp.hourly_rate) || 0)
    return { emp, totalH, totalPay }
  })

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {summaryByEmp.map(({ emp, totalH, totalPay }) => (
          <div key={emp.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px' }}>{emp.first_name} {emp.last_name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Horas: <strong style={{ color: 'var(--accent)' }}>{totalH.toFixed(1)}h</strong></div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>A pagar: <strong style={{ color: '#10b981' }}>{fmtMoney(totalPay)}</strong></div>
            {emp.hourly_rate > 0 && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>({fmtMoney(emp.hourly_rate)}/h)</div>}
          </div>
        ))}
      </div>

      {/* Filters + Action */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }}>
          <option value="all">Todos los empleados</option>
          {employees.filter(e => e.role !== 'owner').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>hasta</span>
        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }} />
        <div style={{ flex: 1 }} />
        <button onClick={() => { setForm({ user_id: '', work_date: new Date().toISOString().slice(0, 10), hours_worked: '', notes: '' }); setModal('new') }}
          style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
          + Registrar Horas
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Empleado', 'Fecha', 'Horas', 'Sueldo/h', 'Monto', 'Notas', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : hours.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin registros</td></tr>
                : hours.map(h => {
                  const emp = employees.find(e => e.id === h.user_id)
                  const pay = parseFloat(h.hours_worked) * (parseFloat(emp?.hourly_rate) || 0)
                  return (
                    <tr key={h.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 16px', fontWeight: '600' }}>{h.users?.first_name} {h.users?.last_name}</td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>{new Date(h.work_date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                      <td style={{ padding: '11px 16px', fontWeight: '700', color: 'var(--accent)' }}>{parseFloat(h.hours_worked).toFixed(1)}h</td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>{emp?.hourly_rate ? fmtMoney(emp.hourly_rate) : '--'}</td>
                      <td style={{ padding: '11px 16px', fontWeight: '700', color: '#10b981' }}>{pay > 0 ? fmtMoney(pay) : '--'}</td>
                      <td style={{ padding: '11px 16px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.notes || '--'}</td>
                      <td style={{ padding: '11px 16px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setForm({ user_id: h.user_id, work_date: h.work_date, hours_worked: h.hours_worked, notes: h.notes || '' }); setModal(h) }}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                        <button onClick={() => handleDelete(h.id)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      <Modal show={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? '⏱️ Registrar Horas' : '✏️ Editar Registro'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '320px' }}>
          {modal === 'new' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Empleado *</label>
              <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px' }}>
                <option value="">Seleccionar...</option>
                {employees.filter(e => e.role !== 'owner').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Fecha *</label>
            <input type="date" value={form.work_date} onChange={e => setForm(p => ({ ...p, work_date: e.target.value }))} disabled={modal !== 'new'}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Horas trabajadas *</label>
            <input type="number" min="0" step="0.25" placeholder="Ej: 8 o 4.5" value={form.hours_worked} onChange={e => setForm(p => ({ ...p, hours_worked: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', fontWeight: '700', boxSizing: 'border-box' }} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Notas (opcional)</label>
            <input type="text" placeholder="Ej: Turno tarde" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.hours_worked || (modal === 'new' && !form.user_id)}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: (saving || !form.hours_worked || (modal === 'new' && !form.user_id)) ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── TAB PROPINAS ─────────────────────────────────────────────────────────────
function TabPropinas({ tenantId }) {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const data = await dbGetTips(tenantId, {
        from: filterFrom || undefined,
        to: filterTo || undefined,
        limit: 300
      })
      setTips(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tenantId, filterFrom, filterTo])

  useEffect(() => { load() }, [load])

  const totalTips = tips.reduce((s, t) => s + (parseFloat(t.tip_amount) || 0), 0)

  const METHOD_LABELS = {
    cash:     { label: 'Efectivo', icon: '💵', color: '#10b981' },
    card:     { label: 'Tarjeta',  icon: '💳', color: '#6366f1' },
    transfer: { label: 'Transfer.',icon: '🏦', color: '#f59e0b' },
  }

  return (
    <div>
      {/* Total card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '32px' }}>💸</span>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'white' }}>{fmtMoney(totalTips)}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Total propinas {filterFrom || filterTo ? 'en periodo' : 'histórico'}</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '28px' }}>📊</span>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1' }}>{tips.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Transacciones con propina</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '28px' }}>💰</span>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>
              {tips.length > 0 ? fmtMoney(totalTips / tips.length) : '--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Propina promedio</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Desde:</span>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>hasta:</span>
        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px' }} />
        {(filterFrom || filterTo) && (
          <button onClick={() => { setFilterFrom(''); setFilterTo('') }}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Medio de pago', 'Monto pagado', 'Propina', 'Fecha', 'Orden'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : tips.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>💸</span>
                  Sin propinas registradas. Aparecerán acá automáticamente cuando el pago de una venta supere el total.
                </td></tr>
              ) : tips.map(t => {
                const info = METHOD_LABELS[t.payment_method] || { label: t.payment_method, icon: '💰', color: '#64748b' }
                const date = new Date(t.created_at)
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{info.icon}</span>
                        <span style={{ fontWeight: '600', color: info.color }}>{info.label}</span>
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>{fmtMoney(t.amount)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: '#10b981' }}>{fmtMoney(t.tip_amount)}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {date.toLocaleDateString('es-AR')} {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      #{t.order_id?.slice(0, 8) || '--'}
                    </td>
                  </tr>
                )
              })}
          </tbody>
          {tips.length > 0 && (
            <tfoot>
              <tr style={{ background: 'var(--surface-2, #f8fafc)', borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: '800', fontSize: '13px' }}>TOTAL</td>
                <td colSpan={1}></td>
                <td style={{ padding: '12px 16px', fontWeight: '800', fontSize: '16px', color: '#10b981' }}>{fmtMoney(totalTips)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
