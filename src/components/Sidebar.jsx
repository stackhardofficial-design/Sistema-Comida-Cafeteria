import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { dbLogout } from '../lib/supabase'
import { Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, Box, Contact, History, Database, ShieldAlert, LogOut, Sun, Moon } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'mesas', icon: <Grid size={18} />, label: 'Mesas' },
  { id: 'mostrador', icon: <MonitorSmartphone size={18} />, label: 'Mostrador' },
  { id: 'cocina', icon: <ChefHat size={18} />, label: 'Cocina' },
  { id: 'delivery', icon: <Package size={18} />, label: 'Delivery' },
  { id: 'repartidor', icon: <Bike size={18} />, label: 'Repartidor' },
  { id: 'ventas', icon: <TrendingUp size={18} />, label: 'Ventas' },
  { id: 'caja', icon: <MonitorCheck size={18} />, label: 'Caja' },
  { id: 'clientes', icon: <Users size={18} />, label: 'Clientes' },
  { id: 'productos', icon: <Box size={18} />, label: 'Productos' },
]

export default function Sidebar() {
  const { user, userRoles, setUser, setTenantId, currentModule, setCurrentModule } = useApp()
  const [clock, setClock] = useState('')
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const isDarkMode = !document.body.classList.contains('light-mode')
    setIsDark(isDarkMode)
    if (isDarkMode) document.body.classList.add('dark-mode')
  }, [])

  function toggleTheme() {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        document.body.classList.add('dark-mode')
        document.body.classList.remove('light-mode')
      } else {
        document.body.classList.add('light-mode')
        document.body.classList.remove('dark-mode')
      }
      return next
    })
  }

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }))
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

  // Owners get to see Empleados and Historial modules
  if (isOwner) {
    allowedItems.push({ id: 'empleados', icon: <Contact size={18} />, label: 'Empleados' })
    allowedItems.push({ id: 'historial', icon: <History size={18} />, label: 'Historial' })
    allowedItems.push({ id: 'stock', icon: <Database size={18} />, label: 'Stock' })
  }

  // SuperAdmin gets the Admin panel
  if (user?.email === 'superadmin@stackhard.com' || userRoles.includes('super_admin')) {
    allowedItems.push({ id: 'superadmin', icon: <ShieldAlert size={18} />, label: 'Admin' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'linear-gradient(135deg, #4f4f4f 0%, #333333 100%)',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Database size={18} color="#FF6600" />
          </div>
          <span className="logo-text" style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Stack</span><span style={{ color: 'var(--accent)' }}>Hard</span>
          </span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
          INGENIERÍA DE SISTEMAS &<br/>ARQUITECTURA DE SOFTWARE
        </span>
      </div>
      <nav className="sidebar-nav">
        {allowedItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${currentModule === item.id ? ' active' : ''}`}
            onClick={() => setCurrentModule(item.id)}
          >
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', color: currentModule === item.id ? 'var(--accent)' : 'inherit' }}>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-user" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--surface-2)', padding: '6px', borderRadius: '50%', color: 'var(--text-secondary)' }}>
            <Users size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <span className="user-clock" style={{ color: 'var(--accent)' }}>{clock}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-logout" onClick={toggleTheme} title="Cambiar Tema" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button className="btn-logout" onClick={logout} title="Cerrar sesión" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
