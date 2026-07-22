import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './lib/AppContext'
import { dbGetSession, dbGetTenant, dbGetUserInfo, dbLogout } from './lib/supabase'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import ComandaPanel from './modules/comanda/ComandaPanel'
import MesasModule from './modules/mesas/MesasModule'
import MostradorModule from './modules/mostrador/MostradorModule'
import DeliveryModule from './modules/delivery/DeliveryModule'
import VentasModule from './modules/ventas/VentasModule'
import CajaModule from './modules/caja/CajaModule'
import ProductosModule from './modules/productos/ProductosModule'
import ClientesModule from './modules/clientes/ClientesModule'
import EmpleadosModule from './modules/empleados/EmpleadosModule'
import './App.css'

function AppShell() {
  const { user, setUser, setUserRoles, setTenantId, currentModule } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data } = await dbGetSession()
      if (data?.session?.user) {
        setUser(data.session.user)
        const userInfo = await dbGetUserInfo(data.session.user.id)
        if (userInfo && userInfo.roles && userInfo.roles.length > 0) {
          setUserRoles(userInfo.roles)
        } else if (userInfo && (userInfo.role === 'owner' || userInfo.role === 'super_admin')) {
          // Fallback if roles array is empty but is owner/super_admin
          setUserRoles([userInfo.role])
        }
        const tenant = await dbGetTenant()
        if (tenant) setTenantId(tenant.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1d23', color: 'white', fontSize: 16, fontFamily: 'Inter, sans-serif' }}>
      Cargando sistema...
    </div>
  )

  if (!user) return <Login />

  const MODULE_MAP = {
    mesas: <MesasModule />,
    mostrador: <MostradorModule />,
    delivery: <DeliveryModule />,
    ventas: <VentasModule />,
    caja: <CajaModule />,
    productos: <ProductosModule />,
    clientes: <ClientesModule />,
    empleados: <EmpleadosModule />,
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="workspace">
        {MODULE_MAP[currentModule] || <MesasModule />}
      </main>
      <ComandaPanel />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
