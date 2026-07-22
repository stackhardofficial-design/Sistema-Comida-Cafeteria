import { Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock } from 'lucide-react';
import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOrders, dbUpdateKitchenStatus, sb } from '../../lib/supabase'

export default function CocinaModule() {
  const { tenantId } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      // Cargamos solo las órdenes abiertas (que no han sido pagadas/cerradas)
      const data = await dbGetOrders(tenantId, { status: 'open' })
      // Filtramos las que aún no están listas (pending o nulo)
      const pendingOrders = data.filter(o => !o.kitchen_status || o.kitchen_status === 'pending')
      // Ordenamos de más antiguas a más nuevas para que Cocina haga primero lo que entró primero
      pendingOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      setOrders(pendingOrders)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    const ch = sb.channel('realtime-cocina')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, loadData)
      .subscribe()
    return () => sb.removeChannel(ch)
  }, [tenantId])

  async function handleMarkReady(orderId) {
    try {
      await dbUpdateKitchenStatus(orderId, 'ready')
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  function getOrderTypeInfo(o) {
    if (o.order_type === 'delivery') return { label: 'DELIVERY', color: '#ef4444', icon: <Bike size={16} /> }
    if (o.order_type === 'dine_in' && o.table_db_id) return { label: `MESA: ${o.restaurant_tables?.name || '?' }`, color: '#3b82f6', icon: <Utensils size={16} /> }
    return { label: 'MOSTRADOR', color: '#f59e0b', icon: <ShoppingBag size={16} /> }
  }

  function formatTime(isoStr) {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function getWaitTimeMinutes(isoStr) {
    if (!isoStr) return 0
    const diffMs = new Date() - new Date(isoStr)
    return Math.floor(diffMs / 60000)
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}><ChefHat size={28} style={{marginRight:10}} /> Pantalla de Cocina (KDS)</h1>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          {orders.length} pedidos pendientes
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Cargando pedidos...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}><CheckCircle size={48} color="var(--green)" /></span>
          <h2 style={{ margin: 0 }}>¡No hay pedidos pendientes!</h2>
          <p>La cocina está al día.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', overflowY: 'auto', alignContent: 'start' }}>
          {orders.map(o => {
            const typeInfo = getOrderTypeInfo(o)
            const waitTime = getWaitTimeMinutes(o.created_at)
            let waitColor = 'var(--text-secondary)'
            if (waitTime >= 15) waitColor = '#ef4444' // red if > 15m
            else if (waitTime >= 10) waitColor = '#f59e0b' // yellow if > 10m

            return (
              <div key={o.id} style={{ 
                background: 'var(--surface)', 
                border: `2px solid ${typeInfo.color}`, 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                {/* Cabecera Tarjeta */}
                <div style={{ background: typeInfo.color, color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{typeInfo.icon}</span> {typeInfo.label}
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '6px' }}>
                    {formatTime(o.created_at)}
                  </div>
                </div>

                {/* Cliente Info (Opcional) */}
                {(o.customer_name || o.notes) && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: '13px' }}>
                    {o.customer_name && <div style={{ fontWeight: '600' }}><User size={14} style={{marginRight:4}} /> {o.customer_name}</div>}
                    {o.notes && <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}><FileText size={14} style={{marginRight:4}} /> {o.notes}</div>}
                  </div>
                )}

                {/* Lista de Items */}
                <div style={{ padding: '16px', flex: 1, overflowY: 'auto', maxHeight: '250px' }}>
                  {o.order_items?.length > 0 ? (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: '12px' }}>
                      {o.order_items.map(item => (
                        <li key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '15px', fontWeight: '600' }}>
                          <span style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '6px', color: 'var(--accent)' }}>
                            {item.quantity}x
                          </span>
                          <span>{item.products?.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Sin items registrados</div>
                  )}
                </div>

                {/* Pie Tarjeta */}
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: waitColor }}>
                    <Clock size={14} style={{marginRight:4}} /> Hace {waitTime} min
                  </div>
                  <button onClick={() => handleMarkReady(o.id)} style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <><Check size={16} style={{marginRight:4}} /> LISTO</>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
