'use client'

import { useActionState } from 'react'
import { updateTenantSettings } from '@/infrastructure/supabase/settings/actions'
import { Loader2, Save } from 'lucide-react'

const initial = { error: '', success: false, message: '' }

export default function SettingsForm({ tenant }: { tenant: any }) {
  const [state, formAction, pending] = useActionState(updateTenantSettings, initial)

  return (
    <form action={formAction} className="space-y-5">
      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Datos Comerciales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Nombre del Restaurante *</label>
          <input name="name" required defaultValue={tenant.name} className="input-field" />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input name="phone" defaultValue={tenant.phone || ''} className="input-field" />
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Dirección Fiscal / Ubicación</label>
        <input name="address" defaultValue={tenant.address || ''} className="input-field" />
      </div>

      <div className="divider" />
      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Configuración Regional</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Moneda</label>
          <select name="currency" defaultValue={tenant.currency || 'USD'} className="input-field">
             <option value="USD">USD $</option>
             <option value="COP">COP $</option>
             <option value="MXN">MXN $</option>
             <option value="EUR">EUR €</option>
             <option value="ARS">ARS $</option>
             <option value="PEN">PEN S/</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Impuesto / Tax (%)</label>
          <input name="taxRate" type="number" step="0.01" defaultValue={tenant.tax_rate || 0} className="input-field" />
        </div>
        <div className="form-group">
          <label className="form-label">Zona Horaria</label>
          <select name="timezone" defaultValue={tenant.timezone || 'America/New_York'} className="input-field">
             <option value="America/Bogota">Colombia (UTC-5)</option>
             <option value="America/Mexico_City">México (UTC-6)</option>
             <option value="America/New_York">US Este (UTC-5)</option>
             <option value="Europe/Madrid">España (UTC+1)</option>
          </select>
        </div>
      </div>

      {state.error && <div className="alert alert-error"><span>{state.error}</span></div>}
      {state.success && <div className="alert alert-success"><span>{state.message}</span></div>}

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin-custom" /> : <Save className="h-4 w-4" />}
          {pending ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  )
}
