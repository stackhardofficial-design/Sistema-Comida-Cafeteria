'use client'

import { useTransition } from 'react'
import { deleteZone } from '@/infrastructure/supabase/tables/actions'
import { LayoutGrid, Trash2, Loader2 } from 'lucide-react'

export default function ZoneCard({ zone }: { zone: any }) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar la zona "${zone.name}"? Las mesas de esta zona no se borrarán, pero quedarán sin zona asignada.`)) return
    startTransition(async () => {
      await deleteZone(zone.id)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-1">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
      >
        <LayoutGrid className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          {zone.name}
        </h3>
      </div>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="btn btn-ghost btn-icon btn-sm"
        title="Eliminar zona"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Trash2 className="h-4 w-4" style={{ color: 'var(--danger)' }} />}
      </button>
    </div>
  )
}
