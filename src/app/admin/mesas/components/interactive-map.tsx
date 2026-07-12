'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateTableDetails,
  transferTableOrder,
  deleteTable,
  updateTablePositions,
} from '@/infrastructure/supabase/tables/actions'
import {
  Users, X, Edit2, Trash2, ArrowRightLeft,
  ShoppingCart, Coffee, Clock, Loader2, Settings
} from 'lucide-react'

interface Table {
  id: string
  name: string
  capacity: number
  status: 'free' | 'occupied' | 'reserved' | 'billing'
  zone_id: string | null
  pos_x: number
  pos_y: number
  shape: string
  color: string | null
  current_order_id: string | null
}

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  products: { name: string } | null
}

interface ActiveOrder {
  id: string
  table_db_id: string
  total_amount: number
  created_at: string
  order_items: OrderItem[]
}

interface Props {
  zoneId: string
  initialTables: Table[]
  activeOrders: ActiveOrder[]
  allTables: Table[]
  zones: Array<{ id: string; name: string }>
}

const STATUS_CONFIG = {
  free:     { label: 'Libre',      bg: 'rgba(34,197,94,0.12)',  border: '#22c55e', text: '#22c55e',  dot: '#22c55e' },
  occupied: { label: 'Ocupada',    bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', text: '#ef4444',  dot: '#ef4444' },
  reserved: { label: 'Reservada',  bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#f59e0b',  dot: '#f59e0b' },
  billing:  { label: 'Por cobrar', bg: 'rgba(59,130,246,0.12)', border: '#3b82f6', text: '#3b82f6',  dot: '#3b82f6' },
}

function timeAgo(isoDate: string) {
  const mins = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function InteractiveMap({ zoneId, initialTables, activeOrders, allTables, zones }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Table | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState(4)
  const [editShape, setEditShape] = useState('square')
  const [editZoneId, setEditZoneId] = useState('')

  const tables = initialTables
  const order = selected ? activeOrders.find(o => o.table_db_id === selected.id) : null
  const freeTables = allTables.filter(t => t.status === 'free' && t.id !== selected?.id)

  function openTable(table: Table) {
    setSelected(table)
    setIsEditing(false)
    setTransferTarget('')
  }

  function startEdit() {
    if (!selected) return
    setEditName(selected.name)
    setEditCapacity(selected.capacity)
    setEditShape(selected.shape || 'square')
    setEditZoneId(selected.zone_id || zoneId)
    setIsEditing(true)
  }

  function saveEdit() {
    if (!selected) return
    startTransition(async () => {
      const res = await updateTableDetails(selected.id, {
        name: editName, capacity: editCapacity,
        shape: editShape, zone_id: editZoneId || null,
      })
      if (res.error) return alert(res.error)
      setIsEditing(false)
      setSelected(null)
      router.refresh()
    })
  }

  function changeStatus(status: Table['status']) {
    if (!selected) return
    startTransition(async () => {
      await updateTableDetails(selected.id, { status })
      setSelected(null)
      router.refresh()
    })
  }

  function handleTransfer() {
    if (!selected || !transferTarget) return
    startTransition(async () => {
      const res = await transferTableOrder(selected.id, transferTarget)
      if (res.error) return alert(res.error)
      setSelected(null)
      setTransferTarget('')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!selected) return
    if (!confirm(`¿Eliminar "${selected.name}"?`)) return
    startTransition(async () => {
      await deleteTable(selected.id)
      setSelected(null)
      router.refresh()
    })
  }

  function handleRelease() {
    if (!selected) return
    startTransition(async () => {
      await updateTableDetails(selected.id, { status: 'free', current_order_id: null })
      setSelected(null)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-5" style={{ minHeight: '420px' }}>

      {/* ══ TABLE GRID ══ */}
      <div className="flex-1">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center" style={{ color: 'var(--text-muted)' }}>
            <Coffee className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-semibold">Sin mesas en esta zona</p>
            <p className="text-xs mt-1">Crea mesas usando el botón "Nueva Mesa" arriba.</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
            {tables.map(table => {
              const cfg = STATUS_CONFIG[table.status]
              const tableOrder = activeOrders.find(o => o.table_db_id === table.id)
              const isSelected = selected?.id === table.id
              const isCircle = table.shape === 'circle'

              return (
                <button
                  key={table.id}
                  onClick={() => openTable(table)}
                  className="relative flex flex-col items-center justify-center text-center transition-all"
                  style={{
                    height: '120px',
                    borderRadius: isCircle ? '50%' : '20px',
                    background: cfg.bg,
                    border: `2px solid ${isSelected ? '#e56b25' : cfg.border}`,
                    boxShadow: isSelected
                      ? '0 0 0 4px rgba(229,107,37,0.25), 0 8px 24px rgba(0,0,0,0.4)'
                      : `0 4px 16px rgba(0,0,0,0.25)`,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Status dot */}
                  <span
                    className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full"
                    style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
                  />

                  {/* Table name */}
                  <span className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                    {table.name}
                  </span>

                  {/* Capacity */}
                  <span className="flex items-center gap-1 text-[11px] mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    <Users className="h-3 w-3" />{table.capacity}
                  </span>

                  {/* Order total badge */}
                  {tableOrder && (
                    <span
                      className="absolute bottom-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      ${Number(tableOrder.total_amount).toFixed(0)}
                    </span>
                  )}

                  {/* Time badge for occupied */}
                  {table.status === 'occupied' && tableOrder && (
                    <span
                      className="absolute top-2 right-2 text-[9px] font-bold flex items-center gap-0.5"
                      style={{ color: cfg.text }}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(tableOrder.created_at)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* ══ SIDE PANEL ══ */}
      {selected && (
        <div
          className="flex flex-col gap-4 flex-shrink-0"
          style={{
            width: '300px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{selected.name}</h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{
                  background: STATUS_CONFIG[selected.status].bg,
                  color: STATUS_CONFIG[selected.status].text,
                  border: `1px solid ${STATUS_CONFIG[selected.status].border}20`,
                }}
              >
                {STATUS_CONFIG[selected.status].label}
              </span>
            </div>
            <button
              onClick={() => { setSelected(null); setIsEditing(false) }}
              className="p-1.5 rounded-lg hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isEditing ? (
            /* ── EDIT FORM ── */
            <div className="space-y-3 flex-1">
              <div className="form-group">
                <label className="form-label text-xs">Nombre / Número</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="input-field py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="form-label text-xs">Sillas</label>
                  <input type="number" value={editCapacity} onChange={e => setEditCapacity(+e.target.value)} className="input-field py-2 text-sm" />
                </div>
                <div className="form-group">
                  <label className="form-label text-xs">Forma</label>
                  <select value={editShape} onChange={e => setEditShape(e.target.value)} className="input-field py-2 text-sm">
                    <option value="square">Rectangular</option>
                    <option value="circle">Circular</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label text-xs">Zona</label>
                <select value={editZoneId} onChange={e => setEditZoneId(e.target.value)} className="input-field py-2 text-sm">
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm flex-1">Cancelar</button>
                <button onClick={saveEdit} disabled={isPending} className="btn btn-primary btn-sm flex-1">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── ACTIVE ORDER ── */}
              {order ? (
                <div
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ef4444' }}>
                      Consumo activo
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="h-3 w-3 inline mr-0.5" />{timeAgo(order.created_at)}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {order.order_items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.quantity}×</span> {item.products?.name}
                        </span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Total:</span>
                    <span className="text-lg font-black" style={{ color: '#ef4444' }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : selected.status === 'free' ? (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Mesa disponible sin pedido activo.</p>
              ) : null}

              {/* ── QUICK ACTIONS ── */}
              <div className="space-y-2">
                {/* Go to POS */}
                <button
                  onClick={() => router.push(`/pos?tableId=${selected.id}`)}
                  className="btn btn-primary w-full text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {selected.status === 'free' ? 'Nuevo Pedido' : 'Ver / Agregar Consumos'}
                </button>

                {/* Transfer order */}
                {selected.status === 'occupied' && freeTables.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      className="input-field py-2 text-xs flex-1"
                    >
                      <option value="">Mudar a mesa...</option>
                      {freeTables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button
                      onClick={handleTransfer}
                      disabled={!transferTarget || isPending}
                      className="btn btn-secondary btn-sm px-3"
                      title="Transferir pedido"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                {/* Change status */}
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as Table['status'][]).map(st => (
                    <button
                      key={st}
                      onClick={() => changeStatus(st)}
                      disabled={isPending || selected.status === st}
                      className="text-xs py-2 px-3 rounded-xl font-semibold border transition-all"
                      style={{
                        background: selected.status === st ? STATUS_CONFIG[st].bg : 'transparent',
                        borderColor: STATUS_CONFIG[st].border + '50',
                        color: STATUS_CONFIG[st].text,
                        opacity: selected.status === st ? 1 : 0.7,
                      }}
                    >
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── MANAGEMENT ── */}
              <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={startEdit} className="btn btn-secondary btn-sm flex-1 text-xs">
                  <Edit2 className="h-3.5 w-3.5" /> Editar
                </button>
                {selected.status === 'occupied' && (
                  <button onClick={handleRelease} disabled={isPending} className="btn btn-secondary btn-sm text-xs px-3"
                    style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }} title="Liberar mesa forzado">
                    Liberar
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isPending || selected.status !== 'free'}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ color: 'var(--danger)' }}
                  title="Eliminar mesa (solo si está libre)"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
