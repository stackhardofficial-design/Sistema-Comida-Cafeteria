import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import POSClient from './components/pos-client'

export const metadata = { title: 'Punto de Venta' }

export default async function POSPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { createAdminClient } = await import('@/infrastructure/supabase/server')
  const adminClient = createAdminClient()

  // Ensure these queries use admin client to bypass the missing JWT tenant_id claim in RLS
  const [
    { data: categories },
    { data: products },
    { data: tables },
    { data: activeSession }
  ] = await Promise.all([
    adminClient.from('categories').select('*').eq('tenant_id', profile.tenant_id).order('sort_order'),
    adminClient.from('products').select('*, product_modifiers(*)').eq('tenant_id', profile.tenant_id).eq('is_active', true).order('name'),
    adminClient.from('restaurant_tables').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    adminClient.from('cash_register_sessions').select('id').eq('tenant_id', profile.tenant_id).eq('status', 'open').single()
  ])

  return (
    <POSClient 
      categories={categories || []}
      products={products || []}
      tables={tables || []}
      hasActiveCashSession={!!activeSession}
      cashSessionId={activeSession?.id}
      userId={profile.id}
      tenantId={profile.tenant_id}
    />
  )
}
