'use client'

import { useTransition, useState } from 'react'
import { toggleProductActive, deleteProduct, updateProduct } from '@/infrastructure/supabase/menu/actions'
import { Edit2, Trash2, Eye, EyeOff, Loader2, Clock, Star, X } from 'lucide-react'

interface Props {
  product: {
    id: string
    name: string
    description?: string
    price: number
    is_active: boolean
    is_featured: boolean
    preparation_time_minutes: number
    category_id?: string
    product_modifiers?: Array<{ name: string; price_adjustment: number }>
  }
  categories: Array<{ id: string; name: string }>
}

export default function ProductCard({ product, categories }: Props) {
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  const handleToggle = () => {
    startTransition(async () => {
      await toggleProductActive(product.id, !product.is_active)
    })
  }

  const handleDelete = () => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return
    startTransition(async () => {
      await deleteProduct(product.id)
    })
  }

  return (
    <>
      <div
        className="card"
        style={{
          padding: 0,
          opacity: product.is_active ? 1 : 0.55,
          transition: 'all 0.2s',
        }}
      >
        {/* Image placeholder */}
        <div
          className="h-28 rounded-t-[14px] flex items-center justify-center text-3xl"
          style={{ background: 'var(--bg-elevated)' }}
        >
          🍽️
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {product.name}
            </h4>
            {product.is_featured && (
              <Star className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-orange)', fill: 'var(--brand-orange)' }} />
            )}
          </div>

          {product.description && (
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-base font-bold" style={{ color: 'var(--brand-orange)' }}>
              ${Number(product.price).toFixed(2)}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="h-3 w-3" />
              {product.preparation_time_minutes}m
            </span>
          </div>

          {product.product_modifiers && product.product_modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.product_modifiers.slice(0, 3).map((mod, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                >
                  +{mod.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 pt-1">
            <button onClick={() => setEditOpen(true)} className="btn btn-ghost btn-icon btn-sm flex-1" title="Editar">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleToggle} disabled={pending} className="btn btn-ghost btn-icon btn-sm flex-1" title={product.is_active ? 'Desactivar' : 'Activar'}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin-custom" /> : product.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button onClick={handleDelete} disabled={pending} className="btn btn-ghost btn-icon btn-sm flex-1" title="Eliminar">
              <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Editar Producto</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form action={async (fd) => {
              fd.append('id', product.id)
              await updateProduct(null, fd)
              setEditOpen(false)
            }} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input name="name" required defaultValue={product.name} className="input-field" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea name="description" defaultValue={product.description} className="input-field" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input name="price" type="number" step="0.01" required defaultValue={product.price} className="input-field" />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiempo prep. (min)</label>
                  <input name="preparationTime" type="number" defaultValue={product.preparation_time_minutes} className="input-field" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select name="categoryId" defaultValue={product.category_id || ''} className="input-field">
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
