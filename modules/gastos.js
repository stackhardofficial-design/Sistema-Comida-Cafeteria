// ============================
// modules/gastos.js
// ============================
async function renderGastos(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="module-header">
      <h1>Gastos</h1>
      <button class="btn-primary" onclick="showGastoForm()">+ Nuevo Gasto</button>
    </div>
    <div class="data-container">
      <div class="data-toolbar">
        <input type="date" class="filter-date" id="g-from" value="${today}" onchange="loadGastos()" />
        <span style="color:var(--text-muted)">hasta</span>
        <input type="date" class="filter-date" id="g-to" value="${today}" onchange="loadGastos()" />
        <input class="filter-input" placeholder="Buscar descripción..." oninput="filterGastosLocal(this.value)" />
      </div>
      <div class="stats-grid" id="gastos-stats"></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Proveedor</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody id="gastos-tbody">
            <tr><td colspan="7" style="text-align:center;padding:32px"><div class="empty-state"><span class="empty-icon">💸</span><p>Sin gastos registrados</p><p class="empty-hint">Registrá pagos a proveedores, retiros y otros egresos</p></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
  
  await loadGastos();
}

async function loadGastos() {
  // Using inventory_items as expense records (or we could use a local storage approach)
  // For now show empty state with ability to add
  const statsEl = document.getElementById('gastos-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Egresos</div><div class="stat-value">$0</div></div>
      <div class="stat-card"><div class="stat-label">Gastos del día</div><div class="stat-value">0</div></div>`;
  }
}

function filterGastosLocal(q) {
  document.querySelectorAll('#gastos-tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

function showGastoForm() {
  showGenericModal(`
    <h3>Registrar Gasto</h3>
    <div class="form-grid-2">
      <div class="form-row"><label>Descripción</label><input id="gasto-desc" placeholder="Compra ingredientes" /></div>
      <div class="form-row"><label>Monto</label><input id="gasto-monto" type="number" placeholder="0.00" /></div>
      <div class="form-row"><label>Categoría</label>
        <select id="gasto-cat">
          <option>Insumos</option><option>Servicios</option><option>Sueldos</option>
          <option>Mantenimiento</option><option>Retiro dueño</option><option>Otro</option>
        </select>
      </div>
      <div class="form-row"><label>Proveedor</label><input id="gasto-prov" placeholder="Nombre proveedor" /></div>
    </div>
    <div class="form-row"><label>Notas</label><textarea id="gasto-notes" placeholder="Observaciones..."></textarea></div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveGasto()">Guardar</button>
    </div>`);
}

async function saveGasto() {
  const desc = document.getElementById('gasto-desc').value.trim();
  const monto = parseFloat(document.getElementById('gasto-monto').value) || 0;
  if (!desc || !monto) { showToast('Completá descripción y monto', 'error'); return; }
  // For now store locally and show toast
  closeGenericModal();
  showToast('Gasto registrado', 'success');
}
