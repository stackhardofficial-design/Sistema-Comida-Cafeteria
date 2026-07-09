'use client'

import { useState, useMemo, useTransition } from 'react'
import { createOrder } from '@/infrastructure/supabase/orders/actions'
import { 
  Coffee, ShoppingBag, Truck, Plus, Minus, Trash2, 
  Send, CreditCard, ChevronRight, AlertCircle, Loader2
} from 'lucide-react'
import PaymentModal from './payment-modal'

interface Props {
  categories: any[]
  products: any[]
  tables: any[]
  hasActiveCashSession: boolean
  cashSessionId?: string
  userId: string
  tenantId: string
}

export default function POSClient({ categories, products, tables, hasActiveCashSession }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout' | 'delivery'>('dine_in')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter(p => p.category_id === selectedCategory)
  }, [products, selectedCategory])

  // Cart operations
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { tempId: Math.random().toString(), product, quantity: 1, notes: '' }]
    })
  }

  const updateQuantity = (tempId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }))
  }

  const removeFromCart = (tempId: string) => {
    setCart(prev => prev.filter(item => item.tempId !== tempId))
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  const total = subtotal // Podemos agregar taxes luego

  // Submit Order
  const handleSendToKitchen = () => {
    if (cart.length === 0) return
    if (orderType === 'dine_in' && !selectedTableId) {
      setError('Debes seleccionar una mesa para pedidos en local.')
      return
    }

    setError('')
    startTransition(async () => {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        notes: item.notes
      }))

      const res = await createOrder(items, {
        orderType,
        tableId: orderType === 'dine_in' ? selectedTableId : undefined,
        customerName: orderType !== 'dine_in' ? customerName : undefined
      })

      if (res.error) {
        setError(res.error)
      } else {
        // Reset cart on success
        setCart([])
        setSelectedTableId('')
        setCustomerName('')
        alert('✅ Pedido enviado a cocina')
      }
    })
  }

  const handlePaymentSuccess = () => {
    setCart([])
    setSelectedTableId('')
    setCustomerName('')
    setIsPaymentModalOpen(false)
    alert('✅ Pago procesado exitosamente')
  }

  return (
    <div className="flex w-full h-full">
      {/* Left Pane - Menu */}
      <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        
        {/* Categories Bar */}
        <div className="flex-shrink-0 p-4 overflow-x-auto hide-scrollbar" style={{ background: 'var(--bg-surface)' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                selectedCategory === null 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'bg-transparent hover:bg-white/5'
              }`}
              style={selectedCategory === null ? {} : { color: 'var(--text-secondary)' }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                    : 'bg-transparent hover:bg-white/5'
                }`}
                style={selectedCategory === cat.id ? {} : { color: 'var(--text-secondary)' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="card text-left p-0 overflow-hidden hover:-translate-y-1 transition-transform group"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'var(--bg-elevated)' }}>
                  🍽️
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm leading-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                    {product.name}
                  </h4>
                  <p className="font-bold text-orange-500">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Pane - Cart */}
      <div className="w-[380px] flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-surface)' }}>
        
        {/* Order Type Selector */}
        <div className="p-4 flex gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'dine_in', label: 'En Mesa', icon: Coffee },
            { id: 'takeout', label: 'Llevar', icon: ShoppingBag },
            { id: 'delivery', label: 'Delivery', icon: Truck },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setOrderType(type.id as any)}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                orderType === type.id 
                  ? 'border-orange-500 bg-orange-500/10 text-orange-500' 
                  : 'border-transparent text-gray-400 hover:bg-white/5'
              }`}
            >
              <type.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Order Details Form */}
        <div className="p-4 space-y-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {orderType === 'dine_in' ? (
            <div className="form-group mb-0">
              <label className="form-label text-xs">Mesa Asignada *</label>
              <select 
                value={selectedTableId} 
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="input-field py-2 text-sm"
              >
                <option value="">Seleccionar mesa...</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id} disabled={t.status !== 'free'}>
                    {t.name} {t.status !== 'free' ? `(${t.status})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group mb-0">
              <label className="form-label text-xs">Nombre del Cliente</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Carlos G." 
                className="input-field py-2 text-sm" 
              />
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <ShoppingBag className="h-12 w-12 mb-3" />
              <p>El pedido está vacío</p>
              <p className="text-xs mt-1">Selecciona productos del menú</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.tempId} className="flex gap-3">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.product.name}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2" style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '2px' }}>
                      <button onClick={() => updateQuantity(item.tempId, -1)} className="p-1 hover:bg-white/10 rounded-md">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.tempId, 1)} className="p-1 hover:bg-white/10 rounded-md">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.tempId)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md ml-auto">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          {error && (
            <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-gray-400">Total:</span>
            <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleSendToKitchen}
              disabled={cart.length === 0 || pending}
              className="btn btn-secondary py-4 flex flex-col items-center justify-center gap-1 h-auto"
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin-custom" /> : <Send className="h-5 w-5" />}
              <span className="text-xs uppercase tracking-wider">A Cocina</span>
            </button>

            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0 || !hasActiveCashSession}
              title={!hasActiveCashSession ? 'Debes abrir la caja primero' : 'Cobrar pedido'}
              className="btn btn-primary py-4 flex flex-col items-center justify-center gap-1 h-auto relative overflow-hidden group"
            >
               {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <CreditCard className="h-5 w-5" />
              <span className="text-xs uppercase tracking-wider">Cobrar</span>
            </button>
          </div>

          {!hasActiveCashSession && (
            <p className="text-center text-xs text-red-400 mt-3 font-medium">
              ⚠️ La caja está cerrada. Abre la caja en Admin {'>'} Caja para poder cobrar.
            </p>
          )}
        </div>

      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        total={total}
        cart={cart}
        orderType={orderType}
        selectedTableId={selectedTableId}
        customerName={customerName}
        cashSessionId={cashSessionId}
      />
    </div>
  )
}
