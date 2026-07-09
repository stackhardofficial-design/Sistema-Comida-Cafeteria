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

export async function openCashRegister(
  prevState: any,
  formData: FormData
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager', 'cashier'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  // Check if there's already an open session
  const supabase = await createClientServer()
  const { data: existing } = await supabase
    .from('cash_register_sessions')
    .select('id')
    .eq('tenant_id', executor.tenant_id)
    .eq('status', 'open')
    .single()

  if (existing) {
    return { error: 'Ya hay una sesión de caja abierta' }
  }

  const openingAmount = parseFloat(formData.get('openingAmount') as string) || 0

  const { data, error } = await supabase
    .from('cash_register_sessions')
    .insert({
      tenant_id: executor.tenant_id,
      cashier_user_id: executor.authId,
      opening_amount: openingAmount,
      status: 'open',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/caja')
  return { success: true, message: 'Caja abierta exitosamente', data }
}

export async function closeCashRegister(
  sessionId: string,
  closingAmount: number,
  notes?: string
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor || !['owner', 'admin', 'manager', 'cashier'].includes(executor.role)) {
    return { error: 'Sin permisos' }
  }

  const supabase = await createClientServer()

  // Calculate expected amount from payments in this session
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, tip_amount')
    .eq('cash_session_id', sessionId)

  const expectedAmount = payments?.reduce(
    (sum, p) => sum + Number(p.amount) + Number(p.tip_amount || 0),
    0
  ) || 0

  const { error } = await supabase
    .from('cash_register_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference: closingAmount - expectedAmount,
      notes: notes || null,
    })
    .eq('id', sessionId)
    .eq('tenant_id', executor.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/caja')
  return { success: true, message: 'Caja cerrada correctamente' }
}

export async function processPayment(
  orderId: string,
  paymentMethod: 'cash' | 'card' | 'transfer' | 'app' | 'voucher',
  amount: number,
  tipAmount: number = 0,
  changeAmount: number = 0,
  referenceCode?: string,
  cashSessionId?: string
): Promise<ActionState> {
  const executor = await getExecutor()
  if (!executor) return { error: 'No autenticado' }

  const supabase = await createClientServer()
  const { data, error } = await supabase.rpc('complete_order_payment', {
    p_tenant_id: executor.tenant_id,
    p_order_id: orderId,
    p_payment_method: paymentMethod,
    p_amount: amount,
    p_tip: tipAmount,
    p_change: changeAmount,
    p_processed_by: executor.authId,
    p_cash_session_id: cashSessionId || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/caja')
  revalidatePath('/admin/pedidos')
  revalidatePath('/pos')
  return { success: true, message: 'Pago registrado exitosamente', data }
}

export async function getCashRegisterSummary(sessionId: string) {
  const supabase = await createClientServer()
  const { data: payments, error } = await supabase
    .from('payments')
    .select('payment_method, amount, tip_amount')
    .eq('cash_session_id', sessionId)

  if (error) return { error: error.message }

  const summary = payments?.reduce(
    (acc, p) => {
      const method = p.payment_method as string
      if (!acc[method]) acc[method] = 0
      acc[method] += Number(p.amount)
      acc.total += Number(p.amount) + Number(p.tip_amount || 0)
      return acc
    },
    { total: 0 } as Record<string, number>
  ) || { total: 0 }

  return { data: summary }
}
