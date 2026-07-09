'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/infrastructure/supabase/orders/actions'
import { Clock, Play, CheckCircle2, AlertTriangle, Coffee, ShoppingBag, Truck } from 'lucide-react'

interface Props {
  initialOrders: any[]
}

export default function KitchenClient({ initialOrders }: Props) {
  const [pending, startTransition] = useTransition()

  // Calcular tiempo transcurrido en minutos
  const getElapsedMinutes = (dateString: string) => {
    const diffMs = new Date().getTime() - new Date(dateString).getTime()
    return Math.floor(diffMs / 60000)
  }

  const handleUpdateStatus = (orderId: string, newStatus: 'in_kitchen' | 'ready') => {
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in': return <Coffee className="h-5 w-5 text-blue-400" />
      case 'takeout': return <ShoppingBag className="h-5 w-5 text-orange-400" />
      case 'delivery': return <Truck className="h-5 w-5 text-purple-400" />
      default: return null
    }
  }

  const getTypeName = (order: any) => {
    if (order.order_type === 'dine_in') return (order.restaurant_tables as any)?.name || 'Mesa ?'
    if (order.order_type === 'takeout') return `Llevar: ${order.customer_name || 'Sin nombre'}`
    if (order.order_type === 'delivery') return `Delivery: ${order.customer_name || 'Sin nombre'}`
    return 'Desconocido'
  }

  if (initialOrders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <CheckCircle2 className="h-20 w-20 mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-gray-400">Cocina al día</h2>
        <p className="text-gray-500">No hay pedidos pendientes en este momento.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
      {initialOrders.map(order => {
        const elapsed = getElapsedMinutes(order.created_at)
        const isUrgent = elapsed >= 15
        const isWarning = elapsed >= 10 && !isUrgent

        // Determinar color del header basado en urgencia/estado
        let headerColor = 'bg-[#222]' // Pending / normal
        let accentColor = 'text-gray-300'
        
        if (order.status === 'in_kitchen') {
          headerColor = 'bg-blue-900/30 border-b-blue-500'
          accentColor = 'text-blue-400'
        }
        if (isWarning && order.status !== 'ready') {
          headerColor = 'bg-yellow-900/30 border-b-yellow-500'
          accentColor = 'text-yellow-500'
        }
        if (isUrgent && order.status !== 'ready') {
          headerColor = 'bg-red-900/30 border-b-red-500'
          accentColor = 'text-red-500'
        }

        return (
          <div key={order.id} className="flex flex-col rounded-xl overflow-hidden shadow-2xl" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            
            {/* Ticket Header */}
            <div className={`p-4 border-b-2 flex justify-between items-center ${headerColor} transition-colors`}>
              <div className="flex items-center gap-3">
                {getTypeIcon(order.order_type)}
                <div>
                  <h3 className="font-black text-lg text-white leading-tight">
                    {getTypeName(order)}
                  </h3>
                  <p className="font-mono text-xs text-gray-400">
                    #{order.id.split('-')[0]}
                  </p>
                </div>
              </div>
              
              <div className={`flex flex-col items-end ${accentColor}`}>
                <div className="flex items-center gap-1 font-mono font-bold text-lg">
                  {isUrgent && <AlertTriangle className="h-4 w-4 mr-1 animate-pulse" />}
                  <Clock className="h-4 w-4" />
                  {elapsed}m
                </div>
              </div>
            </div>

            {/* Notas del pedido completo */}
            {order.notes && (
               <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 text-sm font-medium border-b border-yellow-500/20">
                  <span className="uppercase text-xs font-bold mr-2 text-yellow-600">NOTA:</span>
                  {order.notes}
               </div>
            )}

            {/* Items */}
            <div className="flex-1 p-4 space-y-4 max-h-[400px] overflow-y-auto hide-scrollbar">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-[#333] last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded bg-[#333] text-white font-black flex items-center justify-center flex-shrink-0">
                    {item.quantity}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base leading-tight">
                      {(item.products as any)?.name}
                    </p>
                    
                    {/* Modificadores */}
                    {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.order_item_modifiers.map((mod: any) => (
                          <span key={mod.id} className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            + {(mod.product_modifiers as any)?.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notas del item */}
                    {item.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 bg-[#111] border-t border-[#333] flex gap-2">
              {order.status === 'pending' && (
                <button 
                  onClick={() => handleUpdateStatus(order.id, 'in_kitchen')}
                  disabled={pending}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Play className="h-5 w-5" />
                  Preparar
                </button>
              )}
              {(order.status === 'pending' || order.status === 'in_kitchen') && (
                <button 
                  onClick={() => handleUpdateStatus(order.id, 'ready')}
                  disabled={pending}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Listo
                </button>
              )}
            </div>
            
          </div>
        )
      })}
    </div>
  )
}
