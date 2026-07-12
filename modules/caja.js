// ============================
// modules/caja.js - Cash register
// ============================
let cajaSession = null;

async function renderCaja(container) {
  cajaSession = await dbGetOpenSession();
  
  container.innerHTML = `
    <div class="module-header">
      <h1>Caja</h1>
      ${cajaSession 
        ? `<button class="btn-cierre-caja" style="width:auto;padding:8px 16px" onclick="initCierreCaja()">🔒 Cerrar Turno</button>`
        : `<button class="btn-primary" onclick="initAbrirCaja()">🔓 Abrir Caja</button>`}
    </div>
    <div class="caja-container">
      ${cajaSession ? await buildCajaContent() : buildCajaEmpty()}
    </div>`;
}

function buildCajaEmpty() {
  return `<div class="empty-state">
    <span class="empty-icon">🏧</span>
    <p>No hay caja abierta</p>
    <p class="empty-hint">Abrí un arqueo para comenzar a registrar ventas</p>
  </div>`;
}

async function buildCajaContent() {
  const session = cajaSession;
  
  // Get payments for this session
  const { data: payments } = await sb.from('payments')
    .select('*')
    .eq('cash_session_id', session.id);
  
  const byMethod = {};
  (payments || []).forEach(p => {
    if (!byMethod[p.payment_method]) byMethod[p.payment_method] = 0;
    byMethod[p.payment_method] += parseFloat(p.amount);
  });
  
  const totalIngresos = Object.values(byMethod).reduce((s, v) => s + v, 0);
  const ingresosEfectivo = byMethod['efectivo'] || 0;
  const totalEgresos = 0; // Expandible
  const saldoInicial = parseFloat(session.opening_amount || 0);
  const saldoTeorico = saldoInicial + ingresosEfectivo - totalEgresos;

  const methodLabels = { efectivo:'💵 Efectivo', debito:'💳 Débito', credito:'💳 Crédito', mercadopago:'📱 MercadoPago', transferencia:'🏦 Transferencia' };

  return `
    <div class="caja-header-info">
      <div>
        <div class="caja-status">📅 Turno: ${fmtDate(session.created_at)}</div>
        <div style="font-size:12px;color:var(--text-secondary)">Saldo inicial: ${fmtMoney(saldoInicial)}</div>
      </div>
      <div style="font-size:13px;color:var(--green-border);font-weight:600">🟢 Caja Abierta</div>
    </div>
    
    <div class="caja-cols">
      <div class="caja-card">
        <div class="caja-card-header ingresos">Ingresos por Método <span>${fmtMoney(totalIngresos)}</span></div>
        <div class="caja-rows">
          ${Object.entries(byMethod).length
            ? Object.entries(byMethod).map(([k,v]) => `<div class="caja-row"><span>${methodLabels[k]||k}</span><span>${fmtMoney(v)}</span></div>`).join('')
            : '<div class="caja-row" style="color:var(--text-muted)"><span colspan="2">Sin ingresos aún</span></div>'}
          <div class="caja-row total"><span>TOTAL INGRESOS</span><span>${fmtMoney(totalIngresos)}</span></div>
        </div>
      </div>
      <div class="caja-card">
        <div class="caja-card-header egresos">Egresos <span>${fmtMoney(totalEgresos)}</span></div>
        <div class="caja-rows">
          <div class="caja-row" style="color:var(--text-muted)"><span>Sin egresos registrados</span><span>-</span></div>
          <div class="caja-row total"><span>TOTAL EGRESOS</span><span>${fmtMoney(totalEgresos)}</span></div>
        </div>
      </div>
    </div>
    
    <div class="saldo-teorico">
      <div class="label">Saldo Teórico en Caja</div>
      <div class="amount">${fmtMoney(saldoTeorico)}</div>
      <div style="font-size:12px;opacity:.6;margin-top:4px">= ${fmtMoney(saldoInicial)} inicial + ${fmtMoney(ingresosEfectivo)} efectivo - ${fmtMoney(totalEgresos)} egresos</div>
    </div>`;
}

function initAbrirCaja() {
  showGenericModal(`
    <h3>🔓 Abrir Caja</h3>
    <div class="form-row">
      <label>Saldo Inicial (cambio en caja)</label>
      <input type="number" id="opening-amount" class="input-saldo" style="width:100%" placeholder="0.00" min="0" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" onclick="abrirCaja()">Abrir Caja</button>
    </div>`);
}

async function abrirCaja() {
  const amount = parseFloat(document.getElementById('opening-amount').value) || 0;
  try {
    await dbOpenSession(amount);
    closeGenericModal();
    showToast('✅ Caja abierta', 'success');
    navigate('caja');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function initCierreCaja() {
  showGenericModal(`
    <h3>🔒 Cerrar Caja</h3>
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Ingresá el monto físico contado en caja para calcular la diferencia.</p>
    <div class="form-row">
      <label>Monto físico en caja ($)</label>
      <input type="number" id="closing-amount" class="input-saldo" style="width:100%" placeholder="0.00" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" style="background:var(--red)" onclick="confirmarCierreCaja()">Cerrar Caja</button>
    </div>`);
}

async function confirmarCierreCaja() {
  if (!cajaSession) return;
  const closing = parseFloat(document.getElementById('closing-amount').value) || 0;
  
  // Calculate expected
  const { data: payments } = await sb.from('payments').select('amount,payment_method').eq('cash_session_id', cajaSession.id);
  const efectivo = (payments || []).filter(p => p.payment_method === 'efectivo').reduce((s, p) => s + parseFloat(p.amount), 0);
  const expected = parseFloat(cajaSession.opening_amount || 0) + efectivo;
  
  try {
    await dbCloseSession(cajaSession.id, closing, expected);
    closeGenericModal();
    showToast('Caja cerrada correctamente', 'success');
    navigate('caja');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}
