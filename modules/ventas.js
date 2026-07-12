// ============================
// modules/ventas.js
// ============================
async function renderVentas(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="module-header">
      <h1>Historial de Ventas</h1>
    </div>
    <div class="data-container">
      <div class="data-toolbar">
        <input type="date" class="filter-date" id="v-from" value="${today}" onchange="loadVentas()" />
        <span style="color:var(--text-muted)">hasta</span>
        <input type="date" class="filter-date" id="v-to" value="${today}" onchange="loadVentas()" />
        <input class="filter-input" id="v-search" placeholder="Buscar cliente, ID..." oninput="filterVentasLocal(this.value)" />
        <select class="filter-date" id="v-status" onchange="loadVentas()">
          <option value="">Todos los estados</option>
          <option value="paid">Pagado</option>
          <option value="open">Abierto</option>
          <option value="cancelled">Anulado</option>
        </select>
      </div>
      <div class="stats-grid" id="ventas-stats"></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>
            <th>ID Ticket</th><th>Fecha/Hora</th><th>Origen</th>
            <th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody id="ventas-tbody"><tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>`;
  
  await loadVentas();
}

async function loadVentas() {
  const from = document.getElementById('v-from')?.value;
  const to = document.getElementById('v-to')?.value;
  const status = document.getElementById('v-status')?.value;
  
  try {
    const orders = await dbGetOrders({
      from: from ? from + 'T00:00:00' : null,
      to: to ? to + 'T23:59:59' : null,
      status: status || null
    });
    
    // Stats
    const total = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const paid = orders.filter(o => o.status === 'paid').length;
    const statsEl = document.getElementById('ventas-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Ventas</div><div class="stat-value">${fmtMoney(total)}</div></div>
        <div class="stat-card"><div class="stat-label">Tickets</div><div class="stat-value">${orders.length}</div></div>
        <div class="stat-card"><div class="stat-label">Cerradas</div><div class="stat-value">${paid}</div></div>
        <div class="stat-card"><div class="stat-label">Promedio</div><div class="stat-value">${orders.length ? fmtMoney(total/orders.length) : '$0'}</div></div>`;
    }

    const typeLabel = { dine_in: '🪑 Mesa', takeaway: '🏪 Mostrador', delivery: '🛵 Delivery' };
    const statusBadge = {
      paid: '<span class="badge badge-green">Pagado</span>',
      open: '<span class="badge badge-yellow">Abierto</span>',
      cancelled: '<span class="badge badge-red">Anulado</span>',
    };

    const tbody = document.getElementById('ventas-tbody');
    if (tbody) {
      tbody.innerHTML = orders.length
        ? orders.map(o => `<tr>
            <td><code style="font-size:12px">${o.id.slice(-8).toUpperCase()}</code></td>
            <td>${fmtDate(o.created_at)}</td>
            <td>${typeLabel[o.order_type] || o.order_type}</td>
            <td>${o.customer_name || '-'}</td>
            <td style="font-weight:700">${fmtMoney(o.total_amount)}</td>
            <td>${statusBadge[o.status] || o.status}</td>
            <td>
              <button class="btn-icon" onclick="viewVenta('${o.id}')" title="Ver detalle">👁️</button>
              ${o.status !== 'cancelled' ? `<button class="btn-icon del" onclick="anularVenta('${o.id}')" title="Anular">🚫</button>` : ''}
            </td>
          </tr>`).join('')
        : `<tr><td colspan="7" style="text-align:center;padding:32px"><div class="empty-state"><span class="empty-icon">📊</span><p>Sin ventas para el período</p></div></td></tr>`;
    }
  } catch(e) { console.error(e); }
}

function filterVentasLocal(q) {
  document.querySelectorAll('#ventas-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

async function viewVenta(orderId) {
  const order = await dbGetOrder(orderId);
  if (!order) return;
  const items = (order.order_items || []).map(i => `<div class="payment-item-row"><span>${i.quantity}x ${i.products?.name}</span><span>${fmtMoney(i.total_price)}</span></div>`).join('');
  showGenericModal(`
    <h3>Detalle Venta #${orderId.slice(-8).toUpperCase()}</h3>
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px">${fmtDate(order.created_at)} | ${order.customer_name || 'Sin cliente'}</p>
    <div>${items}</div>
    <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;font-weight:800;font-size:16px">
      <span>Total</span><span>${fmtMoney(order.total_amount)}</span>
    </div>
    <div class="form-actions"><button class="btn-primary" onclick="closeGenericModal()">Cerrar</button></div>`);
}

function anularVenta(orderId) {
  showPinModal(async () => {
    try {
      await dbUpdateOrder(orderId, { status: 'cancelled' });
      showToast('Venta anulada', 'success');
      await loadVentas();
    } catch(e) { showToast('Error al anular', 'error'); }
  });
}
