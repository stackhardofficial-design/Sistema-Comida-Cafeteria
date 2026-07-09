'use client'

import { useTransition } from 'react'
import { deleteCategory } from '@/infrastructure/supabase/menu/actions'
import { Folder, Trash2, Loader2 } from 'lucide-react'

interface Props {
  category: { id: string; name: string; description?: string; is_active: boolean }
}

export default function CategoryCard({ category }: Props) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"? Los productos quedarán sin categoría.`)) return
    startTransition(async () => {
      await deleteCategory(category.id)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-1">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}
      >
        <Folder className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{category.description}</p>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="btn btn-ghost btn-icon btn-sm"
        title="Eliminar categoría"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Trash2 className="h-4 w-4" style={{ color: 'var(--danger)' }} />}
      </button>
    </div>
  )
}
