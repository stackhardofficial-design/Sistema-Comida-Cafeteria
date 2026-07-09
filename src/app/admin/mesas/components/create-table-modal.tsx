'use client'

import { useState, useActionState } from 'react'
import { createTable } from '@/infrastructure/supabase/tables/actions'
import { Table2, X, Loader2, Plus } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

export default function CreateTableModal({ zones }: { zones: any[] }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createTable, initial)
  
  if (state.success && open) setTimeout(() => setOpen(false), 1000)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nueva Mesa
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Añadir Mesa</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Nombre / Número *</label>
                  <input name="name" required className="input-field" placeholder="Ej: Mesa 1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad (Sillas)</label>
                  <input name="capacity" type="number" className="input-field" defaultValue="4" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Asignar a Zona</label>
                <select name="zoneId" className="input-field">
                  <option value="">Sin zona (General)</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              
              {state.error && <div className="alert alert-error"><span>{state.error}</span></div>}
              {state.success && <div className="alert alert-success"><span>{state.message}</span></div>}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Plus className="h-4 w-4" />}
                  {pending ? 'Creando...' : 'Añadir Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
