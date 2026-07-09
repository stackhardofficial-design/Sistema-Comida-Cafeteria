'use server'

import { redirect } from 'next/navigation'
import { createClientServer, createAdminClient } from '../server'
import { getRedirectByRole } from './auth-helpers'

export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  const supabase = await createClientServer()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales incorrectas. Verifica tu email y contraseña.' }
  }

  // Verificar el rol del usuario para redirigir
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = userProfile?.role ?? 'waiter'
  const redirectTo = getRedirectByRole(role)
  redirect(redirectTo)
}

export async function logoutUser() {
  const supabase = await createClientServer()
  await supabase.auth.signOut()
  redirect('/login')
}

export type AuthActionState = {
  success?: boolean
  message?: string
  error?: string
}

/**
 * Crea una cuenta de empleado para el restaurante del dueño autenticado.
 * SOLO puede ser ejecutada por owner, admin o manager.
 */
export async function createUserAccount(prevState: any, formData: FormData): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const role = formData.get('role') as string

  if (!email || !password || !firstName || !role) {
    return { error: 'Faltan campos requeridos' }
  }

  const validEmployeeRoles = ['admin', 'manager', 'cashier', 'kitchen', 'waiter', 'delivery']
  if (!validEmployeeRoles.includes(role)) {
    return { error: 'Rol no válido' }
  }

  const supabase = await createClientServer()

  // 1. Verificar autenticación del ejecutor
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: 'No autenticado' }

  // 2. Verificar que el ejecutor tiene permisos
  const { data: executorProfile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', authData.user.id)
    .single()

  const allowedRoles = ['owner', 'admin', 'manager']
  if (!executorProfile || !allowedRoles.includes(executorProfile.role)) {
    return { error: 'No tienes permisos para crear usuarios' }
  }

  // managers solo pueden crear waiter, kitchen, delivery
  if (executorProfile.role === 'manager' && ['admin', 'owner'].includes(role)) {
    return { error: 'Los managers no pueden crear administradores' }
  }

  // 3. Crear usuario en Supabase Auth
  const adminClient = createAdminClient()
  const { data: newUser, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createAuthError) {
    return { error: createAuthError.message }
  }

  // 4. Insertar perfil en tabla users
  const { error: dbError } = await adminClient
    .from('users')
    .insert({
      id: newUser.user.id,
      tenant_id: executorProfile.tenant_id,
      role,
      first_name: firstName,
      last_name: lastName || null,
    })

  if (dbError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: `Error guardando perfil: ${dbError.message}` }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/personal')

  return { success: true, message: `${firstName} ha sido creado exitosamente como ${role}` }
}

/**
 * Activa o desactiva un usuario empleado.
 * Solo owner/admin puede hacer esto.
 */
export async function toggleUserActive(userId: string, isActive: boolean): Promise<AuthActionState> {
  const supabase = await createClientServer()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: 'No autenticado' }

  const { data: executorProfile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', authData.user.id)
    .single()

  if (!executorProfile || !['owner', 'admin'].includes(executorProfile.role)) {
    return { error: 'No tienes permisos' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId)
    .eq('tenant_id', executorProfile.tenant_id)

  if (error) return { error: error.message }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/personal')
  return { success: true, message: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente` }
}

/**
 * Solo para Super Admin: Crea un restaurante (tenant) con su usuario owner.
 */
export async function createTenantWithOwner(prevState: any, formData: FormData): Promise<AuthActionState> {
  const restaurantName = formData.get('restaurantName') as string
  const slug = formData.get('slug') as string
  const ownerEmail = formData.get('ownerEmail') as string
  const ownerPassword = formData.get('ownerPassword') as string
  const ownerFirstName = formData.get('ownerFirstName') as string
  const ownerLastName = formData.get('ownerLastName') as string
  const currency = formData.get('currency') as string || 'USD'
  const timezone = formData.get('timezone') as string || 'America/New_York'

  if (!restaurantName || !slug || !ownerEmail || !ownerPassword || !ownerFirstName) {
    return { error: 'Faltan campos requeridos' }
  }

  // Verify super_admin
  const supabase = await createClientServer()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: 'No autenticado' }

  const { data: executorProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (executorProfile?.role !== 'super_admin') {
    return { error: 'Acceso denegado: Solo el Super Admin puede crear restaurantes' }
  }

  const adminClient = createAdminClient()

  // 1. Create the tenant
  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .insert({
      name: restaurantName,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      currency,
      timezone,
      is_active: true,
    })
    .select()
    .single()

  if (tenantError) {
    return { error: `Error creando restaurante: ${tenantError.message}` }
  }

  // 2. Create auth user for owner
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
  })

  if (authError) {
    await adminClient.from('tenants').delete().eq('id', tenant.id)
    return { error: `Error creando usuario: ${authError.message}` }
  }

  // 3. Create user profile
  const { error: profileError } = await adminClient
    .from('users')
    .insert({
      id: newUser.user.id,
      tenant_id: tenant.id,
      role: 'owner',
      first_name: ownerFirstName,
      last_name: ownerLastName || null,
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    await adminClient.from('tenants').delete().eq('id', tenant.id)
    return { error: `Error guardando perfil: ${profileError.message}` }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/super-admin/restaurantes')
  return { success: true, message: `Restaurante "${restaurantName}" creado con su dueño exitosamente` }
}

/**
 * Super Admin: Activa o desactiva un restaurante
 */
export async function toggleTenantActive(tenantId: string, isActive: boolean): Promise<AuthActionState> {
  const supabase = await createClientServer()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: 'No autenticado' }

  const { data: executorProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (executorProfile?.role !== 'super_admin') {
    return { error: 'Acceso denegado' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('tenants')
    .update({ is_active: isActive })
    .eq('id', tenantId)

  if (error) return { error: error.message }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/super-admin/restaurantes')
  return { success: true, message: `Restaurante ${isActive ? 'activado' : 'desactivado'} correctamente` }
}
