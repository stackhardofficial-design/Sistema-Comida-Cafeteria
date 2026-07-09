'use server'

import { createClientServer } from '../server'
import { revalidatePath } from 'next/cache'

export type ActionState = {
  success?: boolean
  message?: string
  error?: string
  data?: any
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

export async function createOrder(
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    notes?: string
    modifiers?: Array<{ modifier_id: string; price_adjustment: number }>
  }>,
  options: {
    tableId?: string
    orderType: 'dine_in' | 'takeout' | 'delivery'
    customerName?: string
    customerPhone?: string
    notes?: string
    deliveryAddressId?: string
  }
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const supabase = await createClientServer()

  const { data, error } = await supabase.rpc('create_order_with_items', {
    p_tenant_id: executor.tenant_id,
    p_user_id: executor.authId,
    p_table_id: options.tableId || null,
    p_order_type: options.orderType,
    p_customer_name: options.customerName || null,
    p_customer_phone: options.customerPhone || null,
    p_notes: options.notes || null,
    p_delivery_address_id: options.deliveryAddressId || null,
    p_items: items,
  })

  if (error) return { error: error.message }

  revalidatePath('/pos')
  revalidatePath('/kitchen')
  revalidatePath('/admin/pedidos')
  return { success: true, message: 'Pedido enviado a cocina', data }
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'in_kitchen' | 'ready' | 'served' | 'completed' | 'cancelled'
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const supabase = await createClientServer()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/kitchen')
  revalidatePath('/pos')
  revalidatePath('/admin/pedidos')
  return { success: true }
}

export async function getActiveOrders(tenantId: string) {
  const supabase = await createClientServer()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        products(name, preparation_time_minutes),
        order_item_modifiers(*, product_modifiers(name))
      ),
      restaurant_tables(name),
      users(first_name, last_name)
    `)
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'in_kitchen', 'ready'])
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function cancelOrder(orderId: string): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()

  // Get table if any to free it
  const { data: order } = await supabase
    .from('orders')
    .select('table_db_id')
    .eq('id', orderId)
    .single()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  // Free the table
  if (order?.table_db_id) {
    await supabase
      .from('restaurant_tables')
      .update({ status: 'free', current_order_id: null })
      .eq('id', order.table_db_id)
  }

  revalidatePath('/kitchen')
  revalidatePath('/pos')
  revalidatePath('/admin/pedidos')
  return { success: true, message: 'Pedido cancelado' }
}
