// ============================
// modules/clientes.js
// ============================
async function renderClientes(container) {
  container.innerHTML = `
    <div class="module-header">
      <h1>Clientes</h1>
    </div>
    <div class="data-container">
      <div class="data-toolbar">
        <input class="filter-input" placeholder="Buscar cliente..." oninput="filterClientesLocal(this.value)" />
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Registro</th><th>Pedidos</th></tr></thead>
          <tbody id="clientes-tbody"><tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>`;
  
  await loadClientes();
}

async function loadClientes() {
  try {
    const customers = await dbGetCustomers();
    const tbody = document.getElementById('clientes-tbody');
    if (tbody) {
      tbody.innerHTML = customers.length
        ? customers.map(c => `<tr>
            <td style="font-weight:600">${c.name || c.email?.split('@')[0] || '-'}</td>
            <td style="color:var(--text-secondary)">${c.email || '-'}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.created_at ? fmtDate(c.created_at) : '-'}</td>
            <td>-</td>
          </tr>`).join('')
        : `<tr><td colspan="5" style="text-align:center;padding:32px"><div class="empty-state"><span class="empty-icon">👥</span><p>Sin clientes registrados</p><p class="empty-hint">Los clientes se crean automáticamente al procesar delivery</p></div></td></tr>`;
    }
  } catch(e) { console.error(e); }
}

function filterClientesLocal(q) {
  document.querySelectorAll('#clientes-tbody tr').forEach(row => {
    row.style.display = !q || row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

// ============================
// modules/reportes.js
// ============================
async function renderReportes(container) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  
  container.innerHTML = `
    <div class="module-header">
      <h1>Reportes</h1>
    </div>
    <div class="data-container">
      <div class="data-toolbar">
        <input type="date" class="filter-date" id="r-from" value="${weekAgo}" onchange="loadReportes()" />
        <span style="color:var(--text-muted)">hasta</span>
        <input type="date" class="filter-date" id="r-to" value="${today}" onchange="loadReportes()" />
        <button class="btn-primary" onclick="loadReportes()">📊 Generar</button>
      </div>
      <div class="stats-grid" id="reportes-stats"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" id="reportes-detail"></div>
    </div>`;
  
  await loadReportes();
}

async function loadReportes() {
  const from = document.getElementById('r-from')?.value;
  const to = document.getElementById('r-to')?.value;
  
  try {
    const orders = await dbGetOrders({
      from: from + 'T00:00:00',
      to: to + 'T23:59:59',
      status: 'paid'
    });
    
    const total = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const avgTicket = orders.length ? total / orders.length : 0;
    const byType = orders.reduce((acc, o) => { acc[o.order_type] = (acc[o.order_type] || 0) + 1; return acc; }, {});
    
    const statsEl = document.getElementById('reportes-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-card"><div class="stat-label">Ventas Totales</div><div class="stat-value">${fmtMoney(total)}</div><div class="stat-sub">${from} → ${to}</div></div>
        <div class="stat-card"><div class="stat-label">Tickets Cerrados</div><div class="stat-value">${orders.length}</div></div>
        <div class="stat-card"><div class="stat-label">Ticket Promedio</div><div class="stat-value">${fmtMoney(avgTicket)}</div></div>
        <div class="stat-card"><div class="stat-label">Mesas</div><div class="stat-value">${byType['dine_in']||0}</div></div>
        <div class="stat-card"><div class="stat-label">Mostrador</div><div class="stat-value">${byType['takeaway']||0}</div></div>
        <div class="stat-card"><div class="stat-label">Delivery</div><div class="stat-value">${byType['delivery']||0}</div></div>`;
    }
  } catch(e) { console.error(e); }
}

// ============================
// modules/configuracion.js
// ============================
async function renderConfiguracion(container) {
  container.innerHTML = `
    <div class="module-header"><h1>Configuración</h1></div>
    <div class="data-container">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        
        <div class="caja-card">
          <div class="caja-card-header ingresos">🍽️ Categorías</div>
          <div style="padding:12px">
            <button class="btn-primary" onclick="showCatForm()" style="margin-bottom:12px;width:100%">+ Nueva Categoría</button>
            <div id="cats-list"></div>
          </div>
        </div>
        
        <div class="caja-card">
          <div class="caja-card-header" style="background:#f0f4ff;color:#1d4ed8">🪑 Sectores y Mesas</div>
          <div style="padding:12px">
            <div id="zones-list"></div>
          </div>
        </div>
        
        <div class="caja-card">
          <div class="caja-card-header" style="background:#f5f0ff;color:#7c3aed">🔐 Seguridad</div>
          <div style="padding:12px">
            <div class="form-row">
              <label>PIN Administrador (actual: 1234)</label>
              <input type="password" id="new-pin" placeholder="Nuevo PIN (4-6 dígitos)" />
            </div>
            <button class="btn-primary" onclick="showToast('PIN no modificable en modo demo','info')" style="width:100%">Cambiar PIN</button>
          </div>
        </div>

        <div class="caja-card">
          <div class="caja-card-header" style="background:#fff0f0;color:#dc2626">ℹ️ Sistema</div>
          <div style="padding:12px;font-size:13px;color:var(--text-secondary);line-height:1.8">
            <div><strong>Versión:</strong> 1.0.0</div>
            <div><strong>Proyecto:</strong> StackHard POS</div>
            <div><strong>DB:</strong> Supabase (mylukzjucxgjjmvbteuf)</div>
            <div><strong>Tenant:</strong> ${APP_STATE.tenantId?.slice(0,8)}...</div>
          </div>
        </div>

      </div>
    </div>`;
  
  await loadConfigData();
}

async function loadConfigData() {
  try {
    const cats = await dbGetCategories();
    const zones = await dbGetZones();
    
    const catsEl = document.getElementById('cats-list');
    if (catsEl) {
      catsEl.innerHTML = cats.map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:13px">${CAT_ICONS?.[c.name]||'🍴'} ${c.name}</span>
          <button class="btn-icon del" onclick="deleteConfig('cat','${c.id}','${c.name.replace(/'/g,"\\'")}')">🗑️</button>
        </div>`).join('');
    }
    
    const zonesEl = document.getElementById('zones-list');
    if (zonesEl) {
      zonesEl.innerHTML = zones.map(z => `
        <div style="font-size:13px;padding:6px 0;border-bottom:1px solid var(--border)">🏠 ${z.name}</div>`).join('');
    }
  } catch(e) { console.error(e); }
}

function showCatForm() {
  showGenericModal(`
    <h3>Nueva Categoría</h3>
    <div class="form-row"><label>Nombre</label><input id="cat-name" placeholder="Ej: Bebidas" /></div>
    <div class="form-row"><label>Descripción</label><input id="cat-desc" placeholder="Descripción opcional" /></div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveCatConfig()">Guardar</button>
    </div>`);
}

async function saveCatConfig() {
  const name = document.getElementById('cat-name').value.trim();
  if (!name) { showToast('Ingresá un nombre', 'error'); return; }
  try {
    await dbSaveCategory({ name, description: document.getElementById('cat-desc').value, is_active: true });
    APP_STATE.categories = await dbGetCategories();
    renderCategoryGrid();
    closeGenericModal();
    showToast('Categoría creada', 'success');
    await loadConfigData();
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteConfig(type, id, name) {
  if (!confirm(`¿Eliminar "${name}"?`)) return;
  try {
    if (type === 'cat') await dbDeleteCategory(id);
    APP_STATE.categories = await dbGetCategories();
    renderCategoryGrid();
    showToast('Eliminado', 'success');
    await loadConfigData();
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}
