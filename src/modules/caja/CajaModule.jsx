import { useState, useEffect } from 'react'
import { useApp } from '../../lib/AppContext'
import { dbGetOpenSession, dbOpenSession, dbCloseSession, fmtMoney, fmtDate, sb, logActivity } from '../../lib/supabase'
import Modal from '../../components/Modal'

export default function CajaModule() {
  const { tenantId } = useApp()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  
  // Modales
  const [abrirModal, setAbrirModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [cierreModal, setCierreModal] = useState(false)
  const [closingAmount, setClosingAmount] = useState('')

  async function loadCaja() {
    if (!tenantId) return
    try {
      setLoading(true)
      const activeSession = await dbGetOpenSession(tenantId)
      setSession(activeSession)
      
      if (activeSession) {
        // Cargar pagos de la sesión
        const { data } = await sb.from('payments')
          .select('*')
          .eq('cash_session_id', activeSession.id)
        setPayments(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCaja()
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    const cajaChannel = sb.channel('realtime-caja')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_register_sessions', filter: `tenant_id=eq.${tenantId}` },
        () => { loadCaja() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `tenant_id=eq.${tenantId}` },
        () => { loadCaja() }
      )
      .subscribe()

    return () => {
      sb.removeChannel(cajaChannel)
    }
  }, [tenantId])

  async function handleAbrirCaja() {
    const amount = parseFloat(openingAmount) || 0
    try {
      await dbOpenSession(tenantId, amount)
      const { data: { user: authUser } } = await sb.auth.getUser()
      logActivity(tenantId, authUser?.id, authUser?.email?.split('@')[0] || 'Admin', 'OPEN_SESSION', 'cash_session', { opening_amount: amount })
      setAbrirModal(false)
      setOpeningAmount('')
      loadCaja()
    } catch (e) {
      alert('Error al abrir caja: ' + e.message)
    }
  }

  async function handleCerrarCaja() {
    if (!session) return
    const closing = parseFloat(closingAmount) || 0
    const efectivo = payments
      .filter(p => p.payment_method === 'cash' || p.payment_method === 'efectivo')
      .reduce((s, p) => s + parseFloat(p.amount), 0)
    const expected = parseFloat(session.opening_amount || 0) + efectivo

    try {
      await dbCloseSession(session.id, closing, expected)
      const { data: { user: authUser } } = await sb.auth.getUser()
      logActivity(tenantId, authUser?.id, authUser?.email?.split('@')[0] || 'Admin', 'CLOSE_SESSION', 'cash_session', {
        session_id: session.id,
        closing_amount: closing,
        expected_amount: expected,
        difference: closing - expected,
        total_payments: payments.reduce((s, p) => s + parseFloat(p.amount), 0)
      })
      setCierreModal(false)
      setClosingAmount('')
      loadCaja()
    } catch (e) {
      alert('Error al cerrar caja: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Cargando datos de Caja...</div>
    )
  }

  const methodLabels = {
    cash: '💵 Efectivo',
    card: '💳 Tarjeta',
    transfer: '🏦 Transferencia',
    efectivo: '💵 Efectivo',
    debito: '💳 Débito',
    credito: '💳 Crédito',
    mercadopago: '📱 MercadoPago',
    transferencia: '🏦 Transferencia'
  }

  const byMethod = {}
  payments.forEach(p => {
    if (!byMethod[p.payment_method]) byMethod[p.payment_method] = 0
    byMethod[p.payment_method] += parseFloat(p.amount)
  })

  const totalIngresos = Object.values(byMethod).reduce((s, v) => s + v, 0)
  const ingresosEfectivo = (byMethod['cash'] || 0) + (byMethod['efectivo'] || 0)
  const totalEgresos = 0
  const saldoInicial = parseFloat(session?.opening_amount || 0)
  const saldoTeorico = saldoInicial + ingresosEfectivo - totalEgresos

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Caja</h1>
        {session ? (
          <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={() => setCierreModal(true)}>🔒 Cerrar Turno</button>
        ) : (
          <button className="btn btn-primary" onClick={() => setAbrirModal(true)}>🔓 Abrir Caja</button>
        )}
      </div>

      <div className="caja-container" style={{ flex: 1, overflowY: 'auto' }}>
        {!session ? (
          <div className="empty-state">
            <span className="empty-icon">🏧</span>
            <p>No hay caja abierta</p>
            <p className="empty-hint">Abrí un arqueo para comenzar a registrar ventas</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="caja-header-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div>
                <div className="caja-status" style={{ fontWeight: '600' }}>📅 Turno: {fmtDate(session.created_at)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Saldo inicial: {fmtMoney(saldoInicial)}</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--green-border)', fontWeight: '600' }}>🟢 Caja Abierta</div>
            </div>

            <div className="caja-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="caja-card">
                <div className="caja-card-header ingresos">Ingresos por Método <span>{fmtMoney(totalIngresos)}</span></div>
                <div className="caja-rows">
                  {Object.entries(byMethod).length > 0 ? (
                    Object.entries(byMethod).map(([k, v]) => (
                      <div key={k} className="caja-row">
                        <span>{methodLabels[k] || k}</span>
                        <span>{fmtMoney(v)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="caja-row" style={{ color: 'var(--text-muted)' }}>
                      <span>Sin ingresos aún</span>
                    </div>
                  )}
                  <div className="caja-row total">
                    <span>TOTAL INGRESOS</span>
                    <span>{fmtMoney(totalIngresos)}</span>
                  </div>
                </div>
              </div>

              <div className="caja-card">
                <div className="caja-card-header egresos">Egresos <span>{fmtMoney(totalEgresos)}</span></div>
                <div className="caja-rows">
                  <div className="caja-row" style={{ color: 'var(--text-muted)' }}>
                    <span>Sin egresos registrados</span>
                    <span>-</span>
                  </div>
                  <div className="caja-row total">
                    <span>TOTAL EGRESOS</span>
                    <span>{fmtMoney(totalEgresos)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="saldo-teorico" style={{ padding: '20px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
              <div className="label" style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Saldo Teórico en Caja</div>
              <div className="amount" style={{ fontSize: '32px', fontWeight: '800', margin: '10px 0' }}>{fmtMoney(saldoTeorico)}</div>
              <div style={{ fontSize: '12px', opacity: '.6' }}>
                = {fmtMoney(saldoInicial)} inicial + {fmtMoney(ingresosEfectivo)} efectivo - {fmtMoney(totalEgresos)} egresos
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Abrir Caja */}
      <Modal show={abrirModal} onClose={() => setAbrirModal(false)} title="🔓 Abrir Caja">
        <div>
          <div className="form-row">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Saldo Inicial (cambio en caja)</label>
            <input
              type="number"
              placeholder="0.00"
              value={openingAmount}
              onChange={e => setOpeningAmount(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-secondary" onClick={() => setAbrirModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAbrirCaja}>Abrir Caja</button>
          </div>
        </div>
      </Modal>

      {/* Modal Cerrar Caja */}
      <Modal show={cierreModal} onClose={() => setCierreModal(false)} title="🔒 Cerrar Caja">
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Ingresá el monto físico contado en caja para calcular la diferencia.
          </p>
          <div className="form-row">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Monto físico en caja ($)</label>
            <input
              type="number"
              placeholder="0.00"
              value={closingAmount}
              onChange={e => setClosingAmount(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}
            />
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-secondary" onClick={() => setCierreModal(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--red)' }} onClick={handleCerrarCaja}>Cerrar Caja</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
