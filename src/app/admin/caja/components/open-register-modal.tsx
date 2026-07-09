'use client'

import { useState, useActionState } from 'react'
import { openCashRegister } from '@/infrastructure/supabase/payments/actions'
import { Unlock, X, Loader2 } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

export default function OpenRegisterModal() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(openCashRegister, initial)
  if (state.success && open) setTimeout(() => setOpen(false), 1000)

  return (
    <>
      <button className="btn btn-primary btn-lg" onClick={() => setOpen(true)}>
        <Unlock className="h-5 w-5" />
        Abrir Caja
      </button>

      {open && (
        <div className="modal-backdrop text-left" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Abrir Turno de Caja</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form action={formAction} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Monto de apertura (Fondo de caja) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input name="openingAmount" type="number" step="0.01" required defaultValue="0.00" className="input-field pl-7 font-semibold text-lg" />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>El dinero en efectivo con el que inicias el turno.</p>
              </div>
              
              {state.error && <div className="alert alert-error"><span>{state.error}</span></div>}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Unlock className="h-4 w-4" />}
                  {pending ? 'Abriendo...' : 'Confirmar Apertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
