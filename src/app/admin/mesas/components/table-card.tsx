'use client'

import { useTransition } from 'react'
import { deleteTable } from '@/infrastructure/supabase/tables/actions'
import { Table2, Trash2, Loader2, Users } from 'lucide-react'

export default function TableCard({ table }: { table: any }) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar la mesa "${table.name}"?`)) return
    startTransition(async () => {
      await deleteTable(table.id)
    })
  }

  const getStatusColor = () => {
    switch(table.status) {
      case 'free': return 'var(--table-free)'
      case 'occupied': return 'var(--table-occupied)'
      case 'reserved': return 'var(--table-reserved)'
      case 'billing': return 'var(--table-billing)'
      default: return 'var(--table-free)'
    }
  }

  return (
    <div className="card relative flex flex-col items-center justify-center p-6 text-center group cursor-default">
       {/* Acciones Hover */}
       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            disabled={pending || table.status !== 'free'}
            className="btn btn-ghost btn-icon btn-sm"
            title="Eliminar mesa (solo si está libre)"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Trash2 className="h-4 w-4" style={{ color: 'var(--danger)' }} />}
          </button>
       </div>

       {/* Indicador de Estado */}
       <div 
          className="absolute top-3 left-3 w-3 h-3 rounded-full"
          style={{ background: getStatusColor() }}
       />

       <Table2 className="h-8 w-8 mb-3" style={{ color: 'var(--text-muted)' }} />
       <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{table.name}</h4>
       <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Users className="h-3.5 w-3.5" />
          <span>{table.capacity} sillas</span>
       </div>
    </div>
  )
}
