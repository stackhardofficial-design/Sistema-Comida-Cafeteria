'use server'

import { redirect } from 'next/navigation'
import { createClientServer, createAdminClient } from '../server'

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
    return { error: error.message }
  }

  // Verificar el rol del usuario para redirigir
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = userProfile?.role

  if (role === 'owner' || role === 'admin' || role === 'manager') {
    redirect('/admin')
  } else {
    redirect('/pos')
  }
}

/**
 * Crea una cuenta de usuario empleado.
 * SOLO puede ser ejecutada por dueños o administradores.
 * Utiliza el SERVICE_ROLE_KEY de Supabase para poder crear usuarios desde el servidor.
 */
export async function createUserAccount(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const role = formData.get('role') as string // ej: 'waiter', 'kitchen', 'cashier'

  if (!email || !password || !firstName || !role) {
    return { error: 'Faltan campos requeridos' }
  }

  const supabase = await createClientServer()
  
  // 1. Verificar que el usuario que ejecuta la acción está autenticado
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    return { error: 'No autenticado' }
  }

  // 2. Verificar que el usuario que ejecuta la acción es admin o owner
  const { data: executorProfile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', authData.user.id)
    .single()
    
  if (executorProfile?.role !== 'owner' && executorProfile?.role !== 'admin') {
    return { error: 'No tienes permisos para crear usuarios' }
  }

  // 3. Crear el usuario en Supabase Auth usando el cliente Admin (SERVICE_ROLE_KEY)
  const adminClient = createAdminClient()
  
  const { data: newUser, error: createAuthError } = await adminClient.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirmar el email
  })

  if (createAuthError) {
    return { error: createAuthError.message }
  }

  // 4. Insertar el perfil del usuario en la tabla pública `users`
  // Usamos el adminClient también aquí para asegurar que la inserción se haga
  // (aunque el RLS normal no permitiría a un usuario insertar el tenant_id a la fuerza
  // sin cuidado, el admin client lo bypassea, y nosotros le asignamos el del executor)
  const { error: dbError } = await adminClient
    .from('users')
    .insert({
      id: newUser.user.id,
      tenant_id: executorProfile.tenant_id, // Forzar que sea del mismo tenant
      role: role,
      first_name: firstName,
      last_name: lastName || null,
    })
    
  if (dbError) {
    // Si falla al guardar en DB, idealmente deberíamos borrar el usuario en auth (rollback)
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: `Error guardando en base de datos: ${dbError.message}` }
  }

  return { success: true, message: 'Usuario creado exitosamente' }
}
