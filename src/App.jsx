import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './lib/AppContext'
import { ShoppingCart } from 'lucide-react'
import { dbGetSession, dbGetTenant, dbGetUserInfo, dbLogout } from './lib/supabase'
import Login from './components/Login'
import PaymentScreen from './components/PaymentScreen'
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
import RepartidorModule from './modules/repartidor/RepartidorModule'
import HistorialModule from './modules/historial/HistorialModule'
import StockModule from './modules/stock/StockModule'
import SuperAdminModule from './modules/superadmin/SuperAdminModule'
import CocinaModule from './modules/cocina/CocinaModule'
import ConfiguracionModule from './modules/configuracion/ConfiguracionModule'
import './App.css'

function AppShell() {
  const { user, setUser, userRoles, setUserRoles, setTenantId, currentModule, mobileComandaOpen, setMobileComandaOpen, cart } = useApp()
  const [loading, setLoading] = useState(true)
  const [accessBlocked, setAccessBlocked] = useState(false)

  function checkAccess(paidUntilStr) {
    if (!paidUntilStr) return false; // Por defecto bloqueado si no hay registro
    const paid = new Date(paidUntilStr + 'T00:00:00'); // Evitar problemas de timezone
    const now = new Date();
    
    const paidMonth = new Date(paid.getFullYear(), paid.getMonth(), 1).getTime();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    if (currentMonth <= paidMonth) return true;
    
    const nextMonthAfterPaid = new Date(paid.getFullYear(), paid.getMonth() + 1, 1).getTime();
    if (currentMonth === nextMonthAfterPaid && now.getDate() <= 10) return true;
    
    return false;
  }

  useEffect(() => {
    async function init() {
      const { data } = await dbGetSession()
      if (data?.session?.user) {
        setUser(data.session.user)
        const userInfo = await dbGetUserInfo(data.session.user.id)
        if (userInfo) {
          let allRoles = []
          if (userInfo.roles && userInfo.roles.length > 0) {
            allRoles = [...userInfo.roles]
          }
          if (userInfo.role) {
            allRoles.push(userInfo.role)
          }
          setUserRoles(allRoles)
          const tenant = await dbGetTenant(userInfo.tenant_id)
          if (tenant) {
            setTenantId(tenant.id)
            if (!allRoles.includes('super_admin')) {
              // Si no es super_admin, comprobamos si debe ser bloqueado por falta de pago
              if (!checkAccess(tenant.paid_until)) {
                setAccessBlocked(true)
              }
            }
          }
        }
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

  if (accessBlocked) return <PaymentScreen />



  const MODULE_MAP = {
    mesas: <MesasModule />,
    mostrador: <MostradorModule />,
    delivery: <DeliveryModule />,
    ventas: <VentasModule />,
    caja: <CajaModule />,
    productos: <ProductosModule />,
    clientes: <ClientesModule />,
    empleados: <EmpleadosModule />,
    repartidor: <RepartidorModule />,
    historial: <HistorialModule />,
    stock: <StockModule />,
    superadmin: <SuperAdminModule />,
    cocina: <CocinaModule />,
    configuracion: <ConfiguracionModule />
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="workspace">
        {MODULE_MAP[currentModule] || <MesasModule />}
      </main>
      
      {/* Comanda Panel */}
      {['mesas', 'mostrador', 'delivery'].includes(currentModule) && (
        <>
          <ComandaPanel />
          {/* FAB on Mobile */}
          {!mobileComandaOpen && (
            <button
              className="mobile-fab"
              onClick={() => setMobileComandaOpen(true)}
              style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                width: '60px',
                height: '60px',
                borderRadius: '30px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'none', // Will be overridden in App.css for mobile
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 90
              }}
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: 'var(--text-primary)',
                  color: 'var(--bg)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {cart.length}
                </span>
              )}
            </button>
          )}
        </>
      )}
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
