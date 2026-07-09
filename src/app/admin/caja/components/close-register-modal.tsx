'use client'

import { useState, useTransition } from 'react'
import { closeCashRegister } from '@/infrastructure/supabase/payments/actions'
import { Lock, X, Loader2 } from 'lucide-react'

export default function CloseRegisterModal({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleClose = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const closingAmount = parseFloat(fd.get('closingAmount') as string)
    const notes = fd.get('notes') as string

    if (isNaN(closingAmount)) {
      setError('Monto inválido')
      return
    }

    startTransition(async () => {
      const res = await closeCashRegister(sessionId, closingAmount, notes)
      if (res.error) setError(res.error)
      else setOpen(false)
    })
  }

  return (
    <>
      <button className="btn btn-danger" onClick={() => setOpen(true)}>
        <Lock className="h-4 w-4" />
        Cerrar Caja
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2">
                 <Lock className="h-5 w-5" style={{ color: 'var(--danger)' }} />
                 Cerrar Turno de Caja
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleClose} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Monto de cierre (Efectivo total en caja) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>$</span>
                  <input name="closingAmount" type="number" step="0.01" required className="input-field pl-7 font-semibold text-lg" placeholder="0.00" />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Cuenta todo el efectivo (monedas y billetes). El sistema calculará si hay sobrante o faltante.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Notas u Observaciones</label>
                <textarea name="notes" rows={2} className="input-field" placeholder="Justificación de faltantes/sobrantes..." />
              </div>
              
              {error && <div className="alert alert-error"><span>{error}</span></div>}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending} className="btn btn-danger">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Lock className="h-4 w-4" />}
                  {pending ? 'Cerrando...' : 'Confirmar Cierre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
