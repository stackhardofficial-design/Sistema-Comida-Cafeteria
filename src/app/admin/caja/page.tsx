import { createClientServer } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard, Lock, Unlock, DollarSign, Activity } from 'lucide-react'
import OpenRegisterModal from './components/open-register-modal'
import CloseRegisterModal from './components/close-register-modal'

import { requireRole } from '@/infrastructure/supabase/auth/auth-helpers'

export const metadata = { title: 'Caja' }

export default async function CajaPage() {
  const profile = await requireRole(['cashier'])
  const supabase = await createClientServer()

  // Obtener la sesión de caja abierta
  const { data: activeSession } = await supabase
    .from('cash_register_sessions')
    .select(`
      *,
      users!cash_register_sessions_cashier_user_id_fkey(first_name, last_name)
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'open')
    .single()

  let summary = { total: 0 }
  if (activeSession) {
    const { data: payments } = await supabase
      .from('payments')
      .select('payment_method, amount, tip_amount')
      .eq('cash_session_id', activeSession.id)

    summary = payments?.reduce((acc: any, p: any) => {
      const method = p.payment_method
      if (!acc[method]) acc[method] = 0
      acc[method] += Number(p.amount)
      acc.total += Number(p.amount) + Number(p.tip_amount || 0)
      return acc
    }, { total: 0 }) || { total: 0 }
  }

  // Obtener historial de sesiones cerradas
  const { data: closedSessions } = await supabase
    .from('cash_register_sessions')
    .select(`
      *,
      users!cash_register_sessions_cashier_user_id_fkey(first_name, last_name)
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caja Central</h1>
          <p className="page-subtitle">Gestiona la apertura, cierre y pagos</p>
        </div>
      </div>

      {!activeSession ? (
        <div className="card text-center py-12">
          <Lock className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            La caja está cerrada
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Abre la caja para poder cobrar pedidos en el POS.
          </p>
          <OpenRegisterModal />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Session Card */}
          <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <Unlock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Caja Abierta</h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Cajero: {(activeSession.users as any)?.first_name} {(activeSession.users as any)?.last_name}
                  </p>
                </div>
              </div>
              <CloseRegisterModal sessionId={activeSession.id} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>MONTO INICIAL</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>${Number(activeSession.opening_amount).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>INGRESOS EFECTIVO</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>${Number((summary as any).cash || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>OTROS MÉTODOS</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  ${Number(summary.total - ((summary as any).cash || 0)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>VENTAS TOTALES</p>
                <p className="text-lg font-bold" style={{ color: 'var(--brand-orange)' }}>${Number(summary.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      {closedSessions && closedSessions.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="h-4 w-4" /> Historial de Sesiones
            </h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cajero</th>
                <th>Ingreso Total</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {closedSessions.map((session: any) => (
                <tr key={session.id}>
                  <td>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(session.opened_at).toLocaleDateString('es')}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(session.opened_at).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})} - 
                        {new Date(session.closed_at).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {(session.users as any)?.first_name}
                  </td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${Number(session.closing_amount).toFixed(2)}
                  </td>
                  <td>
                    {Number(session.difference) === 0 ? (
                       <span className="badge badge-free">Cuadrada</span>
                    ) : Number(session.difference) > 0 ? (
                       <span className="badge badge-billing">Sobrante +${Number(session.difference).toFixed(2)}</span>
                    ) : (
                       <span className="badge badge-occupied">Faltante ${Number(session.difference).toFixed(2)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
