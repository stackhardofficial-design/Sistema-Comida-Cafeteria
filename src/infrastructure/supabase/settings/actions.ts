'use server'

import { createClientServer } from '../server'
import { revalidatePath } from 'next/cache'

export async function updateTenantSettings(
  prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return { error: 'Sin permisos' }
  }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const currency = formData.get('currency') as string
  const timezone = formData.get('timezone') as string
  const taxRate = parseFloat(formData.get('taxRate') as string) || 0

  const { error } = await supabase
    .from('tenants')
    .update({
      name,
      phone: phone || null,
      address: address || null,
      currency: currency || 'USD',
      timezone: timezone || 'America/New_York',
      tax_rate: taxRate,
    })
    .eq('id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/configuracion')
  return { success: true, message: 'Configuración guardada exitosamente' }
}
