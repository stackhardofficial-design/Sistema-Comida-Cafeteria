'use client'

import { useState, useActionState } from 'react'
import { createTenantWithOwner } from '@/infrastructure/supabase/auth/actions'
import { Plus, X, Loader2, Store, User, Globe } from 'lucide-react'

const initialState = { error: '', success: false, message: '' }

export default function CreateRestaurantModal() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createTenantWithOwner, initialState)

  // Close on success
  if (state.success && open) {
    setTimeout(() => { setOpen(false) }, 1500)
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo Restaurante
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Crear Nuevo Restaurante</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="space-y-5">
              {/* Restaurant Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Store className="h-4 w-4" style={{ color: 'var(--brand-orange)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Datos del Restaurante
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="form-group">
                    <label className="form-label">Nombre del restaurante *</label>
                    <input name="restaurantName" required className="input-field" placeholder="El Buen Sabor" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label">Slug (identificador) *</label>
                      <input name="slug" required className="input-field" placeholder="el-buen-sabor" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Moneda</label>
                      <select name="currency" className="input-field">
                        <option value="USD">USD $</option>
                        <option value="COP">COP $</option>
                        <option value="MXN">MXN $</option>
                        <option value="EUR">EUR €</option>
                        <option value="PEN">PEN S/</option>
                        <option value="ARS">ARS $</option>
                        <option value="CLP">CLP $</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zona horaria</label>
                    <select name="timezone" className="input-field">
                      <option value="America/Bogota">Colombia (UTC-5)</option>
                      <option value="America/Mexico_City">México Centro (UTC-6)</option>
                      <option value="America/New_York">US Este (UTC-5)</option>
                      <option value="America/Lima">Perú (UTC-5)</option>
                      <option value="America/Argentina/Buenos_Aires">Argentina (UTC-3)</option>
                      <option value="America/Santiago">Chile (UTC-3)</option>
                      <option value="Europe/Madrid">España (UTC+1)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* Owner Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" style={{ color: 'var(--brand-orange)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Datos del Dueño
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label">Nombre *</label>
                      <input name="ownerFirstName" required className="input-field" placeholder="Juan" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Apellido</label>
                      <input name="ownerLastName" className="input-field" placeholder="Pérez" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email del dueño *</label>
                    <input name="ownerEmail" type="email" required className="input-field" placeholder="dueño@restaurante.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contraseña temporal *</label>
                    <input name="ownerPassword" type="password" required className="input-field" placeholder="Min. 6 caracteres" minLength={6} />
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {state.error && (
                <div className="alert alert-error">
                  <span>{state.error}</span>
                </div>
              )}
              {state.success && (
                <div className="alert alert-success">
                  <span>{state.message}</span>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Plus className="h-4 w-4" />}
                  {pending ? 'Creando...' : 'Crear Restaurante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
