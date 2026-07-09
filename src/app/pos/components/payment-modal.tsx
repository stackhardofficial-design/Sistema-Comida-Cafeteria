'use client'

import { useState, useTransition } from 'react'
import { processPayment } from '@/infrastructure/supabase/payments/actions'
import { createOrder } from '@/infrastructure/supabase/orders/actions'
import { CreditCard, Banknote, Smartphone, X, Loader2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  total: number
  cart: any[]
  orderType: 'dine_in' | 'takeout' | 'delivery'
  selectedTableId?: string
  customerName?: string
  cashSessionId?: string
}

export default function PaymentModal({
  isOpen, onClose, onSuccess, total, cart, 
  orderType, selectedTableId, customerName, cashSessionId
}: Props) {
  const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [receivedAmount, setReceivedAmount] = useState<string>(total.toString())
  
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (!isOpen) return null

  const change = Math.max(0, parseFloat(receivedAmount || '0') - total)

  const handlePay = () => {
    if (!cashSessionId) {
      setError('No hay turno de caja abierto.')
      return
    }

    const rAmount = parseFloat(receivedAmount || '0')
    if (rAmount < total && method === 'cash') {
      setError('El monto recibido es menor al total.')
      return
    }

    setError('')
    startTransition(async () => {
      // 1. Crear la orden si no existe (todo viene del POS actual)
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        notes: item.notes
      }))

      const orderRes = await createOrder(items, {
        orderType,
        tableId: orderType === 'dine_in' ? selectedTableId : undefined,
        customerName: orderType !== 'dine_in' ? customerName : undefined
      })

      if (orderRes.error || !orderRes.data) {
        setError(orderRes.error || 'Error al crear la orden')
        return
      }

      const orderId = orderRes.data

      // 2. Procesar el pago
      const paymentRes = await processPayment(
        orderId,
        method,
        total, // El total real de la orden
        0, // Sin propina por ahora
        change,
        undefined, // referenceCode
        cashSessionId
      )

      if (paymentRes.error) {
        setError(paymentRes.error)
      } else {
        onSuccess()
      }
    })
  }

  // Pre-fill amounts for cash
  const quickAmounts = [
    total,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total)

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" /> Cobrar Pedido
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-6">
          {/* Total */}
          <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>TOTAL A COBRAR</p>
            <p className="text-4xl font-black text-orange-500">${total.toFixed(2)}</p>
          </div>

          {/* Métodos de pago */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => { setMethod('cash'); setReceivedAmount(total.toString()) }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'cash' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[var(--border-subtle)] text-gray-400'
              }`}
            >
              <Banknote className="h-6 w-6" />
              <span className="text-xs font-bold uppercase">Efectivo</span>
            </button>
            <button
              onClick={() => { setMethod('card'); setReceivedAmount(total.toString()) }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'card' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[var(--border-subtle)] text-gray-400'
              }`}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-xs font-bold uppercase">Tarjeta</span>
            </button>
            <button
              onClick={() => { setMethod('transfer'); setReceivedAmount(total.toString()) }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'transfer' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-[var(--border-subtle)] text-gray-400'
              }`}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-xs font-bold uppercase">Transfer</span>
            </button>
          </div>

          {/* Recibido y Cambio (Solo efectivo) */}
          {method === 'cash' && (
            <div className="space-y-4 animate-slide-up">
              <div className="form-group">
                <label className="form-label text-xs">Monto Recibido</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="input-field pl-7 text-xl font-bold"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setReceivedAmount(amt.toString())}
                      className="flex-1 py-1 px-2 rounded-md border text-xs font-bold"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Cambio:</span>
                <span className={`text-xl font-bold ${change > 0 ? 'text-green-500' : ''}`} style={{ color: change === 0 ? 'var(--text-muted)' : undefined }}>
                  ${change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {error && <div className="alert alert-error text-xs"><span>{error}</span></div>}

          <button
            onClick={handlePay}
            disabled={pending || (method === 'cash' && parseFloat(receivedAmount || '0') < total)}
            className="btn btn-primary btn-lg w-full"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin-custom" /> : null}
            {pending ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
