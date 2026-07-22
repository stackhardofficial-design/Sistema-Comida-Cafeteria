import { Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetDeliveryOrders, dbUpdateOrder, sb, fmtMoney } from '../../lib/supabase'

function MapPreview({ address, mapsUrl }) {
  const [expanded, setExpanded] = useState(false)

  // Google Maps iframe embed - no API key needed
  const embedQuery = mapsUrl && (mapsUrl.includes('http') || mapsUrl.includes('maps'))
    ? null  // si hay un link directo de google maps, extraemos coordenadas
    : address

  // Usamos el embed de Google Maps con la dirección o URL directa
  const iframeSrc = mapsUrl && mapsUrl.includes('goo.gl/maps')
    ? mapsUrl.replace('goo.gl/maps', 'www.google.com/maps')
    : mapsUrl && mapsUrl.includes('maps.app.goo.gl')
      ? null  // link corto de maps, no se puede embeber directo
      : address
        ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=es&z=15`
        : null

  const openInMaps = () => {
    const url = mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    window.open(url, '_blank')
  }

  if (!address && !mapsUrl) return null

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '4px' }}>
      {iframeSrc ? (
        <div style={{ position: 'relative' }}>
          <iframe
            src={iframeSrc}
            width="100%"
            height={expanded ? '280px' : '160px'}
            frameBorder="0"
            style={{ display: 'block', transition: 'height 0.3s ease' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa de entrega"
          />
          {/* Barra de acciones sobre el mapa */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '6px'
          }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                color: '#475569'
              }}
            >
              {expanded ? '⊖' : '⊕'}
            </button>
            <button
              onClick={openInMaps}
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                color: 'white'
              }}
            >
              ↗ Abrir
            </button>
          </div>
        </div>
      ) : (
        /* Fallback: si el link es un shortlink de maps que no se puede embeber */
        <button
          onClick={openInMaps}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '14px'
          }}
        >
          <><MonitorCheck size={16} style={{marginRight:6}}/> Ver Ubicación en Google Maps</>
        </button>
      )}
    </div>
  )
}

export default function RepartidorModule() {
  const { tenantId } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [delivering, setDelivering] = useState(null) // orderId en proceso

  const loadOrders = useCallback(async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      const data = await dbGetDeliveryOrders(tenantId)
      setOrders(data.filter(o => o.status === 'in_transit'))
    } catch (e) {
      console.error('Error al cargar pedidos del repartidor:', e)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadOrders() }, [loadOrders])

  useEffect(() => {
    if (!tenantId) return
    const channel = sb.channel('realtime-repartidor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, loadOrders)
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [tenantId, loadOrders])

  async function markAsDelivered(orderId) {
    setDelivering(orderId)
    try {
      await dbUpdateOrder(orderId, { status: 'delivered' })
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (e) {
      alert('Error al actualizar estado: ' + e.message)
    } finally {
      setDelivering(null)
    }
  }

  function getOrderInfo(order) {
    const addr = order.delivery_addresses || {}
    const phone = order.customer_phone || addr.customer_phone || ''
    const name = order.customer_name || addr.customer_name || 'Cliente'
    const addressText = addr.street_address || ''
    const ref = addr.reference || ''
    
    // El reference puede ser "Descripcion | https://maps..." 
    const parts = ref.split(' | ')
    const desc = parts.length > 1 ? parts[0] : (ref.includes('http') ? '' : ref)
    const rawUrl = parts.length > 1 ? parts[1] : (ref.includes('http') ? ref : '')

                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px', height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f97316, #fb923c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: '800', color: 'white', flexShrink: 0
                    }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>{name}</div>
                      {phone && (
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{phone}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Pedido</div>
                    <div style={{ color: '#f97316', fontSize: '14px', fontWeight: '800' }}>#{order.id.slice(-5).toUpperCase()}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{orderTime}</div>
                  </div>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Dirección */}
                  {addressText && (
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>📍</span>
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px', lineHeight: '1.4' }}>{addressText}</div>
                        {desc && <div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>{desc}</div>}
                      </div>
                    </div>
                  )}

                  {/* Mapa Embebido */}
                  <MapPreview address={addressText} mapsUrl={mapsUrl} />

                  {/* Total */}
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600' }}>💰 Total a cobrar</span>
                    <span style={{ color: '#fde68a', fontSize: '20px', fontWeight: '800' }}>{fmtMoney(order.total_amount)}</span>
                  </div>

                  {/* Botones de Acción */}
                  <div style={{ display: 'grid', gridTemplateColumns: waLink ? '1fr 1fr' : '1fr', gap: '10px' }}>
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-btn"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                          background: '#16a34a',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '13px',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '14px',
                          transition: 'background 0.15s'
                        }}
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {phone && (
                      <a
                        href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                        className="call-btn"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                          background: '#2563eb',
                          color: 'white',
                          textDecoration: 'none',
                          padding: '13px',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '14px',
                          transition: 'background 0.15s'
                        }}
                      >
                        📞 Llamar
                      </a>
                    )}
                  </div>

                  {/* Botón Principal Entregar */}
                  <button
                    className="deliver-btn"
                    onClick={() => markAsDelivered(order.id)}
                    disabled={isBeingDelivered}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: isBeingDelivered
                        ? 'rgba(255,255,255,0.1)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: isBeingDelivered ? '#64748b' : 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '800',
                      cursor: isBeingDelivered ? 'not-allowed' : 'pointer',
                      boxShadow: isBeingDelivered ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                      transition: 'all 0.2s',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {isBeingDelivered ? '⏳ Confirmando...' : '✅ Marcar como Entregado'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
