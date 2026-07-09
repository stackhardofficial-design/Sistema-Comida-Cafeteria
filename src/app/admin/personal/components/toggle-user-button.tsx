'use client'

import { useTransition } from 'react'
import { toggleUserActive } from '@/infrastructure/supabase/auth/actions'
import { Power, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  isActive: boolean
  userName: string
  userRole: string
  currentUserRole: string
}

export default function ToggleUserButton({ userId, isActive, userName, userRole, currentUserRole }: Props) {
  const [isPending, startTransition] = useTransition()

  // Prevent manager from disabling admins/owners
  if (currentUserRole === 'manager' && ['admin', 'owner'].includes(userRole)) {
      return null;
  }

  const handleToggle = () => {
    if (!confirm(`¿Estás seguro de ${isActive ? 'desactivar' : 'activar'} a ${userName}?`)) return
    startTransition(async () => {
      await toggleUserActive(userId, !isActive)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}`}
      title={isActive ? 'Desactivar acceso' : 'Activar acceso'}
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
