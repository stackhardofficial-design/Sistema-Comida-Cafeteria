'use client'

import { useTransition } from 'react'
import { toggleTenantActive } from '@/infrastructure/supabase/auth/actions'
import { Power, Loader2 } from 'lucide-react'

interface Props {
  tenantId: string
  isActive: boolean
  tenantName: string
}

export default function ToggleTenantButton({ tenantId, isActive, tenantName }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (!confirm(`¿Estás seguro de ${isActive ? 'desactivar' : 'activar'} "${tenantName}"?`)) return
    startTransition(async () => {
      await toggleTenantActive(tenantId, !isActive)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}`}
      title={isActive ? 'Desactivar' : 'Activar'}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin-custom" />
      ) : (
        <Power className="h-3.5 w-3.5" />
      )}
      {isActive ? 'Desactivar' : 'Activar'}
    </button>
  )
}
