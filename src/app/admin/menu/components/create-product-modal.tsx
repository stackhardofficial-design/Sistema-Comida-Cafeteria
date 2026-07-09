'use client'

import { useState, useActionState } from 'react'
import { createProduct } from '@/infrastructure/supabase/menu/actions'
import { Plus, X, Loader2 } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

interface Props {
  categories: Array<{ id: string; name: string }>
}

export default function CreateProductModal({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createProduct, initial)
  if (state.success && open) setTimeout(() => setOpen(false), 1000)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nuevo Producto
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Producto</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form action={formAction} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre del producto *</label>
                <input name="name" required className="input-field" placeholder="Ej: Hamburguesa Clásica" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea name="description" className="input-field" rows={2} placeholder="Descripción del platillo..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input name="price" type="number" step="0.01" min="0" required className="input-field" placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiempo prep. (min)</label>
                  <input name="preparationTime" type="number" className="input-field" defaultValue="10" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select name="categoryId" className="input-field">
                  <option value="">Sin categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="isFeatured" id="isFeatured" value="true"
                  className="w-4 h-4 accent-orange-500 rounded" />
                <label htmlFor="isFeatured" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Producto destacado
                </label>
              </div>
              {state.error && <div className="alert alert-error"><span>{state.error}</span></div>}
              {state.success && <div className="alert alert-success"><span>{state.message}</span></div>}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Plus className="h-4 w-4" />}
                  {pending ? 'Creando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
