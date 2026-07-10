'use server'

import { createClientServer } from '../server'
import { createAdminClient } from '../server'
import { redirect } from 'next/navigation'

/**
 * Obtiene el usuario actual con su perfil completo (rol, tenant)
 */
export async function getCurrentUser() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  return profile ? { ...profile, email: user.email } : null
}

/**
 * Verifica que el usuario actual tiene al menos uno de los roles indicados.
 * Si no, hace redirect a /login.
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Jefes tienen acceso total a todas las secciones
  const isJefe = ['owner', 'admin', 'manager', 'super_admin'].includes(user.role)
  if (isJefe) {
    return user
  }

  // De lo contrario, check si tiene alguno de los roles permitidos en roles
  const userRoles = user.roles || [user.role]
  const hasAccess = userRoles.some((r: string) => allowedRoles.includes(r))

  if (!hasAccess) {
    redirect('/login')
  }

  return user
}

/**
 * Redirige al usuario a su panel según su rol
 */
export async function getRedirectByRole(role: string): Promise<string> {
  switch (role) {
    case 'super_admin': return '/super-admin'
    case 'owner':
    case 'admin':
    case 'manager':   return '/admin'
    case 'cashier':   return '/admin/caja'
    case 'kitchen':   return '/kitchen'
    case 'delivery':  return '/admin/delivery'
    case 'waiter':
    default:          return '/pos'
  }
}
