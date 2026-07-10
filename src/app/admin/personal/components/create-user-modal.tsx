'use client'

import { useState, useActionState } from 'react'
import { createUserAccount } from '@/infrastructure/supabase/auth/actions'
import { Plus, X, Loader2, UserPlus } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

export default function CreateUserModal({ currentRole, tenantSlug }: { currentRole: string, tenantSlug: string }) {
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
              <input type="hidden" name="tenantSlug" value={tenantSlug} />

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
                <label className="form-label">Nombre de usuario (Para el correo) *</label>
                <div className="flex items-center">
                  <input 
                    name="username" 
                    type="text" 
                    required 
                    className="input-field rounded-r-none flex-1" 
                    placeholder="juan" 
                  />
                  <span 
                    className="bg-zinc-800 text-zinc-400 px-3 py-2 text-sm border border-l-0 rounded-r-lg truncate" 
                    style={{ borderColor: 'var(--border-subtle)', height: '38px', display: 'flex', alignItems: 'center' }}
                  >
                    @{tenantSlug}.com
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña (Mín. 6 caracteres) *</label>
                <input name="password" type="password" required minLength={6} className="input-field" />
              </div>

              <div className="form-group">
                <label className="form-label">Roles del empleado (Selecciona uno o más) *</label>
                <div className="space-y-2 mt-2 p-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                    <input type="checkbox" name="roles" value="waiter" defaultChecked />
                    <span>Mozo (Acceso al POS)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                    <input type="checkbox" name="roles" value="cashier" />
                    <span>Cajero (Acceso a Caja Central)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                    <input type="checkbox" name="roles" value="delivery" />
                    <span>Repartidor (Acceso a Delivery)</span>
                  </label>
                  {(currentRole === 'owner' || currentRole === 'admin') && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                      <input type="checkbox" name="roles" value="manager" />
                      <span>Gerente (Acceso Admin General)</span>
                    </label>
                  )}
                </div>
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
