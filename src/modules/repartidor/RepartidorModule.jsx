import { Bike, MonitorCheck, MessageSquare, MonitorSmartphone, Check, Grid, Users, TrendingUp, X, Save, Banknote, FileText, Plus, PenSquare, Trash2, ShieldAlert, History, TrendingDown, Lock, Unlock, Package, ArrowDown, ArrowLeft, ShoppingBag, Send, Minus, Clock, ChevronDown, ChevronRight, MapPin, Map, CheckCircle, Phone, MessageCircle } from 'lucide-react';
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

  
  const getRepartidorStatus = (o) => {
    if (o.status === 'in_transit') return { label: 'EN CAMINO', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }
    if (o.kitchen_status === 'ready') return { label: 'LISTO PARA RETIRAR', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
    if (o.kitchen_status === 'in_progress') return { label: 'COCINANDO', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }
    return { label: 'EN COLA', color: 'var(--text-secondary)', bg: 'var(--surface-2)' }
  }

  return (

    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '4px' }}>
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
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '5px 9px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                color: 'var(--text-secondary)'
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
                color: 'var(--text-primary)'
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
            color: 'var(--text-primary)',
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
      setOrders(data.filter(o => o.status === 'open' || o.status === 'in_transit'))
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

    return { phone, name, addressText, desc, mapsUrl: rawUrl.trim() }
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', overflowY: 'auto' }}>
      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .deliver-btn:active { transform: scale(0.97); }
        .deliver-card { transition: box-shadow 0.2s; }
        .deliver-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.25) !important; }
        .whatsapp-btn:hover { background: #15803d !important; }
        .call-btn:hover { background: #1d4ed8 !important; }
      `}</style>

      {/* Header Premium */}
      <div style={{
        background: 'var(--surface)',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              🛵 Repartidor
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {orders.length > 0 && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: 'var(--accent)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fb923c', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
                  {orders.length} pendiente{orders.length !== 1 ? 's' : ''}
                </span>
              )}
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{timeStr}</span>
            </div>
          </div>
          <button
            onClick={loadOrders}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: '600' }}>Cargando entregas...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface-2)',
            borderRadius: '16px',
            border: '1px dashed var(--border)'
          }}>
            <span style={{ fontSize: '56px', display: 'block', marginBottom: '16px' }}>🙌</span>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700' }}>¡Todo al día!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No hay pedidos pendientes de entrega.</p>
          </div>
        ) : (
          orders.map(order => {
            const { phone, name, addressText, desc, mapsUrl } = getOrderInfo(order)
            const isBeingDelivered = delivering === order.id
            const orderTime = new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
            const waLink = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : null

            return (
              <div
                key={order.id}
                className="deliver-card"
                style={{
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: '16px 18px',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
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
                      <div style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '16px' }}>{name}</div>
                      {phone && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{phone}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Pedido</div>
                    <div style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '800' }}>#{order.id.slice(-5).toUpperCase()}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{orderTime}</div>
                      <div style={{ color: getRepartidorStatus(order).color, background: getRepartidorStatus(order).bg, padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginTop: '6px', textAlign: 'center' }}>
                        {getRepartidorStatus(order).label}
                      </div>
                  </div>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Dirección */}
                  {addressText && (
                    <div style={{
                      background: 'var(--surface-2)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start'
                    }}>
                      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}><MapPin size={16} style={{marginRight:6}}/></span>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px', lineHeight: '1.4' }}>{addressText}</div>
                        {desc && <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '3px' }}>{desc}</div>}
                      </div>
                    </div>
                  )}

                  {/* Mapa Embebido */}
                  <MapPreview address={addressText} mapsUrl={mapsUrl} />

                  {/* Total */}
                  <div style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}><Banknote size={16} style={{marginRight:6}}/> Total a cobrar</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '800' }}>{fmtMoney(order.total_amount)}</span>
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
                          color: 'var(--text-primary)',
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
                          color: 'var(--text-primary)',
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
                      background: isBeingDelivered ? 'var(--surface-2)' : (order.status === 'open' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),
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
                    {isBeingDelivered ? '⏳ Confirmando...' : 'Marcar como Entregado'}
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
