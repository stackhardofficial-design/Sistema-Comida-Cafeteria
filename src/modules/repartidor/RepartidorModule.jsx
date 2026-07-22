import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetDeliveryOrders, dbUpdateOrder, sb, fmtMoney } from '../../lib/supabase'

export default function RepartidorModule() {
  const { tenantId } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await dbGetDeliveryOrders(tenantId)
      // Solo nos interesan los que están listos para entregar (en tránsito)
      setOrders(data.filter(o => o.status === 'in_transit'))
    } catch (e) {
      console.error('Error al cargar pedidos del repartidor:', e)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Suscripción en tiempo real
  useEffect(() => {
    if (!tenantId) return
    const channel = sb.channel('realtime-repartidor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => loadOrders()
      )
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [tenantId, loadOrders])

  async function markAsDelivered(orderId) {
    try {
      await dbUpdateOrder(orderId, { status: 'delivered' })
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (e) {
      alert('Error al actualizar estado: ' + e.message)
    }
  }

  function getMapsLink(order) {
    const addr = order.delivery_addresses
    if (!addr) return null
    // La URL o descripción suele guardarse en 'reference' (formato: "desc | url" o solo la url)
    const ref = addr.reference || ''
    const parts = ref.split(' | ')
    const possibleUrl = parts.length > 1 ? parts[1] : parts[0]
    
    if (possibleUrl && (possibleUrl.includes('http') || possibleUrl.includes('maps'))) {
      return possibleUrl.trim()
    }
    // Si no hay URL directa, hacemos una búsqueda en Google Maps por la dirección
    if (addr.street_address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.street_address)}`
    }
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', overflowY: 'auto' }}>
      {/* Header Fijo */}
      <div style={{ 
        background: '#fff', 
        padding: '16px 20px', 
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
          🛵 Mis Entregas
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Pedidos listos para ser llevados
        </p>
      </div>

      {/* Lista de Pedidos */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Cargando entregas...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            background: 'white', 
            borderRadius: '12px',
            border: '1px dashed #cbd5e1'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🙌</span>
            <h3 style={{ margin: 0, color: '#334155', fontSize: '18px' }}>¡Todo al día!</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>No hay pedidos pendientes de entrega en este momento.</p>
          </div>
        ) : (
          orders.map(order => {
            const addr = order.delivery_addresses || {}
            const phone = order.customer_phone || addr.customer_phone || ''
            const name = order.customer_name || addr.customer_name || 'Cliente'
            const addressText = addr.street_address || order.notes || 'Dirección no especificada'
            
            // Descripción extra si existe en reference
            const refText = addr.reference ? addr.reference.split(' | ')[0] : ''
            const mapsLink = getMapsLink(order)

            return (
              <div key={order.id} style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Info principal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>
                      {name}
                    </h3>
                    <div style={{ color: '#475569', fontSize: '15px', fontWeight: '500', lineHeight: '1.4' }}>
                      📍 {addressText}
                    </div>
                    {refText && (
                      <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                        Nota: {refText}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    background: '#f1f5f9', 
                    padding: '6px 10px', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#334155'
                  }}>
                    #{order.id.slice(-5).toUpperCase()}
                  </div>
                </div>

                {/* Total a cobrar si corresponde */}
                <div style={{ 
                  background: '#fefce8', 
                  border: '1px solid #fef08a', 
                  padding: '12px', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#854d0e', fontSize: '14px', fontWeight: '600' }}>Total del pedido:</span>
                  <span style={{ color: '#713f12', fontSize: '18px', fontWeight: '800' }}>{fmtMoney(order.total_amount)}</span>
                </div>

                {/* Acciones del Repartidor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {mapsLink ? (
                    <a 
                      href={mapsLink} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        textDecoration: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px'
                      }}
                    >
                      🗺️ Ver Mapa
                    </a>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f1f5f9', color: '#94a3b8', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600'
                    }}>
                      Sin Mapa
                    </div>
                  )}

                  {phone ? (
                    <a 
                      href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#f0fdf4',
                        color: '#16a34a',
                        textDecoration: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '15px'
                      }}
                    >
                      💬 Contactar
                    </a>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f1f5f9', color: '#94a3b8', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600'
                    }}>
                      Sin Teléfono
                    </div>
                  )}
                </div>

                {/* Botón Principal */}
                <button 
                  onClick={() => markAsDelivered(order.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)',
                    marginTop: '8px',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ✅ Marcar como Entregado
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
