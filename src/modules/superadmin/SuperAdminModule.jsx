import { useState, useEffect } from 'react'
import { dbGetTenants, dbCreateTenantAndOwner, dbToggleTenantStatus, dbGetEmployees, dbUpdateUserPassword, dbDeleteUser } from '../../lib/admin'
import { fmtDate } from '../../lib/supabase'
import { useApp } from '../../lib/AppContext'
import { KeyRound, LogIn, Users, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'

export default function SuperAdminModule() {
  const { setTenantId, setCurrentModule } = useApp()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Users ABM state
  const [usersModalTenant, setUsersModalTenant] = useState(null)
  const [tenantUsers, setTenantUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  const [passwordModalUser, setPasswordModalUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const data = await dbGetTenants()
      setTenants(data)
    } catch (e) {
      console.error(e)
      alert('Error cargando restaurantes: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!restaurantName || !ownerEmail || !ownerPassword || !ownerName) {
      return alert('Por favor, completa todos los campos.')
    }
    
    const domain = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
    const fullEmail = `${ownerEmail}@${domain}`
    
    setSaving(true)
    try {
      await dbCreateTenantAndOwner(restaurantName, fullEmail, ownerPassword, ownerName)
      setShowModal(false)
      setRestaurantName('')
      setOwnerName('')
      setOwnerEmail('')
      setOwnerPassword('')
      await loadData()
      alert('Restaurante y Dueño creados con éxito')
    } catch (e) {
      console.error(e)
      alert('Error al crear restaurante: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(tenantId, currentStatus) {
    if (!confirm(`¿Estás seguro de querer ${currentStatus ? 'DESHABILITAR' : 'HABILITAR'} este restaurante?`)) return
    
    try {
      await dbToggleTenantStatus(tenantId, !currentStatus)
      await loadData()
    } catch (e) {
      alert('Error al cambiar el estado: ' + e.message)
    }
  }

  async function openUsersModal(tenant) {
    setUsersModalTenant(tenant)
    setLoadingUsers(true)
    try {
      const users = await dbGetEmployees(tenant.id)
      setTenantUsers(users)
    } catch (e) {
      alert('Error cargando usuarios: ' + e.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  async function handleImpersonate(tenantId) {
    if (!confirm('Vas a entrar como administrador de este restaurante. ¿Continuar?')) return
    setTenantId(tenantId)
    setCurrentModule('mesas')
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) return alert('La contraseña debe tener al menos 6 caracteres')
    setSavingPass(true)
    try {
      await dbUpdateUserPassword(passwordModalUser.id, newPassword)
      alert('Contraseña actualizada correctamente')
      setPasswordModalUser(null)
      setNewPassword('')
    } catch (e) {
      alert('Error al actualizar contraseña: ' + e.message)
    } finally {
      setSavingPass(false)
    }
  }

  async function handleDeleteUser(userId, role) {
    if (role === 'owner') {
      if (!confirm('ATENCIÓN: Estás a punto de eliminar un dueño. ¿Estás absolutamente seguro?')) return
    } else {
      if (!confirm('¿Seguro que deseas eliminar este usuario permanentemente?')) return
    }
    
    try {
      await dbDeleteUser(userId)
      setTenantUsers(prev => prev.filter(u => u.id !== userId))
    } catch (e) {
      alert('Error al eliminar usuario: ' + e.message)
    }
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="module-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Panel de SuperAdministrador</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestión central de franquicias y dueños de restaurantes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Restaurante
        </button>
      </div>

      <div className="data-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Estado</th>
                <th>Moneda</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Cargando restaurantes...</td>
                </tr>
              ) : tenants.length > 0 ? (
                tenants.map(t => (
                  <tr key={t.id} style={{ opacity: t.is_active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: '600' }}>{t.name} <br/><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.slug}</span></td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: 12, fontWeight: 600,
                        backgroundColor: t.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: t.is_active ? '#22c55e' : '#ef4444'
                      }}>
                        {t.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td>{t.currency || 'USD'}</td>
                    <td>{t.created_at ? fmtDate(t.created_at) : '-'}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className={`btn btn-sm ${t.is_active ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleStatus(t.id, t.is_active)}
                        title={t.is_active ? 'Deshabilitar' : 'Habilitar'}
                      >
                        {t.is_active ? 'Deshabilitar' : 'Habilitar'}
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => openUsersModal(t)}
                        title="Ver Usuarios"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Users size={14} /> ABM
                      </button>
                      <button 
                        className="btn btn-sm"
                        style={{ background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleImpersonate(t.id)}
                        title="Entrar al Panel"
                      >
                        <LogIn size={14} /> Entrar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>No hay restaurantes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal show={showModal} onClose={() => !saving && setShowModal(false)} title="🏢 Nuevo Restaurante">
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <label>Nombre del Restaurante</label>
              <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} required placeholder="Ej: Pizzería Roma" disabled={saving}/>
            </div>
            
            <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />
            <p style={{ marginBottom: 15, fontWeight: 600, color: 'var(--text-color)' }}>Datos del Dueño (Administrador principal)</p>
            
            <div className="form-row">
              <label>Nombre del Dueño</label>
              <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} required placeholder="Ej: Juan Perez" disabled={saving}/>
            </div>
            <div className="form-row">
              <label>Usuario para el Dueño</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={ownerEmail} 
                  onChange={e => setOwnerEmail(e.target.value.replace(/[^a-z0-9_.-]/gi, '').toLowerCase())} 
                  required 
                  placeholder="ej: juan" 
                  disabled={saving}
                  style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                />
                <div style={{ padding: '0 12px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderLeft: 'none', height: '100%', display: 'flex', alignItems: 'center', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', color: 'var(--text-secondary)' }}>
                  @{restaurantName ? restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : 'correo.com'}
                </div>
              </div>
            </div>
            <div className="form-row">
              <label>Contraseña</label>
              <input type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} disabled={saving}/>
            </div>
            
            <div className="form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creando...' : 'Crear Restaurante y Dueño'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {usersModalTenant && (
        <Modal show={true} onClose={() => setUsersModalTenant(null)} title={`Usuarios: ${usersModalTenant.name}`}>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {loadingUsers ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>Cargando usuarios...</div>
            ) : (
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: 12, fontWeight: 'bold',
                          backgroundColor: u.role === 'owner' ? '#fef3c7' : '#e0e7ff',
                          color: u.role === 'owner' ? '#d97706' : '#4338ca'
                        }}>
                          {u.role === 'owner' ? 'Dueño' : 'Empleado'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => setPasswordModalUser(u)}
                          title="Cambiar Contraseña"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleDeleteUser(u.id, u.role)}
                          title="Eliminar Usuario"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tenantUsers.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '16px' }}>No hay usuarios</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}

      {passwordModalUser && (
        <Modal show={true} onClose={() => !savingPass && setPasswordModalUser(null)} title={`Cambiar contraseña de ${passwordModalUser.first_name}`}>
          <form onSubmit={handleChangePassword}>
            <div className="form-row">
              <label>Nueva Contraseña</label>
              <input 
                type="text" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                minLength={6} 
                placeholder="Mínimo 6 caracteres" 
                disabled={savingPass}
              />
            </div>
            <div className="form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPasswordModalUser(null)} disabled={savingPass}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={savingPass}>
                {savingPass ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
