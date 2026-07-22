import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetEmployees, dbCreateEmployee, dbToggleEmployeeStatus } from '../../lib/admin'
import Modal from '../../components/Modal'

const MODULE_OPTIONS = [
  { id: 'mesas', label: 'Mesas' },
  { id: 'mostrador', label: 'Mostrador' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'caja', label: 'Caja' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'productos', label: 'Productos' },
]

export default function EmpleadosModule() {
  const { tenantId, userRoles } = useApp()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Modal de Nuevo Empleado
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedModules, setSelectedModules] = useState([])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Check if current user is owner
  const isOwner = userRoles.includes('owner')

  async function loadEmployees() {
    if (!tenantId || !isOwner) return
    try {
      setLoading(true)
      const data = await dbGetEmployees(tenantId)
      setEmployees(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [tenantId, isOwner])

  const toggleModule = (modId) => {
    setSelectedModules(prev => 
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    )
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      const newUser = await dbCreateEmployee(
        tenantId, 
        email, 
        password, 
        firstName, 
        lastName, 
        selectedModules
      )
      setEmployees([...employees, newUser])
      setShowModal(false)
      // Reset form
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
      setSelectedModules([])
    } catch (e) {
      setErrorMsg('Error al crear empleado: ' + (e.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(employee) {
    if (employee.role === 'owner') return alert('No puedes desactivar a un dueño')
    try {
      const updated = await dbToggleEmployeeStatus(employee.id, !employee.is_active)
      setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))
    } catch (e) {
      alert('Error al cambiar estado')
    }
  }

  if (!isOwner) {
    return <div style={{ padding: '24px' }}>No tienes acceso a este módulo.</div>
  }

  const filteredEmployees = employees.filter(e => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (e.first_name || '').toLowerCase().includes(s) ||
      (e.last_name || '').toLowerCase().includes(s) ||
      (e.email || '').toLowerCase().includes(s) // users table no tiene email por defecto en auth real, pero en un MVP podria
    )
  })

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div className="module-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Empleados</h1>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
        >
          + Nuevo Empleado
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', flex: 1, outline: 'none' }}
          />
        </div>

        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: '#64748b' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Nombre</th>
                <th style={{ padding: '12px 16px' }}>Rol</th>
                <th style={{ padding: '12px 16px' }}>Permisos</th>
                <th style={{ padding: '12px 16px' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center' }}>Cargando...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center' }}>No hay empleados registrados.</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        background: emp.role === 'owner' ? '#dbeafe' : '#f1f5f9', 
                        color: emp.role === 'owner' ? '#1e40af' : '#475569',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
                      }}>
                        {emp.role === 'owner' ? 'Dueño' : 'Empleado'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {emp.role === 'owner' ? 'Acceso Total' : (emp.roles || []).join(', ') || 'Sin acceso'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        color: emp.is_active ? '#16a34a' : '#dc2626',
                        fontWeight: '600', fontSize: '13px'
                      }}>
                        {emp.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {emp.role !== 'owner' && (
                        <button 
                          onClick={() => toggleStatus(emp)}
                          style={{ 
                            padding: '6px 12px', 
                            background: 'white', 
                            border: '1px solid var(--border)', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: emp.is_active ? '#dc2626' : '#16a34a'
                          }}
                        >
                          {emp.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Agregar Empleado">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>Nombre *</label>
                <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>Apellido *</label>
                <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>Email (Usuario) *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: '600' }}>Contraseña *</label>
              <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', fontWeight: '600', marginTop: '10px' }}>Permisos (Módulos accesibles)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {MODULE_OPTIONS.map(mod => (
                  <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedModules.includes(mod.id)}
                      onChange={() => toggleModule(mod.id)}
                    />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{errorMsg}</div>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Creando...' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
