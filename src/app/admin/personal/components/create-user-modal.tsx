'use client'

import { useState, useActionState } from 'react'
import { createUserAccount } from '@/infrastructure/supabase/auth/actions'
import { Plus, X, Loader2, UserPlus } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

export default function CreateUserModal({ currentRole }: { currentRole: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createUserAccount, initial)
  
  if (state.success && open) setTimeout(() => setOpen(false), 1000)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Nuevo Empleado
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Añadir Empleado</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input name="firstName" required className="input-field" placeholder="Juan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input name="lastName" className="input-field" placeholder="Pérez" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico *</label>
                <input name="email" type="email" required className="input-field" placeholder="juan@restaurante.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña (Mín. 6 caracteres) *</label>
                <input name="password" type="password" required minLength={6} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select name="role" required className="input-field">
                  <option value="">Selecciona un rol</option>
                  <option value="waiter">Mesero (POS)</option>
                  <option value="kitchen">Cocina (KDS)</option>
                  <option value="delivery">Repartidor (Delivery)</option>
                  <option value="cashier">Cajero</option>
                  {(currentRole === 'owner' || currentRole === 'admin') && (
                     <option value="manager">Gerente (Admin)</option>
                  )}
                  {currentRole === 'owner' && (
                     <option value="admin">Administrador</option>
                  )}
                </select>
              </div>

              {state.error && <div className="alert alert-error"><span>{state.error}</span></div>}
              {state.success && <div className="alert alert-success"><span>{state.message}</span></div>}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Plus className="h-4 w-4" />}
                  {pending ? 'Creando...' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
