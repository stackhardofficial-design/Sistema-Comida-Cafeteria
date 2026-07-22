import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mylukzjucxgjjmvbteuf.supabase.co'
// MODO MVP/PROTOTIPO: Usamos la service_role key en el frontend para evitar crear un backend
// En producción, esto DEBE moverse a un Supabase Edge Function
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bHVremp1Y3hnamptdmJ0ZXVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU1ODMzNCwiZXhwIjoyMDk5MTM0MzM0fQ.m1gNMaOMVQznTtwTpHSxBPcgqUm5URi_vYQYndHyZ1c'

const adminSb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function dbCreateEmployee(tenantId, email, password, firstName, lastName, modules) {
  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await adminSb.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (authError) throw authError

  // 2. Insertar en public.users con los permisos
  const userId = authData.user.id
  const { data: userData, error: userError } = await adminSb.from('users').insert({
    id: userId,
    tenant_id: tenantId,
    role: 'employee',
    first_name: firstName,
    last_name: lastName,
    roles: modules, // Guardamos los modulos a los que tiene acceso en el array de roles
    is_active: true
  }).select().single()

  if (userError) throw userError
  return userData
}

export async function dbGetEmployees(tenantId) {
  const { data, error } = await adminSb.from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export async function dbUpdateEmployeeAccess(userId, modules) {
  const { data, error } = await adminSb.from('users').update({
    roles: modules
  }).eq('id', userId).select().single()
  
  if (error) throw error
  return data
}

export async function dbToggleEmployeeStatus(userId, isActive) {
  const { data, error } = await adminSb.from('users').update({
    is_active: isActive
  }).eq('id', userId).select().single()
  
  if (error) throw error
  return data
}
