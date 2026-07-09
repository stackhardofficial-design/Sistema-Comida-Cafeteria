import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './components/settings-form'

export const metadata = { title: 'Configuración' }

export default async function ConfigPage() {
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <p className="page-subtitle">Datos generales de tu restaurante</p>
        </div>
      </div>

      <div className="card">
        <SettingsForm tenant={tenant} />
      </div>
    </div>
  )
}
