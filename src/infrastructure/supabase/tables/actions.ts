'use server'

import { createClientServer } from '../server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success?: boolean
  message?: string
  error?: string
}

async function getExecutor() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  return profile
}

// ===================== ZONES =====================

export async function createZone(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) return { error: 'El nombre de la zona es requerido' }

  const supabase = await createClientServer()
  const { error } = await supabase.from('restaurant_zones').insert({
    tenant_id: executor.tenant_id,
    name,
    description: description || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/mesas')
  return { success: true, message: 'Zona creada exitosamente' }
}

export async function deleteZone(zoneId: string): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('restaurant_zones')
    .delete()
    .eq('id', zoneId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/mesas')
  return { success: true }
}

// ===================== TABLES =====================

export async function createTable(prevState: any, formData: FormData): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const name = formData.get('name') as string
  const capacity = parseInt(formData.get('capacity') as string) || 4
  const zoneId = formData.get('zoneId') as string

  if (!name) return { error: 'El nombre de la mesa es requerido' }

  const supabase = await createClientServer()
  const { error } = await supabase.from('restaurant_tables').insert({
    tenant_id: executor.tenant_id,
    zone_id: zoneId || null,
    name,
    capacity,
    status: 'free',
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/mesas')
  revalidatePath('/pos')
  return { success: true, message: 'Mesa creada exitosamente' }
}

export async function updateTableStatus(
  tableId: string,
  status: 'free' | 'occupied' | 'reserved' | 'billing'
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('restaurant_tables')
    .update({ status })
    .eq('id', tableId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/mesas')
  revalidatePath('/pos')
  return { success: true }
}

export async function deleteTable(tableId: string): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', tableId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/mesas')
  revalidatePath('/pos')
  return { success: true }
}
