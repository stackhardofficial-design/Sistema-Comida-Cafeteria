import {   Grid, MonitorSmartphone, ChefHat, Package, Bike, TrendingUp, MonitorCheck, Users, User, History, ShieldAlert, ShoppingBag, FileText, ChevronDown, ChevronUp, Search, ArrowLeft, Minus, Plus, Send, Banknote, Check, CreditCard, Trash2, X, CheckCircle, Clock, ShoppingCart, Utensils, Box, Lock , TrendingDown , ArrowDown } from 'lucide-react';
import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetActivityLogs, dbGetCustomers, fmtDate } from '../../lib/supabase'

const ACTION_LABELS = {
  CLOSE_SALE: { label: '💳 Venta Cerrada', color: '#10b981', bg: '#d1fae5' },
  OPEN_SESSION: { label: <><Unlock size={16} style={{marginRight:6}}/> Caja Abierta</>, color: '#3b82f6', bg: '#dbeafe' },
  CLOSE_SESSION: { label: '🔒 Caja Cerrada', color: '#6366f1', bg: '#ede9fe' },
  LOGIN: { label: '🔑 Inicio de Sesión', color: '#f59e0b', bg: '#fef3c7' },
  CREATE_ORDER: { label: '📋 Pedido Creado', color: '#8b5cf6', bg: '#ede9fe' },
  CANCEL_ORDER: { label: <><X size={16} style={{marginRight:6}}/> Pedido Cancelado</>, color: '#ef4444', bg: '#fee2e2' },
  EDIT_PRODUCT: { label: <><PenSquare size={16} style={{marginRight:6}}/> Producto Editado</>, color: 'var(--text-muted)', bg: '#f1f5f9' },
  DELETE_PRODUCT: { label: <><Trash2 size={16} style={{marginRight:6}}/> Producto Eliminado</>, color: '#ef4444', bg: '#fee2e2' },
}

function ActionBadge({ action }) {
  const info = ACTION_LABELS[action] || { label: action, color: 'var(--text-muted)', bg: '#f1f5f9' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: info.bg,
      color: info.color,
      whiteSpace: 'nowrap'
    }}>
      {info.label}
    </span>
  )
}

function DetailsExpand({ details }) {
  const [open, setOpen] = useState(false)
  if (!details || Object.keys(details).length === 0) return <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>

  const labelMap = {
    order_id: 'Orden', context: 'Contexto', total: 'Total', total_paid: 'Cobrado',
    methods: 'Métodos', items_count: 'Artículos', opening_amount: 'Saldo inicial',
    closing_amount: 'Saldo cierre', expected_amount: 'Esperado', difference: 'Diferencia',
    total_payments: 'Total cobrado'
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', color: 'var(--accent)', padding: 0, textDecoration: 'underline'
        }}
      >
        {open ? 'Ocultar ▲' : 'Ver detalle ▼'}
      </button>
      {open && (
        <div style={{
          marginTop: '8px', padding: '12px', borderRadius: '8px',
          background: 'var(--bg, #f8fafc)', border: '1px solid var(--border)',
          fontSize: '12px', lineHeight: '1.8'
        }}>
          {Object.entries(details).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>{labelMap[key] || key}:</span>
              <span style={{ fontWeight: '500' }}>
                {Array.isArray(val) ? val.join(', ') : String(val)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistorialModule() {
  const { tenantId } = useApp()
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)

  // Filters
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  async function loadLogs() {
    if (!tenantId) return
    setLoading(true)
    try {
      const filters = {}
      if (filterUser) filters.userId = filterUser
      if (filterAction) filters.action = filterAction
      if (filterFrom) filters.from = new Date(filterFrom).toISOString()
      if (filterTo) {
        const d = new Date(filterTo); d.setHours(23, 59, 59)
        filters.to = d.toISOString()
      }
      const data = await dbGetActivityLogs(tenantId, filters)
      setLogs(data)
    } catch (e) {
      if (e.message?.includes('activity_logs')) {
        setTableExists(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tenantId) return
    dbGetCustomers(tenantId).then(setUsers).catch(() => {})
    loadLogs()
  }, [tenantId])

  const uniqueUsers = [...new Map(logs.map(l => [l.user_id || l.user_name, { id: l.user_id, name: l.user_name }])).values()]
  const uniqueActions = [...new Set(logs.map(l => l.action))]

  const totalVentas = logs.filter(l => l.action === 'CLOSE_SALE').length
  const totalAperturas = logs.filter(l => l.action === 'OPEN_SESSION').length
  const totalCierres = logs.filter(l => l.action === 'CLOSE_SESSION').length

  if (!tableExists) {
    return (
      <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '12px' }}>Tabla de Historial no encontrada</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Para activar el historial, ejecuta el siguiente SQL en el editor de Supabase:<br/>
            <a href="https://supabase.com/dashboard/project/mylukzjucxgjjmvbteuf/sql/new" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
              Abrir SQL Editor →
            </a>
          </p>
          <pre style={{
            textAlign: 'left', background: '#1e293b', color: 'var(--text-muted)', padding: '16px',
            borderRadius: '8px', fontSize: '11px', overflow: 'auto', maxHeight: '300px'
          }}>{`CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant 
    ON public.activity_logs(tenant_id, created_at DESC);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow ALL for tenant" ON public.activity_logs FOR ALL USING (true);`}</pre>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📜 Historial de Actividades</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Registro completo de movimientos por empleado
          </p>
        </div>
        <button
          onClick={loadLogs}
          style={{
            padding: '10px 20px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Registros', value: logs.length, color: '#6366f1', icon: '📋' },
          { label: 'Ventas Cerradas', value: totalVentas, color: '#10b981', icon: '💳' },
          { label: 'Aperturas de Caja', value: totalAperturas, color: '#3b82f6', icon: '' },
          { label: 'Cierres de Caja', value: totalCierres, color: '#8b5cf6', icon: '🔒' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '14px 16px',
            borderLeft: `4px solid ${stat.color}`
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '16px',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px'
      }}>
        <select
          value={filterUser}
          onChange={e => setFilterUser(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
        >
          <option value=""><User size={14} style={{marginRight:4}} /> Todos los empleados</option>
          {uniqueUsers.map(u => (
            <option key={u.id || u.name} value={u.id || ''}>{u.name}</option>
          ))}
        </select>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
        >
          <option value="">📌 Todas las acciones</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
          placeholder="Desde"
        />
        <input
          type="date"
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}
          placeholder="Hasta"
        />

        <button
          onClick={loadLogs}
          style={{
            padding: '8px 18px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
          }}
        >
          Filtrar
        </button>
        {(filterUser || filterAction || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterUser(''); setFilterAction(''); setFilterFrom(''); setFilterTo(''); }}
            style={{
              padding: '8px 14px', background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '15px' }}>
            Cargando historial...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No hay registros con los filtros seleccionados.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                {['Fecha / Hora', 'Empleado', 'Acción', 'Entidad', 'Detalles'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg, #f8fafc)',
                    transition: 'background 0.15s'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text)' }}>
                      {new Date(log.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <div>{new Date(log.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'var(--accent)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                      }}>
                        {(log.user_name || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '500' }}>{log.user_name || 'Sistema'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <ActionBadge action={log.action} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {log.entity_type.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '280px' }}>
                    <DetailsExpand details={log.details} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {logs.length > 0 && (
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Mostrando {logs.length} registros
        </div>
      )}
    </div>
  )
}
