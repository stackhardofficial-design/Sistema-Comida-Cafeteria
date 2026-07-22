import { useState, useEffect } from 'react'
import { dbGetTenants, dbCreateTenantAndOwner, dbToggleTenantStatus } from '../../lib/admin'
import { fmtDate, dbLogout } from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function SuperAdminModule() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [restaurantName, setRestaurantName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

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
    
    setSaving(true)
    try {
      await dbCreateTenantAndOwner(restaurantName, ownerEmail, ownerPassword, ownerName)
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

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="module-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Panel de SuperAdministrador</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestión central de franquicias y dueños de restaurantes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo Restaurante
          </button>
          <button className="btn btn-secondary" onClick={async () => { await dbLogout(); window.location.href = '/' }}>
            Cerrar Sesión
          </button>
        </div>
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
                    <td>
                      <button 
                        className={`btn btn-sm ${t.is_active ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleStatus(t.id, t.is_active)}
                      >
                        {t.is_active ? 'Deshabilitar' : 'Habilitar'}
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
              <label>Correo Electrónico (Para iniciar sesión)</label>
              <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required placeholder="dueño@correo.com" disabled={saving}/>
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
    </div>
  )
}
