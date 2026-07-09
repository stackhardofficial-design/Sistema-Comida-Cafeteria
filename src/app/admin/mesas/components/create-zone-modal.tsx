'use client'

import { useState, useActionState } from 'react'
import { createZone } from '@/infrastructure/supabase/tables/actions'
import { LayoutGrid, X, Loader2, Plus } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

export default function CreateZoneModal() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createZone, initial)
  
  if (state.success && open) setTimeout(() => setOpen(false), 1000)

  return (
    <>
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        <LayoutGrid className="h-4 w-4" />
        Nueva Zona
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Nueva Zona</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form action={formAction} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre de la Zona *</label>
                <input name="name" required className="input-field" placeholder="Ej: Terraza, Salón Principal..." />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea name="description" className="input-field" rows={2} />
              </div>
              
              {state.error && <div className="alert alert-error"><span>{state.error}</span></div>}
              {state.success && <div className="alert alert-success"><span>{state.message}</span></div>}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Plus className="h-4 w-4" />}
                  {pending ? 'Creando...' : 'Crear Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
