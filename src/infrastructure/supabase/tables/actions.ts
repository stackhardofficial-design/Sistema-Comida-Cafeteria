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

export async function updateTablePositions(
  positions: Array<{ id: string; pos_x: number; pos_y: number }>
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()

  // Perform updates. Since Supabase client doesn't do bulk updates with different values easily,
  // we can run them in a Promise.all or a custom query.
  const updatePromises = positions.map(p =>
    supabase
      .from('restaurant_tables')
      .update({ pos_x: p.pos_x, pos_y: p.pos_y })
      .eq('id', p.id)
      .eq('tenant_id', executor.tenant_id)
  )

  const results = await Promise.all(updatePromises)
  const firstError = results.find(r => r.error)
  if (firstError && firstError.error) return { error: firstError.error.message }

  revalidatePath('/admin/mesas')
  return { success: true, message: 'Posiciones guardadas' }
}

export async function updateTableDetails(
  tableId: string,
  updates: {
    name?: string
    capacity?: number
    zone_id?: string | null
    shape?: string
    color?: string | null
    status?: 'free' | 'occupied' | 'reserved' | 'billing'
    current_order_id?: string | null
  }
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('restaurant_tables')
    .update(updates)
    .eq('id', tableId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/mesas')
  revalidatePath('/pos')
  return { success: true, message: 'Mesa actualizada correctamente' }
}

export async function transferTableOrder(
  fromTableId: string,
  toTableId: string
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const supabase = await createClientServer()

  // 1. Get fromTable details
  const { data: fromTable, error: getError } = await supabase
    .from('restaurant_tables')
    .select('current_order_id, name')
    .eq('id', fromTableId)
    .eq('tenant_id', executor.tenant_id)
    .single()

  if (getError || !fromTable) return { error: 'No se pudo encontrar la mesa de origen' }
  if (!fromTable.current_order_id) return { error: 'La mesa de origen no tiene un pedido activo' }

  // 2. Get toTable details
  const { data: toTable, error: getToError } = await supabase
    .from('restaurant_tables')
    .select('status, name')
    .eq('id', toTableId)
    .eq('tenant_id', executor.tenant_id)
    .single()

  if (getToError || !toTable) return { error: 'No se pudo encontrar la mesa de destino' }
  if (toTable.status !== 'free') return { error: 'La mesa de destino no está libre' }

  const orderId = fromTable.current_order_id

  // 3. Update orders table to point to new table
  const { error: orderError } = await supabase
    .from('orders')
    .update({ table_db_id: toTableId })
    .eq('id', orderId)
    .eq('tenant_id', executor.tenant_id)

  if (orderError) return { error: orderError.message }

  // 4. Free fromTable
  await supabase
    .from('restaurant_tables')
    .update({ status: 'free', current_order_id: null })
    .eq('id', fromTableId)

  // 5. Occupy toTable
  await supabase
    .from('restaurant_tables')
    .update({ status: 'occupied', current_order_id: orderId })
    .eq('id', toTableId)

  revalidatePath('/admin/mesas')
  revalidatePath('/pos')
  return { success: true, message: `Pedido mudado de ${fromTable.name} a ${toTable.name}` }
}

