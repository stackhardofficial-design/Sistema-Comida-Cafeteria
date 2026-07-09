import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveOrders } from '@/infrastructure/supabase/orders/actions'
import KitchenClient from './components/kitchen-client'

export const metadata = { title: 'Pantalla de Cocina (KDS)' }

export default async function KitchenPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { data: activeOrders } = await getActiveOrders(profile.tenant_id)

  return (
    <KitchenClient initialOrders={activeOrders || []} />
  )
}
