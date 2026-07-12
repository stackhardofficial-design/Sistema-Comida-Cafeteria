'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateTableDetails,
  transferTableOrder,
  deleteTable,
  updateTablePositions,
} from '@/infrastructure/supabase/tables/actions'
import {
  Users, X, Edit2, Trash2, ArrowRightLeft,
  ShoppingCart, Clock, Loader2, Save, Move
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
  free:     { label: 'Libre',      bg: '#7ed957', border: '#6bc747', text: '#ffffff' },
  occupied: { label: 'Ocupada',    bg: '#ff5757', border: '#e64949', text: '#ffffff' },
  reserved: { label: 'Reservada',  bg: '#ffbd59', border: '#e6a849', text: '#ffffff' },
  billing:  { label: 'Por cobrar', bg: '#5ce1e6', border: '#4ac8cc', text: '#ffffff' },
}

function timeAgo(isoDate: string) {
  const mins = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function InteractiveMap({ zoneId, initialTables, activeOrders, allTables, zones }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Selection & Forms
  const [selected, setSelected] = useState<Table | null>(null)
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [transferTarget, setTransferTarget] = useState('')
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState(4)
  const [editShape, setEditShape] = useState('square')
  const [editZoneId, setEditZoneId] = useState('')

  // Drag & Layout State
  const [isEditMode, setIsEditMode] = useState(false)
  const [localTables, setLocalTables] = useState<Table[]>(initialTables)
  const mapRef = useRef<HTMLDivElement>(null)
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Update local tables when props change (but not while dragging)
  useEffect(() => {
    if (!draggedTableId) setLocalTables(initialTables)
  }, [initialTables, draggedTableId])

  const activeOrder = selected ? activeOrders.find(o => o.table_db_id === selected.id) : null
  const freeTables = allTables.filter(t => t.status === 'free' && t.id !== selected?.id)

  // -- Interaction Handlers --
  function openTable(table: Table) {
    if (isEditMode) return // In edit mode, clicking selects for dragging only
    setSelected(table)
    setIsEditingTable(false)
    setTransferTarget('')
  }

  function startEditForm() {
    if (!selected) return
    setEditName(selected.name)
    setEditCapacity(selected.capacity)
    setEditShape(selected.shape || 'square')
    setEditZoneId(selected.zone_id || zoneId || '')
    setIsEditingTable(true)
  }

  function saveTableEdit() {
    if (!selected) return
    startTransition(async () => {
      const res = await updateTableDetails(selected.id, {
        name: editName, capacity: editCapacity,
        shape: editShape, zone_id: editZoneId === 'nozone' ? null : editZoneId || null,
      })
      if (res.error) return alert(res.error)
      setIsEditingTable(false)
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
    if (!confirm(`¿Eliminar la mesa "${selected.name}"?`)) return
    startTransition(async () => {
      await deleteTable(selected.id)
      setSelected(null)
      router.refresh()
    })
  }

  function saveLayout() {
    startTransition(async () => {
      const positions = localTables.map(t => ({ id: t.id, pos_x: t.pos_x, pos_y: t.pos_y }))
      const res = await updateTablePositions(positions)
      if (res.error) alert(res.error)
      else setIsEditMode(false)
      router.refresh()
    })
  }

  // -- Drag & Drop Logic --
  const handlePointerDown = (e: React.PointerEvent, table: Table) => {
    if (!isEditMode) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setDraggedTableId(table.id)
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggedTableId || !mapRef.current) return
    e.preventDefault()

    const mapRect = mapRef.current.getBoundingClientRect()
    // Calculate new position relative to map container
    let newX = e.clientX - mapRect.left - dragOffset.x
    let newY = e.clientY - mapRect.top - dragOffset.y

    // Grid snapping (optional, e.g. snap to 10px)
    newX = Math.round(newX / 10) * 10
    newY = Math.round(newY / 10) * 10

    // Boundaries
    const tableSize = 80 // Max size
    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX > mapRect.width - tableSize) newX = mapRect.width - tableSize
    if (newY > mapRect.height - tableSize) newY = mapRect.height - tableSize

    setLocalTables(prev => prev.map(t => 
      t.id === draggedTableId ? { ...t, pos_x: newX, pos_y: newY } : t
    ))
  }, [draggedTableId, dragOffset])

  const handlePointerUp = useCallback(() => {
    setDraggedTableId(null)
  }, [])

  useEffect(() => {
    if (draggedTableId) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggedTableId, handlePointerMove, handlePointerUp])

  return (
    <div className="flex gap-4 h-[600px] select-none">
      
      {/* ══ MAP CANVAS ══ */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] rounded-xl overflow-hidden shadow-inner relative border border-gray-300">
        
        {/* Map Header / Toolbar */}
        <div className="bg-white p-3 border-b border-gray-200 flex justify-between items-center z-10">
          <span className="text-gray-600 font-medium text-sm flex items-center gap-2">
            {isEditMode ? (
              <><Move className="h-4 w-4 text-orange-500" /> Arrastra las mesas para ubicarlas</>
            ) : (
              'Selecciona una mesa para gestionar'
            )}
          </span>
          <div>
            {isEditMode ? (
              <div className="flex gap-2">
                <button onClick={() => { setIsEditMode(false); setLocalTables(initialTables) }} className="px-4 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={saveLayout} disabled={isPending} className="px-4 py-1.5 text-sm font-bold bg-green-500 text-white rounded-lg shadow-sm shadow-green-500/30 flex items-center gap-2 hover:bg-green-600 transition-colors">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Diseño
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditMode(true)} className="px-4 py-1.5 text-sm font-bold text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                <Edit2 className="h-4 w-4" /> Configurar Diseño
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={mapRef}
          className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white"
          style={{ touchAction: 'none' }} // Prevent scrolling while dragging on touch devices
        >
          {localTables.map(table => {
            const cfg = STATUS_CONFIG[table.status]
            const isCircle = table.shape === 'circle'
            const isSel = selected?.id === table.id && !isEditMode

            // Fallback grid positions if x,y are 0 and not edited yet
            const idx = initialTables.findIndex(t => t.id === table.id)
            const defaultX = 20 + (idx % 6) * 100
            const defaultY = 20 + Math.floor(idx / 6) * 100

            const posX = table.pos_x || defaultX
            const posY = table.pos_y || defaultY

            return (
              <div
                key={table.id}
                onPointerDown={(e) => handlePointerDown(e, table)}
                onClick={() => !isEditMode && openTable(table)}
                className="absolute flex items-center justify-center transition-shadow"
                style={{
                  left: posX,
                  top: posY,
                  width: '70px',
                  height: '70px',
                  backgroundColor: cfg.bg,
                  borderBottom: `4px solid ${cfg.border}`,
                  borderRadius: isCircle ? '50%' : '12px',
                  color: cfg.text,
                  cursor: isEditMode ? (draggedTableId === table.id ? 'grabbing' : 'grab') : 'pointer',
                  boxShadow: isSel ? '0 0 0 3px rgba(0,0,0,0.8)' : (isEditMode ? '0 4px 6px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.15)'),
                  zIndex: draggedTableId === table.id ? 50 : 10,
                  transform: isSel && !isEditMode ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <span className="text-xl font-black">{table.name}</span>
                
                {/* Time Indicator */}
                {table.status !== 'free' && !isEditMode && (
                  <span className="absolute -top-2 -right-2 bg-white text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-gray-200 shadow-sm">
                    {timeAgo(activeOrders.find(o => o.table_db_id === table.id)?.created_at || new Date().toISOString())}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ SIDE PANEL (Fudo Style) ══ */}
      <div className="w-[340px] bg-white rounded-xl shadow-md border border-gray-200 flex flex-col overflow-hidden">
        
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-gray-600 mb-1">Ninguna mesa seleccionada</h3>
            <p className="text-sm">Selecciona una mesa del mapa para abrirla, ver su consumo o editarla.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 relative">
              <button 
                onClick={() => { setSelected(null); setIsEditingTable(false) }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-200 p-1 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-lg text-white font-black text-xl border-b-[3px]"
                  style={{ background: STATUS_CONFIG[selected.status].bg, borderColor: STATUS_CONFIG[selected.status].border }}
                >
                  {selected.name}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">Mesa {selected.name}</h2>
                  <span className="text-sm font-semibold flex items-center gap-1" style={{ color: STATUS_CONFIG[selected.status].bg }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_CONFIG[selected.status].bg }}></span>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-white">
              {isEditingTable ? (
                /* ── EDIT FORM ── */
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">Editar Mesa</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre / Número</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 outline-none focus:border-orange-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sillas</label>
                      <input type="number" value={editCapacity} onChange={e => setEditCapacity(+e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Forma</label>
                      <select value={editShape} onChange={e => setEditShape(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 outline-none focus:border-orange-500">
                        <option value="square">Cuadrada</option>
                        <option value="circle">Redonda</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zona</label>
                    <select value={editZoneId} onChange={e => setEditZoneId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 outline-none focus:border-orange-500">
                      <option value="nozone">Sin zona</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button onClick={() => setIsEditingTable(false)} className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button onClick={saveTableEdit} disabled={isPending} className="flex-1 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm flex justify-center">
                      {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── ACTIVE ORDER DETAILS ── */
                <>
                  {activeOrder ? (
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <h3 className="font-black text-gray-800">Consumo</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(activeOrder.created_at)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                        {activeOrder.order_items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              <span className="font-bold">{item.quantity}×</span> {item.products?.name}
                            </span>
                            <span className="font-bold text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-4 bg-gray-900 text-white p-4 rounded-xl shadow-sm">
                        <span className="text-sm font-bold uppercase tracking-wider text-gray-300">Total</span>
                        <span className="text-2xl font-black">${Number(activeOrder.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 bg-gray-50 border border-gray-100 rounded-xl">
                      <span className="text-gray-400 font-medium text-sm">Mesa libre, sin pedido activo</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => router.push(`/pos?tableId=${selected.id}`)}
                      className="w-full py-3.5 text-white font-black text-sm bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {selected.status === 'free' ? 'Abrir Mesa (Nuevo Pedido)' : 'Ver / Agregar Consumos'}
                    </button>

                    {/* Mudar Cuenta */}
                    {selected.status === 'occupied' && freeTables.length > 0 && (
                      <div className="flex gap-2">
                        <select
                          value={transferTarget}
                          onChange={e => setTransferTarget(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-500"
                        >
                          <option value="">Mudar a mesa...</option>
                          {freeTables.map(t => <option key={t.id} value={t.id}>Mesa {t.name}</option>)}
                        </select>
                        <button
                          onClick={handleTransfer}
                          disabled={!transferTarget || isPending}
                          className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                          title="Transferir pedido"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Footer Admin Actions */}
            {!isEditingTable && (
              <div className="bg-gray-50 p-4 border-t border-gray-200 flex gap-2">
                <button onClick={startEditForm} className="flex-1 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Edit2 className="h-3 w-3" /> Editar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending || selected.status !== 'free'}
                  className="px-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center disabled:opacity-50"
                  title="Eliminar mesa (solo libre)"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
