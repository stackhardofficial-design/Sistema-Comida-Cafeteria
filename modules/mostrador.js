// ============================
// modules/mostrador.js
// ============================
async function renderMostrador(container) {
  container.innerHTML = `
    <div class="module-header">
      <h1>Mostrador</h1>
      <button class="btn-new-sale" onclick="newMostradorSale()">
        <span class="plus">＋</span> NUEVA VENTA
      </button>
    </div>
    <div class="mostrador-container">
      <div class="mostrador-search">
        <span>🔍</span>
        <input type="text" placeholder="Buscar por número o cliente..." oninput="filterMostrador(this.value)" />
      </div>
      <div class="section-label">EN CURSO</div>
      <div id="mostrador-open" class="tickets-grid">
        <div style="color:var(--text-muted);font-size:13px;padding:12px">Cargando...</div>
      </div>
      <div class="section-label" style="margin-top:16px">CERRADAS (ÚLTIMAS 10)</div>
      <div id="mostrador-closed" class="tickets-grid">
        <div style="color:var(--text-muted);font-size:13px;padding:12px">Cargando...</div>
      </div>
    </div>`;
  
  await loadMostradorData();
}

async function loadMostradorData() {
  try {
    const [open, closed] = await Promise.all([
      dbGetOrders({ status: 'open', type: 'takeaway' }),
      dbGetOrders({ status: 'paid', type: 'takeaway', limit: 10 })
    ]);

    const openEl = document.getElementById('mostrador-open');
    if (openEl) {
      openEl.innerHTML = open.length
        ? open.map(o => ticketCard(o, 'open')).join('')
        : `<div class="empty-state"><span class="empty-icon">🏪</span><p>Sin ventas en curso</p></div>`;
    }
    const closedEl = document.getElementById('mostrador-closed');
    if (closedEl) {
      closedEl.innerHTML = closed.length
        ? closed.map(o => ticketCard(o, 'paid')).join('')
        : `<div class="empty-state"><span class="empty-icon">📋</span><p>Sin ventas cerradas</p></div>`;
    }
  } catch(e) { console.error(e); }
}

function ticketCard(order, status) {
  return `<div class="ticket-card" onclick="openMostradorTicket('${order.id}')">
    <div class="ticket-id">#${order.id.slice(-6).toUpperCase()}</div>
    <div class="ticket-customer">${order.customer_name || 'Sin nombre'}</div>
    <div class="ticket-total">${fmtMoney(order.total_amount)}</div>
    <span class="ticket-status ${status === 'open' ? 'open' : 'paid'}">${status === 'open' ? 'En curso' : 'Pagado'}</span>
  </div>`;
}

function newMostradorSale() {
  APP_STATE.currentContext = { type: 'mostrador', orderId: null };
  APP_STATE.cart = [];
  APP_STATE.discount = { type: 'none', value: 0 };
  renderCart();
  updateComandaHeader('Nuevo Pedido', '🏪 Mostrador');
  showToast('Nueva venta iniciada', 'info');
}

async function openMostradorTicket(orderId) {
  try {
    const order = await dbGetOrder(orderId);
    if (!order) return;
    APP_STATE.currentContext = { type: 'mostrador', orderId: orderId };
    APP_STATE.cart = (order.order_items || []).map(oi => ({
      id: Date.now() + Math.random(),
      product: oi.products,
      qty: oi.quantity,
      notes: oi.notes || '',
      dbItemId: oi.id
    }));
    renderCart();
    updateComandaHeader(`Pedido #${orderId.slice(-6).toUpperCase()}`, order.customer_name || 'Mostrador');
  } catch(e) { showToast('Error al cargar pedido', 'error'); }
}

function filterMostrador(q) {
  // Simple client-side filter
  document.querySelectorAll('.ticket-card').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}
