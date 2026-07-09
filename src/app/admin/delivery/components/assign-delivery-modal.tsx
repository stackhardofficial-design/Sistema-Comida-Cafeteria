'use client'

import { useState, useTransition } from 'react'
import { assignDelivery } from '@/infrastructure/supabase/delivery/actions'
import { Truck, Loader2 } from 'lucide-react'

interface Props {
  order: any
  deliveryUsers: any[]
}

export default function AssignDeliveryModal({ order, deliveryUsers }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const driverId = fd.get('driverId') as string
    const est = fd.get('estimatedMinutes') as string
    const estMinutes = est ? parseInt(est) : undefined

    if (!driverId) {
      setError('Debes seleccionar un repartidor')
      return
    }

    startTransition(async () => {
      const res = await assignDelivery(order.id, driverId, order.delivery_address_id, estMinutes)
      if (res.error) setError(res.error)
      else setOpen(false)
    })
  }

  return (
    <>
      <button className="btn btn-secondary w-full" onClick={() => setOpen(true)}>
        <Truck className="h-4 w-4" />
        Asignar Repartidor
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Asignar Repartidor</h2>
            </div>
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Seleccionar repartidor disponible *</label>
                <select name="driverId" required className="input-field">
                  <option value="">Selecciona...</option>
                  {deliveryUsers.map(d => (
                    <option key={d.id} value={d.id}>{d.first_name} {d.last_name || ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tiempo estimado (minutos)</label>
                <input name="estimatedMinutes" type="number" className="input-field" placeholder="Ej: 20" />
              </div>
              
              {error && <div className="alert alert-error"><span>{error}</span></div>}
              
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending || deliveryUsers.length === 0} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Truck className="h-4 w-4" />}
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
