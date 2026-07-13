import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenantId, setTenantId] = useState(null)
  const [currentModule, setCurrentModule] = useState('mesas')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState({ type: 'none', value: 0 })
  const [currentContext, setCurrentContext] = useState(null)
  // { type: 'mesa'|'mostrador'|'delivery', tableDbId, tableName, orderId }

  const clearCart = useCallback(() => {
    setCart([])
    setDiscount({ type: 'none', value: 0 })
    setCurrentContext(null)
  }, [])

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discountAmount = discount.type === 'percent'
    ? cartTotal * (discount.value / 100)
    : discount.type === 'fixed' ? discount.value : 0
  const grandTotal = Math.max(0, cartTotal - discountAmount)

  return (
    <AppContext.Provider value={{
      user, setUser,
      tenantId, setTenantId,
      currentModule, setCurrentModule,
      cart, setCart,
      discount, setDiscount,
      currentContext, setCurrentContext,
      clearCart,
      cartTotal, discountAmount, grandTotal
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
