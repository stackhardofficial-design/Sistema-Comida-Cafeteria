'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  updateTablePositions, 
  updateTableDetails, 
  transferTableOrder,
  deleteTable
} from '@/infrastructure/supabase/tables/actions'
import { 
  Move, Settings, Edit, Save, Trash2, Users, 
  Check, X, RefreshCw, ShoppingCart, Coffee, Info, AlertTriangle
} from 'lucide-react'

interface Table {
  id: string
  name: string
  capacity: number
  status: 'free' | 'occupied' | 'reserved' | 'billing'
  zone_id: string | null
  pos_x: number
  pos_y: number
  shape: 'square' | 'circle'
  color: string | null
  current_order_id: string | null
}

interface ActiveOrder {
  id: string
  table_db_id: string
  total_amount: number
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    products: { name: string } | null
  }>
}

interface Props {
  zoneId: string
  initialTables: Table[]
  activeOrders: ActiveOrder[]
  allTables: Table[] // Used for target table select in transfer order
  zones: Array<{ id: string; name: string }>
}

const PRESET_COLORS = [
  { name: 'Naranja (Default)', value: '' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Grafito', value: '#4b5563' },
  { name: 'Rosa', value: '#ec4899' },
]

export default function InteractiveMap({ zoneId, initialTables, activeOrders, allTables, zones }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Table positioning states
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [isDesignMode, setIsDesignMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Selected table states
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [isEditingDetails, setIsEditingDetails] = useState(false)

  // Edit details form state
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState(4)
  const [editShape, setEditShape] = useState<'square' | 'circle'>('square')
  const [editColor, setEditColor] = useState<string | null>(null)
  const [editZoneId, setEditZoneId] = useState<string | null>(zoneId)
  
  // Transfer table state
  const [transferTargetId, setTransferTargetId] = useState('')

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragTableIdRef = useRef<string | null>(null)
  const dragStartOffset = useRef({ x: 0, y: 0 })

  // Synchronize when initialTables changes
  useEffect(() => {
    setTables(initialTables)
  }, [initialTables])

  const selectedTable = tables.find(t => t.id === selectedTableId)
  const selectedTableOrder = selectedTable
    ? activeOrders.find(o => o.table_db_id === selectedTable.id || o.id === selectedTable.current_order_id)
    : null

  // Setup form states when editing a table
  const startEditing = () => {
    if (!selectedTable) return
    setEditName(selectedTable.name)
    setEditCapacity(selectedTable.capacity)
    setEditShape(selectedTable.shape || 'square')
    setEditColor(selectedTable.color || '')
    setEditZoneId(selectedTable.zone_id || zoneId)
    setIsEditingDetails(true)
  }

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent, tableId: string) => {
    if (!isDesignMode) {
      setSelectedTableId(tableId)
      setIsEditingDetails(false)
      return
    }

    e.preventDefault()
    dragTableIdRef.current = tableId
    setSelectedTableId(tableId)
    setIsEditingDetails(false)

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragStartOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    
    // Capture pointer
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDesignMode || !dragTableIdRef.current || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    // Calculate new absolute coordinates
    const newX = e.clientX - canvasRect.left - dragStartOffset.current.x
    const newY = e.clientY - canvasRect.top - dragStartOffset.current.y

    // Convert to percentage (0 - 100)
    let pctX = Math.round((newX / canvasRect.width) * 100)
    let pctY = Math.round((newY / canvasRect.height) * 100)

    // Clamp coordinates to bounds (taking approx width of table into account)
    pctX = Math.max(0, Math.min(90, pctX))
    pctY = Math.max(0, Math.min(90, pctY))

    setTables(prev => prev.map(t => 
      t.id === dragTableIdRef.current 
        ? { ...t, pos_x: pctX, pos_y: pctY }
        : t
    ))
    setHasUnsavedChanges(true)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragTableIdRef.current) {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      dragTableIdRef.current = null
    }
  }

  // Save layout positions
  const handleSaveLayout = () => {
    startTransition(async () => {
      const positions = tables.map(t => ({
        id: t.id,
        pos_x: t.pos_x,
        pos_y: t.pos_y
      }))
      const res = await updateTablePositions(positions)
      if (res.success) {
        setHasUnsavedChanges(false)
        setIsDesignMode(false)
        router.refresh()
      } else {
        alert('Error al guardar posiciones: ' + res.error)
      }
    })
  }

  // Save table details edit
  const handleSaveDetails = () => {
    if (!selectedTableId) return
    startTransition(async () => {
      const res = await updateTableDetails(selectedTableId, {
        name: editName,
        capacity: editCapacity,
        shape: editShape,
        color: editColor || null,
        zone_id: editZoneId || null
      })
      if (res.success) {
        setIsEditingDetails(false)
        router.refresh()
      } else {
        alert('Error al actualizar mesa: ' + res.error)
      }
    })
  }

  // Update status directly
  const handleStatusChange = (newStatus: 'free' | 'occupied' | 'reserved' | 'billing') => {
    if (!selectedTableId) return
    startTransition(async () => {
      const res = await updateTableDetails(selectedTableId, { status: newStatus })
      if (res.success) {
        router.refresh()
      } else {
        alert('Error al actualizar estado: ' + res.error)
      }
    })
  }

  // Release table (clear current order & set free)
  const handleReleaseTable = () => {
    if (!selectedTableId) return
    if (!confirm('¿Seguro que deseas liberar esta mesa? Esto no cancelará la factura, pero desvinculará el pedido de la mesa.')) return
    startTransition(async () => {
      const res = await updateTableDetails(selectedTableId, { 
        status: 'free',
        current_order_id: null 
      })
      if (res.success) {
        router.refresh()
      } else {
        alert('Error al liberar mesa: ' + res.error)
      }
    })
  }

  // Delete table
  const handleDeleteTable = () => {
    if (!selectedTableId || !selectedTable) return
    if (!confirm(`¿Eliminar definitivamente la mesa "${selectedTable.name}"?`)) return
    startTransition(async () => {
      const res = await deleteTable(selectedTableId)
      if (res.success) {
        setSelectedTableId(null)
        router.refresh()
      } else {
        alert('Error al eliminar mesa: ' + res.error)
      }
    })
  }

  // Transfer active order
  const handleTransferOrder = () => {
    if (!selectedTableId || !transferTargetId) return
    startTransition(async () => {
      const res = await transferTableOrder(selectedTableId, transferTargetId)
      if (res.success) {
        setTransferTargetId('')
        router.refresh()
      } else {
        alert('Error al mudar pedido: ' + res.error)
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'free': return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">Libre</span>
      case 'occupied': return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500 font-semibold border border-red-500/20">Ocupada</span>
      case 'reserved': return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-500 font-semibold border border-purple-500/20">Reservada</span>
      case 'billing': return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">Por Cobrar</span>
      default: return null
    }
  }

  const getTableStatusStyle = (table: Table) => {
    if (selectedTableId === table.id) {
      return 'ring-4 ring-orange-500 shadow-lg scale-105 border-orange-500'
    }
    
    switch(table.status) {
      case 'free': return 'border-emerald-500/30 hover:border-emerald-500'
      case 'occupied': return 'border-red-500/40 hover:border-red-500'
      case 'reserved': return 'border-purple-500/30 hover:border-purple-500'
      case 'billing': return 'border-amber-500/30 hover:border-amber-500'
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      
      {/* Map Canvas Area */}
      <div className="flex-1 flex flex-col bg-surface border border-subtle rounded-2xl overflow-hidden relative">
        
        {/* Canvas Toolbar */}
        <div className="p-4 border-b border-subtle flex items-center justify-between bg-elevated/40 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">
              {isDesignMode ? '📐 Editando Distribución' : '📍 Vista de Mesas'}
            </h3>
            {hasUnsavedChanges && (
              <span className="text-[11px] text-amber-500 font-medium animate-pulse">
                Tiene cambios sin guardar
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {isDesignMode ? (
              <>
                <button 
                  onClick={() => {
                    setTables(initialTables)
                    setHasUnsavedChanges(false)
                    setIsDesignMode(false)
                  }}
                  className="btn btn-secondary btn-sm"
                  disabled={isPending}
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
                <button 
                  onClick={handleSaveLayout}
                  className="btn btn-primary btn-sm shadow-md"
                  disabled={isPending}
                >
                  <Save className="h-4 w-4" /> Guardar
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsDesignMode(true)}
                className="btn btn-secondary btn-sm"
              >
                <Move className="h-4 w-4" /> Diseñar Plano
              </button>
            )}
          </div>
        </div>

        {/* Canvas Floor */}
        <div 
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--border-subtle)_1px,_transparent_1px)] bg-[size:24px_24px] relative overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          {tables.map((table) => {
            const isCircle = table.shape === 'circle'
            const customBg = table.color || (table.status === 'occupied' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)')
            const customBorderColor = table.color || 'transparent'

            return (
              <div
                key={table.id}
                onPointerDown={(e) => handlePointerDown(e, table.id)}
                onPointerUp={handlePointerUp}
                className={`absolute cursor-pointer flex flex-col items-center justify-center transition-all select-none border-2 ${
                  isCircle ? 'rounded-full' : 'rounded-2xl'
                } ${getTableStatusStyle(table)}`}
                style={{
                  left: `${table.pos_x}%`,
                  top: `${table.pos_y}%`,
                  width: '90px',
                  height: '90px',
                  background: customBg,
                  borderColor: customBorderColor !== 'transparent' ? customBorderColor : undefined,
                  touchAction: 'none',
                }}
              >
                {/* Table Indicator Badge */}
                <div 
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: 
                      table.status === 'free' ? '#10b981' :
                      table.status === 'occupied' ? '#ef4444' :
                      table.status === 'reserved' ? '#8b5cf6' : '#f59e0b'
                  }}
                />

                <span className="font-extrabold text-sm text-primary tracking-tight">{table.name}</span>
                <span className="text-[10px] text-muted flex items-center gap-0.5 mt-0.5">
                  <Users className="h-3 w-3" /> {table.capacity}
                </span>
                
                {/* Visual state decorator */}
                {table.status === 'occupied' && (
                  <span className="absolute bottom-1 px-1.5 py-0.5 rounded text-[8px] bg-red-500/20 text-red-500 font-bold uppercase">
                    Servida
                  </span>
                )}
              </div>
            )
          })}

          {tables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted">
              <AlertTriangle className="h-10 w-10 mb-3 text-muted" />
              <p className="text-sm font-semibold">No hay mesas en esta zona</p>
              <p className="text-xs mt-1">Usa el botón superior para crear una nueva mesa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Information / Control Panel */}
      <div className="w-full lg:w-[360px] bg-surface border border-subtle rounded-2xl p-5 flex flex-col overflow-y-auto">
        {selectedTable ? (
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                    {selectedTable.name}
                  </h2>
                  <p className="text-xs text-muted flex items-center gap-1.5 mt-1">
                    <Users className="h-3.5 w-3.5" /> Capacidad: {selectedTable.capacity} personas
                    {selectedTable.shape === 'circle' ? ' (Circular)' : ' (Rectangular)'}
                  </p>
                </div>
                <div>
                  {getStatusBadge(selectedTable.status)}
                </div>
              </div>
            </div>

            {/* Quick Actions Mode Design vs Normal */}
            {isEditingDetails ? (
              <div className="space-y-4 p-4 rounded-xl bg-elevated/50 border border-subtle">
                <h3 className="font-bold text-sm text-primary">Editar Mesa</h3>
                
                <div className="form-group">
                  <label className="form-label text-xs">Nombre / Número</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field py-1.5 text-sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label text-xs">Sillas</label>
                    <input 
                      type="number" 
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(parseInt(e.target.value) || 2)}
                      className="input-field py-1.5 text-sm" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-semibold">Forma</label>
                    <select 
                      value={editShape}
                      onChange={(e) => setEditShape(e.target.value as any)}
                      className="input-field py-1.5 text-sm"
                    >
                      <option value="square">Rectangular</option>
                      <option value="circle">Circular</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">Color Personalizado</label>
                  <select
                    value={editColor || ''}
                    onChange={(e) => setEditColor(e.target.value || null)}
                    className="input-field py-1.5 text-sm"
                  >
                    {PRESET_COLORS.map(c => (
                      <option key={c.name} value={c.value}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">Cambiar Zona</label>
                  <select
                    value={editZoneId || ''}
                    onChange={(e) => setEditZoneId(e.target.value || null)}
                    className="input-field py-1.5 text-sm"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditingDetails(false)}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveDetails}
                    disabled={isPending}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* ACTIVE ORDER DETAILS */}
                {selectedTable.status === 'occupied' && selectedTableOrder ? (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-red-500/10 pb-2">
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="h-3.5 w-3.5" /> Consumo Activo
                      </span>
                      <span className="text-xs text-muted">
                        Hace {Math.max(1, Math.round((Date.now() - new Date(selectedTableOrder.created_at).getTime()) / 60000))} min
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 max-h-[160px] overflow-y-auto text-sm pr-1">
                      {selectedTableOrder.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-xs">
                          <span className="text-primary font-medium">
                            <span className="font-bold text-red-400">{item.quantity}x</span> {item.products?.name || 'Producto'}
                          </span>
                          <span className="text-muted font-bold">${(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-red-500/10 pt-3">
                      <span className="text-sm font-semibold text-muted">Total Parcial:</span>
                      <span className="text-lg font-black text-red-500">${Number(selectedTableOrder.total_amount).toFixed(2)}</span>
                    </div>

                    {/* POS Checkout shortcut */}
                    <button 
                      onClick={() => router.push(`/pos?tableId=${selectedTable.id}`)}
                      className="btn btn-primary w-full py-2.5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                    >
                      <Coffee className="h-4 w-4" /> Agregar / Cobrar Cuenta
                    </button>
                  </div>
                ) : (
                  selectedTable.status === 'occupied' && (
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-2.5 text-xs text-orange-500">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>Hay un pedido en esta mesa, pero se está preparando el envío inicial.</span>
                    </div>
                  )
                )}

                {/* DIRECT POS ORDER ACTION FOR FREE TABLE */}
                {selectedTable.status === 'free' && (
                  <button
                    onClick={() => router.push(`/pos?tableId=${selectedTable.id}`)}
                    className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold shadow-md shadow-orange-500/25"
                  >
                    <ShoppingCart className="h-4 w-4" /> Abrir Pedido en Mesa
                  </button>
                )}

                {/* TRANSFER / MUDAR ACCOUNT */}
                {selectedTable.status === 'occupied' && (
                  <div className="p-4 rounded-xl bg-elevated/40 border border-subtle space-y-3">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Mudar Mesa</h4>
                    <p className="text-[11px] text-muted">Transfiere la cuenta activa a otra mesa libre.</p>
                    
                    <div className="flex gap-2">
                      <select
                        value={transferTargetId}
                        onChange={(e) => setTransferTargetId(e.target.value)}
                        className="input-field py-1.5 text-xs flex-1"
                      >
                        <option value="">Selecciona mesa libre...</option>
                        {allTables
                          .filter(t => t.status === 'free' && t.id !== selectedTable.id)
                          .map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                      </select>
                      <button
                        onClick={handleTransferOrder}
                        disabled={isPending || !transferTargetId}
                        className="btn btn-primary btn-sm px-3 text-xs"
                      >
                        Mudar
                      </button>
                    </div>
                  </div>
                )}

                {/* CHANGE STATE MANUALLY */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-muted uppercase tracking-wider">Cambiar Estado</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'free', label: 'Libre', color: 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5' },
                      { id: 'occupied', label: 'Ocupada', color: 'border-red-500/20 text-red-500 hover:bg-red-500/5' },
                      { id: 'reserved', label: 'Reservada', color: 'border-purple-500/20 text-purple-500 hover:bg-purple-500/5' },
                      { id: 'billing', label: 'Por Cobrar', color: 'border-amber-500/20 text-amber-500 hover:bg-amber-500/5' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        disabled={isPending}
                        onClick={() => handleStatusChange(st.id as any)}
                        className={`border rounded-xl py-2 px-3 text-xs font-semibold transition-all ${st.color} ${
                          selectedTable.status === st.id ? 'bg-primary/5 border-primary font-bold' : ''
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EDIT/DELETE CONFIG */}
                <div className="border-t border-subtle pt-5 mt-auto flex gap-2">
                  <button 
                    onClick={startEditing}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    <Edit className="h-3.5 w-3.5" /> Editar Mesa
                  </button>
                  {selectedTable.status === 'occupied' && (
                    <button 
                      onClick={handleReleaseTable}
                      className="btn btn-secondary btn-sm border-amber-500/20 text-amber-500 hover:bg-amber-500/5"
                      title="Forzar liberación de mesa"
                    >
                      Liberar
                    </button>
                  )}
                  <button 
                    onClick={handleDeleteTable}
                    disabled={isPending || selectedTable.status !== 'free'}
                    className="btn btn-ghost btn-icon btn-sm text-red-500 hover:bg-red-500/10"
                    title="Eliminar mesa (debe estar libre)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <Info className="h-10 w-10 mb-3 text-muted" />
            <p className="text-sm font-semibold">Ninguna mesa seleccionada</p>
            <p className="text-xs mt-1">Haz clic sobre cualquier mesa en el mapa para ver sus detalles, pedidos o gestionar su distribución.</p>
          </div>
        )}
      </div>
    </div>
  )
}
