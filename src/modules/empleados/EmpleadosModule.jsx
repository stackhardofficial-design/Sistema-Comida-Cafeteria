import { Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import {
  dbGetEmployees, dbCreateEmployee, dbToggleEmployeeStatus,
  dbUpdateEmployee, dbGetEmployeeHours, dbAddEmployeeHours,
  dbUpdateEmployeeHours, dbDeleteEmployeeHours, dbGetTips
} from '../../lib/admin'
import { fmtMoney, dbGetTenant } from '../../lib/supabase'
import Modal from '../../components/Modal'

const MODULE_OPTIONS = [
  { id: 'mesas',      label: '🪑 Mesas' },
  { id: 'mostrador',  label: '<MonitorSmartphone size={18} style={{marginRight:6}} /> Mostrador' },
  { id: 'delivery',   label: '<Package size={18} style={{marginRight:6}} /> Delivery' },
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
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}><User size={14} style={{marginRight:4}} /> Empleados</h1>
        </div>
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', marginTop: '12px' }}>
          {[
            { id: 'empleados', label: '<User size={14} style={{marginRight:4}} /> Equipo' },
            { id: 'horas',     label: '⏱️ Horas Trabajadas' },
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

  const [domain, setDomain] = useState('correo.com')

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try { 
      setEmployees(await dbGetEmployees(tenantId))
      const tenant = await dbGetTenant(tenantId)
      if (tenant && tenant.slug) {
        setDomain(tenant.slug.split('-')[0] + '.com')
      }
    }
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
      const fullEmail = `${newForm.email.replace(/[^a-z0-9_.-]/gi, '').toLowerCase()}@${domain}`
      const emp = await dbCreateEmployee(tenantId, fullEmail, newForm.password, newForm.firstName, newForm.lastName, newForm.modules)
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
        <input placeholder="Buscar  Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)}
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
      <Modal show={showNew} onClose={() => setShowNew(false)} title={<><Plus size={16} style={{marginRight:6}}/> Nuevo Empleado</>}>
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
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Usuario / Correo *</label>
              <div style={{ display: 'flex', alignItems: 'stretch', height: '36px' }}>
                <input required type="text" value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value.replace(/[^a-z0-9_.-]/gi, '').toLowerCase() }))}
                  placeholder="ej: pedro"
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '6px 0 0 6px', boxSizing: 'border-box' }} />
                <div style={{ padding: '0 12px', background: 'var(--surface-2, #f8fafc)', border: '1px solid var(--border)', borderLeft: 'none', display: 'flex', alignItems: 'center', borderRadius: '0 6px 6px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  @{domain}
                </div>
              </div>
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
  const [form, setForm] = useState({
    user_id: '', work_date: new Date().toISOString().slice(0, 10),
    time_in: '', time_out: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [dupWarning, setDupWarning] = useState('')

  // Distribution state
  const [tips, setTips] = useState([])
  const [showDist, setShowDist] = useState(false)
  const [selectedEmps, setSelectedEmps] = useState([])
  const [splitMode, setSplitMode] = useState('equal') // 'equal' | 'hours'
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const [emps, hrs, tps] = await Promise.all([
      dbGetEmployees(tenantId),
      dbGetEmployeeHours(tenantId, {
        userId: filterEmp !== 'all' ? filterEmp : undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      }),
      dbGetTips(tenantId, {
        from: filterFrom || undefined,
        to: filterTo || undefined,
        limit: 300
      })
    ])
    setEmployees(emps)
    setHours(hrs)
    setTips(tps)
    setLoading(false)
  }, [tenantId, filterEmp, filterFrom, filterTo])
  
  // Calculate distribution
  const totalTips = tips.reduce((s, t) => s + (parseFloat(t.tip_amount) || 0), 0)
  const empHoursMap = (() => {
    const map = {}
    hours.forEach(h => { map[h.user_id] = (map[h.user_id] || 0) + parseFloat(h.hours_worked || 0) })
    return map
  })()

  const distribution = (() => {
    if (selectedEmps.length === 0 || totalTips === 0) return []
    const selected = employees.filter(e => selectedEmps.includes(e.id))
    if (splitMode === 'equal') {
      const perPerson = totalTips / selected.length
      return selected.map(e => ({ emp: e, amount: perPerson, pct: 100 / selected.length, hours: null }))
    }
    if (splitMode === 'hours') {
      const totalH = selected.reduce((s, e) => s + (empHoursMap[e.id] || 0), 0)
      if (totalH === 0) {
        const perPerson = totalTips / selected.length
        return selected.map(e => ({ emp: e, amount: perPerson, pct: 100 / selected.length, hours: 0 }))
      }
      return selected.map(e => {
        const h = empHoursMap[e.id] || 0
        const pct = (h / totalH) * 100
        return { emp: e, amount: (pct / 100) * totalTips, pct, hours: h }
      })
    }
    return []
  })()

  function copyToClipboard() {
    const period = filterFrom || filterTo ? `${filterFrom || '...'} al ${filterTo || '...'}` : 'período histórico'
    const lines = [
      `💸 Distribución de Propinas — ${period}`,
      `Total: ${fmtMoney(totalTips)}`,
      `Modo: ${splitMode === 'equal' ? 'Partes iguales' : 'Proporcional por horas'}`,
      '',
      ...distribution.map(d => `• ${d.emp.first_name} ${d.emp.last_name}:  ${fmtMoney(d.amount)}${d.hours !== null ? `  (${d.hours.toFixed(1)}h)` : ''}`)
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => { load() }, [load])

  // Calculate hours from time_in and time_out
  function calcHours(timeIn, timeOut) {
    if (!timeIn || !timeOut) return null
    const [h1, m1] = timeIn.split(':').map(Number)
    const [h2, m2] = timeOut.split(':').map(Number)
    let mins = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (mins < 0) mins += 24 * 60 // overnight shift
    return Math.round(mins) / 60
  }

  const calculatedHours = calcHours(form.time_in, form.time_out)

  // Check duplicate when employee or date changes
  useEffect(() => {
    if (modal !== 'new' || !form.user_id || !form.work_date) { setDupWarning(''); return }
    const exists = hours.find(h => h.user_id === form.user_id && h.work_date === form.work_date)
    if (exists) {
      const emp = employees.find(e => e.id === form.user_id)
      setDupWarning(`⚠️ ${emp?.first_name} ${emp?.last_name} ya tiene un registro para el ${new Date(form.work_date + 'T00:00:00').toLocaleDateString('es-AR')}. Podés editar ese registro o elegir otra fecha.`)
    } else {
      setDupWarning('')
    }
  }, [form.user_id, form.work_date, modal, hours, employees])

  async function handleSave() {
    if (!form.user_id || !form.work_date || !form.time_in || !form.time_out) return
    const hrs = calcHours(form.time_in, form.time_out)
    if (!hrs || hrs <= 0) { alert('La hora de salida debe ser posterior a la de entrada.'); return }

    // Block duplicate on new entry
    if (modal === 'new' && dupWarning) {
      if (!confirm('Ya existe un registro para este empleado en esa fecha. ¿Querés agregar otro de todas formas?')) return
    }

    setSaving(true)
    try {
      if (modal === 'new') {
        await dbAddEmployeeHours(tenantId, form.user_id, form.work_date, hrs, form.notes, form.time_in, form.time_out)
      } else {
        await dbUpdateEmployeeHours(modal.id, hrs, form.notes, form.time_in, form.time_out)
      }
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

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box' }

  return (
    <div>
      {/* Distribucion de Propinas Panel */}
      {showDist && totalTips > 0 && (
        <div style={{ background: 'var(--surface)', border: '2px solid var(--accent)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800' }}>⚖️ Repartir {fmtMoney(totalTips)}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                {filterFrom || filterTo ? `Del ${filterFrom || '...'} al ${filterTo || '...'}` : 'Período histórico completo'}
              </p>
            </div>
            {distribution.length > 0 && (
              <button onClick={copyToClipboard}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: copied ? '#10b981' : 'none', color: copied ? 'white' : 'var(--text)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}>
                {copied ? '✅ Copiado!' : '📋 Copiar resumen'}
              </button>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modo de reparto</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'equal', label: '⚖️ Partes iguales', desc: 'Cada empleado recibe lo mismo' },
                { id: 'hours', label: <><Clock size={16} style={{marginRight:6}}/> Por horas trabajadas</>, desc: 'Proporcional a las hs del período' },
              ].map(m => (
                <button key={m.id} onClick={() => setSplitMode(m.id)} style={{
                  padding: '10px 16px', borderRadius: '10px', border: '2px solid',
                  borderColor: splitMode === m.id ? 'var(--accent)' : 'var(--border)',
                  background: splitMode === m.id ? 'var(--accent)' : 'none',
                  color: splitMode === m.id ? 'white' : 'var(--text)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{m.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {distribution.length > 0 && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Resultado del reparto
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {distribution.map(({ emp, amount, pct, hours }) => (
                  <div key={emp.id} style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '12px', padding: '16px', color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '4px' }}>
                      {emp.first_name} {emp.last_name}
                      {hours !== null && <span style={{ marginLeft: '6px', opacity: 0.7 }}>({hours.toFixed(1)}h)</span>}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>{fmtMoney(amount)}</div>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.25)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'white', borderRadius: '2px' }} />
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{pct.toFixed(1)}% del total</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedEmps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              👆 Seleccioná empleados abajo para ver cómo se reparten las propinas
            </div>
          )}
        </div>
      )}

      {/* Summary cards with selection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Resumen de Horas y Propinas</h4>
        {totalTips > 0 && (
          <button onClick={() => { setShowDist(v => !v); setSplitMode('equal') }}
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: showDist ? '#f59e0b' : 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '12px', transition: 'all 0.15s' }}>
            {showDist ? '✕ Cerrar reparto' : `💸 Repartir ${fmtMoney(totalTips)} en propinas`}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {summaryByEmp.map(({ emp, totalH, totalPay }) => {
          const isSelected = selectedEmps.includes(emp.id)
          const distData = showDist ? distribution.find(d => d.emp.id === emp.id) : null
          const empTip = distData ? distData.amount : 0
          const finalPay = totalPay + empTip
          
          return (
            <div 
              key={emp.id} 
              onClick={() => showDist && setSelectedEmps(prev => prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id])}
              style={{ 
                background: 'var(--surface)', 
                border: `2px solid ${showDist && isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                borderRadius: '12px', 
                padding: '14px',
                cursor: showDist ? 'pointer' : 'default',
                transition: 'all 0.15s',
                position: 'relative'
              }}
            >
              {showDist && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isSelected && <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                </div>
              )}
              <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '14px' }}>{emp.first_name} {emp.last_name}</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Horas</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>{totalH.toFixed(1)}h</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>A pagar</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>{fmtMoney(finalPay)}</div>
                  {empTip > 0 && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      ({fmtMoney(totalPay)} + {fmtMoney(empTip)})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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
        <button onClick={() => {
          setForm({ user_id: '', work_date: new Date().toISOString().slice(0, 10), time_in: '', time_out: '', notes: '' })
          setDupWarning(''); setModal('new')
        }} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
          + Registrar Turno
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2, #f8fafc)' }}>
              {['Empleado', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Sueldo/h', 'Monto', 'Notas', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
              : hours.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Sin registros</td></tr>
                : hours.map(h => {
                  const emp = employees.find(e => e.id === h.user_id)
                  const pay = parseFloat(h.hours_worked) * (parseFloat(emp?.hourly_rate) || 0)
                  return (
                    <tr key={h.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 14px', fontWeight: '600' }}>{h.users?.first_name} {h.users?.last_name}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-secondary)' }}>{new Date(h.work_date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{h.time_in || '--'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{h.time_out || '--'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: '700', color: 'var(--accent)' }}>{parseFloat(h.hours_worked).toFixed(2)}h</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-secondary)' }}>{emp?.hourly_rate ? fmtMoney(emp.hourly_rate) : '--'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: '700', color: '#10b981' }}>{pay > 0 ? fmtMoney(pay) : '--'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.notes || '--'}</td>
                      <td style={{ padding: '11px 14px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => {
                          setForm({ user_id: h.user_id, work_date: h.work_date, time_in: h.time_in || '', time_out: h.time_out || '', notes: h.notes || '' })
                          setDupWarning(''); setModal(h)
                        }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                        <button onClick={() => handleDelete(h.id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal show={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? '⏱️ Registrar Turno' : '✏️ Editar Turno'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '340px' }}>
          {modal === 'new' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Empleado *</label>
              <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))} style={inputStyle}>
                <option value="">Seleccionar...</option>
                {employees.filter(e => e.role !== 'owner').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Fecha *</label>
            <input type="date" value={form.work_date} onChange={e => setForm(p => ({ ...p, work_date: e.target.value }))} disabled={modal !== 'new'} style={inputStyle} />
          </div>

          {/* Duplicate warning */}
          {dupWarning && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #f59e0b', fontSize: '12px', color: '#92400e', lineHeight: '1.4' }}>
              {dupWarning}
            </div>
          )}

          {/* Time in / out */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>🟢 Hora entrada *</label>
              <input type="time" value={form.time_in} onChange={e => setForm(p => ({ ...p, time_in: e.target.value }))} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '16px', fontWeight: '700' }} autoFocus />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>🔴 Hora salida *</label>
              <input type="time" value={form.time_out} onChange={e => setForm(p => ({ ...p, time_out: e.target.value }))} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '16px', fontWeight: '700' }} />
            </div>
          </div>

          {/* Auto-calculated hours preview */}
          {calculatedHours !== null && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: calculatedHours > 0 ? 'rgba(99,102,241,0.08)' : '#fee2e2', border: `1px solid ${calculatedHours > 0 ? 'var(--accent)' : '#ef4444'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>⏱️ Horas calculadas</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: calculatedHours > 0 ? 'var(--accent)' : '#ef4444' }}>
                {calculatedHours > 0 ? `${calculatedHours.toFixed(2)}h` : '⚠️ Revisar horarios'}
              </span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Notas (opcional)</label>
            <input type="text" placeholder="Ej: Turno tarde, cubrió a otro..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, fontSize: '13px' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSave}
              disabled={saving || !form.time_in || !form.time_out || !calculatedHours || calculatedHours <= 0 || (modal === 'new' && !form.user_id)}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: (saving || !form.time_in || !form.time_out || !calculatedHours || calculatedHours <= 0 || (modal === 'new' && !form.user_id)) ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


