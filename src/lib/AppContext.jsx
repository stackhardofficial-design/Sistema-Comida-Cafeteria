import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { sb } from './supabase'

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
  const [mobileComandaOpen, setMobileComandaOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

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
  const syncChannelRef = useRef(null)

  useEffect(() => {
    if (!tenantId) return
    const channel = sb.channel(`global-sync-${tenantId}`)
    channel.on('broadcast', { event: 'force-refresh' }, () => {
      setRefreshTrigger(prev => prev + 1)
    }).subscribe()
    
    syncChannelRef.current = channel
    return () => {
      sb.removeChannel(channel)
      syncChannelRef.current = null
    }
  }, [tenantId])

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
    if (syncChannelRef.current) {
      syncChannelRef.current.send({
        type: 'broadcast',
        event: 'force-refresh',
      }).catch(e => console.error('Broadcast error:', e))
    }
  }, [])

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discountAmount = discount.type === 'percent'
    ? cartTotal * (discount.value / 100)
    : discount.type === 'fixed' ? discount.value : 0
  const grandTotal = Math.max(0, cartTotal - discountAmount)

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      if (next) {
        document.body.classList.add('dark-mode')
        document.body.classList.remove('light-mode')
        localStorage.setItem('app-theme', 'dark')
      } else {
        document.body.classList.add('light-mode')
        document.body.classList.remove('dark-mode')
        localStorage.setItem('app-theme', 'light')
      }
      return next
    })
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('app-theme')
    if (stored === 'dark') {
      setIsDark(true)
      document.body.classList.add('dark-mode')
      document.body.classList.remove('light-mode')
    }
  }, [])

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
      refreshTrigger, triggerRefresh,
      mobileComandaOpen, setMobileComandaOpen,
      deferredPrompt, setDeferredPrompt,
      sidebarMobileOpen, setSidebarMobileOpen,
      isDark, toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
