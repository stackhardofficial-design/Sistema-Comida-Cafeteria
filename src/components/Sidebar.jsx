import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { dbLogout } from '../lib/supabase'

const NAV_ITEMS = [
  { id: 'mesas', icon: '🪑', label: 'Mesas' },
  { id: 'mostrador', icon: '🏪', label: 'Mostrador' },
  { id: 'delivery', icon: '🛵', label: 'Delivery' },
  { id: 'ventas', icon: '📊', label: 'Ventas' },
  { id: 'caja', icon: '🏧', label: 'Caja' },
  { id: 'clientes', icon: '👥', label: 'Clientes' },
  { id: 'productos', icon: '📦', label: 'Productos' },
]

export default function Sidebar() {
  const { user, userRoles, setUser, setTenantId, currentModule, setCurrentModule } = useApp()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  async function logout() {
    await dbLogout()
    setUser(null)
    setTenantId(null)
  }

  const displayName = user?.email?.split('@')[0] || 'Admin'
  const isOwner = userRoles.includes('owner') || userRoles.includes('super_admin')
  const displayRole = isOwner ? 'Administrador' : 'Empleado'

  // Filter items based on userRoles
  const allowedItems = NAV_ITEMS.filter(item => 
    isOwner || userRoles.includes(item.id)
  )

  // Owners get to see Empleados module
  if (isOwner) {
    allowedItems.push({ id: 'empleados', icon: '👤', label: 'Empleados' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">🍽️</span>
        <span className="logo-text">StackHard</span>
      </div>
      <nav className="sidebar-nav">
        {allowedItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${currentModule === item.id ? ' active' : ''}`}
            onClick={() => setCurrentModule(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="user-avatar">👤</span>
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          <span className="user-role">{displayRole}</span>
          <span className="user-clock">{clock}</span>
        </div>
        <button className="btn-logout" onClick={logout} title="Cerrar sesión">⏏</button>
      </div>
    </aside>
  )
}
