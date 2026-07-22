import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const getInitialModule = () => {
    const path = window.location.pathname.replace(/^\/+/, '')
    const validModules = ['mesas', 'mostrador', 'delivery', 'ventas', 'caja', 'clientes', 'productos', 'empleados', 'historial', 'stock', 'configuracion']
    return validModules.includes(path) ? path : 'mesas'
  }
  
  const [user, setUser] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const [tenantId, setTenantId] = useState(null)
  const [currentModule, _setCurrentModule] = useState(getInitialModule)
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState({ type: 'none', value: 0 })

  const setCurrentModule = useCallback((mod) => {
    _setCurrentModule(mod)
    window.history.pushState(null, '', `/${mod}`)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '')
      _setCurrentModule(path || 'mesas')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [currentContext, setCurrentContext] = useState(null)
  // { type: 'mesa'|'mostrador'|'delivery', tableDbId, tableName, orderId }

  const clearCart = useCallback(() => {
    setCart([])
    setDiscount({ type: 'none', value: 0 })
    setCurrentContext(null)
  }, [])

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discountAmount = discount.type === 'percent'
    ? cartTotal * (discount.value / 100)
    : discount.type === 'fixed' ? discount.value : 0
  const grandTotal = Math.max(0, cartTotal - discountAmount)

  return (
    <AppContext.Provider value={{
      user, setUser,
      userRoles, setUserRoles,
      tenantId, setTenantId,
      currentModule, setCurrentModule,
      cart, setCart,
      discount, setDiscount,
      currentContext, setCurrentContext,
      clearCart,
      cartTotal, discountAmount, grandTotal,
      refreshTrigger, triggerRefresh
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
