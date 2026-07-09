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
    .select('role, tenant_id, id')
    .eq('id', user.id)
    .single()

  return profile ? { ...profile, authId: user.id } : null
}

export async function assignDelivery(
  orderId: string,
  deliveryUserId: string,
  addressId: string,
  estimatedMinutes?: number
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase.from('delivery_assignments').insert({
    tenant_id: executor.tenant_id,
    order_id: orderId,
    delivery_user_id: deliveryUserId,
    address_id: addressId,
    status: 'assigned',
    estimated_minutes: estimatedMinutes || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/delivery')
  revalidatePath('/delivery')
  return { success: true, message: 'Repartidor asignado exitosamente' }
}

export async function updateDeliveryStatus(
  assignmentId: string,
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const supabase = await createClientServer()
  const updateData: Record<string, any> = { status }

  if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString()
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString()

  const { error } = await supabase
    .from('delivery_assignments')
    .update(updateData)
    .eq('id', assignmentId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  // If delivered, mark order as completed
  if (status === 'delivered') {
    const { data: assignment } = await supabase
      .from('delivery_assignments')
      .select('order_id')
      .eq('id', assignmentId)
      .single()

    if (assignment?.order_id) {
      await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', assignment.order_id)
    }
  }

  revalidatePath('/delivery')
  revalidatePath('/admin/delivery')
  return { success: true }
}

export async function createDeliveryAddress(
  prevState: any,
  formData: FormData
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const customerName = formData.get('customerName') as string
  const customerPhone = formData.get('customerPhone') as string
  const streetAddress = formData.get('streetAddress') as string
  const city = formData.get('city') as string
  const reference = formData.get('reference') as string

  if (!customerName || !customerPhone || !streetAddress) {
    return { error: 'Faltan campos requeridos' }
  }

  const supabase = await createClientServer()
  const { error } = await supabase.from('delivery_addresses').insert({
    tenant_id: executor.tenant_id,
    customer_name: customerName,
    customer_phone: customerPhone,
    street_address: streetAddress,
    city: city || null,
    reference: reference || null,
  })

  if (error) return { error: error.message }

  return { success: true, message: 'Dirección guardada' }
}
