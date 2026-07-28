import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mylukzjucxgjjmvbteuf.supabase.co'
// MODO MVP/PROTOTIPO: Usamos la service_role key en el frontend para evitar crear un backend
// En producciÃ³n, esto DEBE moverse a un Supabase Edge Function
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bHVremp1Y3hnamptdmJ0ZXVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU1ODMzNCwiZXhwIjoyMDk5MTM0MzM0fQ.m1gNMaOMVQznTtwTpHSxBPcgqUm5URi_vYQYndHyZ1c'

const adminSb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function dbCreateEmployee(tenantId, email, password, firstName, lastName, modules) {
  const { data: authData, error: authError } = await adminSb.auth.admin.createUser({
    email, password, email_confirm: true
  })
  if (authError) throw authError

  const userId = authData.user.id
  const { data: userData, error: userError } = await adminSb.from('users').insert({
    id: userId,
    tenant_id: tenantId,
    role: 'cashier',
    first_name: firstName,
    last_name: lastName,
    roles: modules,
    is_active: true,
    hourly_rate: 0
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

  if (!data || data.length === 0) return []

  try {
    const { data: authData, error: authError } = await adminSb.auth.admin.listUsers()
    if (!authError && authData?.users) {
      const emailMap = {}
      authData.users.forEach(u => emailMap[u.id] = u.email)
      return data.map(u => ({ ...u, email: emailMap[u.id] || 'Sin correo' }))
    }
  } catch (e) {
    console.error('Error fetching emails', e)
  }

  return data
}

export async function dbUpdateEmployee(userId, updates) {
  const { data, error } = await adminSb.from('users')
    .update(updates)
    .eq('id', userId).select().single()
  if (error) throw error
  return data
}

export async function dbUpdateEmployeeAccess(userId, modules) {
  return dbUpdateEmployee(userId, { roles: modules })
}

export async function dbToggleEmployeeStatus(userId, isActive) {
  return dbUpdateEmployee(userId, { is_active: isActive })
}

export async function dbUpdateUserPassword(userId, newPassword) {
  const { data, error } = await adminSb.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) throw error
  return data
}

export async function dbDeleteUser(userId) {
  // Primero eliminamos de public.users para evitar errores de Foreign Key (si no hay CASCADE)
  const { error: dbError } = await adminSb.from('users').delete().eq('id', userId)
  if (dbError) {
    if (dbError.code === '23503') {
      throw new Error('CONSTRAINT_ERROR')
    }
    console.error('Error eliminando de public.users:', dbError)
    throw new Error(`Error en base de datos: ${dbError.message || JSON.stringify(dbError)}`)
  }
  
  // Luego eliminamos de auth.users
  const { error: authError } = await adminSb.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('Error eliminando de auth.users:', authError)
    throw new Error(authError.message || 'Error al eliminar usuario en Auth')
  }
}

export async function dbDeactivateUser(userId) {
  // Desactivar en la tabla users
  await adminSb.from('users').update({ is_active: false, first_name: '[Inactivo]', roles: [] }).eq('id', userId)
  // Banear en auth y cambiar contraseña a algo aleatorio
  await adminSb.auth.admin.updateUserById(userId, { 
    ban_duration: '876000h',
    password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) 
  })
}

// â”€â”€ EMPLOYEE HOURS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function dbGetEmployeeHours(tenantId, filters = {}) {
  let q = adminSb.from('employee_hours')
    .select('*, users(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .order('work_date', { ascending: false })
  if (filters.userId) q = q.eq('user_id', filters.userId)
  if (filters.from)   q = q.gte('work_date', filters.from)
  if (filters.to)     q = q.lte('work_date', filters.to)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function dbAddEmployeeHours(tenantId, userId, workDate, hoursWorked, notes = '', timeIn = null, timeOut = null) {
  const { data, error } = await adminSb.from('employee_hours').insert({
    tenant_id: tenantId,
    user_id: userId,
    work_date: workDate,
    hours_worked: hoursWorked,
    notes,
    time_in: timeIn,
    time_out: timeOut
  }).select().single()
  if (error) throw error
  return data
}

export async function dbUpdateEmployeeHours(id, hoursWorked, notes = '', timeIn = null, timeOut = null) {
  const { data, error } = await adminSb.from('employee_hours')
    .update({ hours_worked: hoursWorked, notes, time_in: timeIn, time_out: timeOut, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function dbDeleteEmployeeHours(id) {
  const { error } = await adminSb.from('employee_hours').delete().eq('id', id)
  if (error) throw error
}

// â”€â”€ TIPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function dbGetTips(tenantId, filters = {}) {
  let q = adminSb.from('payments')
    .select('*, orders(id, order_type, created_at)')
    .eq('tenant_id', tenantId)
    .gt('tip_amount', 0)
    .order('created_at', { ascending: false })
  if (filters.from) q = q.gte('created_at', filters.from)
  if (filters.to)   q = q.lte('created_at', filters.to)
  if (filters.limit) q = q.limit(filters.limit)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

// -- SUPERADMIN (TENANTS / OWNERS) -------------------------------------------
export async function dbGetTenants() {
  const { data, error } = await adminSb.from('tenants')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function dbCreateTenantAndOwner(restaurantName, ownerEmail, ownerPassword, ownerName) {
  // 1. Crear el tenant
  const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  // Set paid_until to one month from now
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  
  const { data: tenantData, error: tenantError } = await adminSb.from('tenants').insert({
    name: restaurantName,
    slug: slug + '-' + Math.floor(Math.random() * 1000),
    is_active: true,
    paid_until: nextMonth.toISOString().split('T')[0]
  }).select().single()

  if (tenantError) throw tenantError

  // 2. Crear el usuario en Auth
  const { data: authData, error: authError } = await adminSb.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true
  })

  if (authError) {
    await adminSb.from('tenants').delete().eq('id', tenantData.id)
    throw authError
  }

  // 3. Crear el registro del dueño en users (role: admin)
  const { data: userData, error: userError } = await adminSb.from('users').insert({
    id: authData.user.id,
    tenant_id: tenantData.id,
    role: 'owner',
    first_name: ownerName,
    last_name: '',
    roles: ['mesas', 'mostrador', 'delivery', 'repartidor', 'cocina', 'ventas', 'caja', 'clientes', 'productos', 'empleados', 'historial', 'stock', 'configuracion'],
    is_active: true,
    hourly_rate: 0
  }).select().single()

  if (userError) throw userError

  return { tenant: tenantData, owner: userData }
}

export async function dbToggleTenantStatus(tenantId, isActive) {
  const { data, error } = await adminSb.from('tenants')
    .update({ is_active: isActive })
    .eq('id', tenantId)
    .select().single()
  if (error) throw error
  return data
}

export async function dbUpdateTenantPaidUntil(tenantId, paidUntilDate) {
  const { data, error } = await adminSb.from('tenants')
    .update({ paid_until: paidUntilDate })
    .eq('id', tenantId)
    .select().single()
  if (error) throw error
  return data
}

