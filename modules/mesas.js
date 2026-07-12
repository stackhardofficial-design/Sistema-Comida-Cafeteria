// ============================
// modules/mesas.js - Tables module
// ============================

let mesasZoneFilter = null;
let mesasRefreshInterval = null;

async function renderMesas(container) {
  clearInterval(mesasRefreshInterval);
  container.innerHTML = `
    <div class="module-header">
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <h1>Mesas</h1>
          <button class="btn-primary" style="padding:6px 10px;font-size:12px" onclick="showAddTableForm()">+ Agregar Mesa</button>
        </div>
        <div class="module-tabs" id="zone-tabs">
          <button class="tab-btn active" onclick="filterZone(null)">Todos</button>
        </div>
      </div>
      <span class="occupancy-badge" id="occupancy">Cargando...</span>
    </div>
    <div class="tables-container">
      <div class="tables-grid" id="tables-grid">
        <div class="empty-state"><span class="empty-icon">⏳</span><p>Cargando mesas...</p></div>
      </div>
    </div>`;

  await loadMesasData();
  mesasRefreshInterval = setInterval(loadMesasData, 30000);
}

async function loadMesasData() {
  try {
    const [zones, tables] = await Promise.all([dbGetZones(), dbGetTables()]);
    APP_STATE.zones = zones;
    APP_STATE.tables = tables;

    // Render zone tabs
    const tabsEl = document.getElementById('zone-tabs');
    if (tabsEl) {
      tabsEl.innerHTML = `<button class="tab-btn ${!mesasZoneFilter ? 'active' : ''}" onclick="filterZone(null)">Todos</button>` +
        zones.map(z => `<button class="tab-btn ${mesasZoneFilter === z.id ? 'active' : ''}" onclick="filterZone('${z.id}')">${z.name}</button>`).join('');
    }

    const filtered = mesasZoneFilter ? tables.filter(t => t.zone_id === mesasZoneFilter) : tables;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    
    const occEl = document.getElementById('occupancy');
    if (occEl) occEl.textContent = `${occupied}/${tables.length} mesas ocupadas`;

    const grid = document.getElementById('tables-grid');
    if (!grid) return;
    
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><span class="empty-icon">🪑</span><p>No hay mesas en este sector</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(table => {
      const order = table.orders && table.orders.length > 0
        ? table.orders.find(o => o.status === 'open' || o.status === 'billing') || null
        : null;
      const status = table.status || 'free';
      const statusClass = status === 'free' ? 'available' : status === 'billing' ? 'billing' : 'occupied';

      let meta = '';
      if (status !== 'available' && order) {
        meta = `<div class="table-amount">${fmtMoney(order.total_amount || 0)}</div>
                <div class="table-timer">⏱ ${fmtTimer(order.created_at)}</div>`;
      }

      return `<div class="table-card ${statusClass}" onclick="selectTable('${table.id}', '${table.name}', '${status}')">
        <div class="table-num">${table.name.replace('Mesa ', '')}</div>
        ${meta}
        <div class="table-meta">${status === 'free' ? '✓ Libre' : status === 'billing' ? '💳 Cobrando' : '🍽️ Ocupada'}</div>
      </div>`;
    }).join('');
  } catch(e) {
    console.error('Error loading tables:', e);
  }
}

function filterZone(zoneId) {
  mesasZoneFilter = zoneId;
  document.querySelectorAll('#zone-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  loadMesasData();
}

async function selectTable(tableDbId, tableName, status) {
  clearInterval(mesasRefreshInterval);
  
  // Find existing open order for this table
  const { data: existingOrders } = await sb.from('orders')
    .select('*, order_items(*, products(id, name, price, stock_quantity))')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('table_db_id', tableDbId)
    .eq('status', 'open')
    .limit(1);
  
  const existingOrder = existingOrders && existingOrders.length > 0 ? existingOrders[0] : null;

  APP_STATE.currentContext = {
    type: 'mesa',
    tableDbId: tableDbId,
    tableId: tableName,
    orderId: existingOrder?.id || null
  };

  updateComandaHeader(`Mesa ${tableName.replace('Mesa ', '')}`, status === 'free' ? '🟢 Mesa libre' : '🔴 Mesa ocupada');

  // If occupied, load existing order items into cart view (read only display)
  if (existingOrder && existingOrder.order_items) {
    APP_STATE.cart = existingOrder.order_items.map(oi => ({
      id: oi.id,
      product: oi.products,
      qty: oi.quantity,
      notes: oi.notes || '',
      dbItemId: oi.id
    }));
    renderCart();
    showToast(`Mesa ${tableName} cargada`, 'info');
  } else {
    APP_STATE.cart = [];
    APP_STATE.discount = { type: 'none', value: 0 };
    renderCart();
  }

  mesasRefreshInterval = setInterval(loadMesasData, 30000);
}

function showAddTableForm() {
  const zones = APP_STATE.zones || [];
  const zoneOptions = zones.map(z => `<option value="${z.id}" ${mesasZoneFilter===z.id?'selected':''}>${z.name}</option>`).join('');
  showGenericModal(`
    <h3>+ Agregar Mesa</h3>
    <div class="form-row">
      <label>Sector / Zona</label>
      <select id="new-table-zone">${zoneOptions}</select>
    </div>
    <div class="form-row">
      <label>Nombre de la Mesa</label>
      <input type="text" id="new-table-name" placeholder="Ej: Mesa 15" />
    </div>
    <div class="form-row">
      <label>Capacidad (personas)</label>
      <input type="number" id="new-table-cap" value="4" min="1" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveNewTable()">Guardar</button>
    </div>
  `);
}

async function saveNewTable() {
  const zoneId = document.getElementById('new-table-zone').value;
  const name = document.getElementById('new-table-name').value.trim();
  const capacity = parseInt(document.getElementById('new-table-cap').value) || 4;

  if (!name || !zoneId) {
    showToast('Falta nombre o sector', 'error');
    return;
  }

  try {
    await dbCreateTable({ zone_id: zoneId, name: name, capacity: capacity });
    closeGenericModal();
    showToast('Mesa agregada', 'success');
    loadMesasData(); // reload
  } catch (e) {
    showToast('Error al crear mesa: ' + e.message, 'error');
  }
}
