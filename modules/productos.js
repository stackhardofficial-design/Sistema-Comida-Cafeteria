// ============================
// modules/productos.js
// ============================
async function renderProductos(container) {
  container.innerHTML = `
    <div class="module-header">
      <h1>Productos</h1>
      <button class="btn-primary" onclick="showProductForm()">+ Nuevo Producto</button>
    </div>
    <div class="data-container">
      <div class="data-toolbar">
        <input class="filter-input" placeholder="Buscar por nombre o código..." oninput="filterProductosLocal(this.value)" />
        <select class="filter-date" id="prod-cat-filter" onchange="filterProductosLocal(document.querySelector('.filter-input').value)">
          <option value="">Todas las categorías</option>
        </select>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>
            <th>Código</th><th>Nombre</th><th>Categoría</th>
            <th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody id="prods-tbody"><tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Cargando...</td></tr></tbody>
        </table>
      </div>
    </div>`;
  
  await loadProductos();
}

async function loadProductos() {
  try {
    const [prods, cats] = await Promise.all([dbGetAllProducts(), dbGetCategories()]);
    APP_STATE.categories = cats;
    
    // Populate category filter
    const catFilter = document.getElementById('prod-cat-filter');
    if (catFilter) {
      catFilter.innerHTML = '<option value="">Todas las categorías</option>' +
        cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    const tbody = document.getElementById('prods-tbody');
    if (tbody) {
      tbody.innerHTML = prods.length
        ? prods.map(p => `<tr data-cat="${p.category_id}">
            <td><code style="font-size:11px">${p.sku || '-'}</code></td>
            <td style="font-weight:600">${p.name}</td>
            <td>${p.categories?.name || '-'}</td>
            <td style="font-weight:700">${fmtMoney(p.price)}</td>
            <td>
              <span style="${(p.stock_quantity||0) < 10 ? 'color:var(--red);font-weight:700' : ''}">
                ${p.stock_quantity ?? '∞'}
              </span>
            </td>
            <td><span class="badge ${p.is_active ? 'badge-green' : 'badge-red'}">${p.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <button class="btn-icon edit" onclick="editProducto('${p.id}')" title="Editar">✏️</button>
              <button class="btn-icon del" onclick="deleteProducto('${p.id}', '${p.name.replace(/'/g,"\\'")}')" title="Eliminar">🗑️</button>
            </td>
          </tr>`).join('')
        : `<tr><td colspan="7" style="text-align:center;padding:32px"><div class="empty-state"><span class="empty-icon">📦</span><p>Sin productos</p></div></td></tr>`;
    }
  } catch(e) { console.error(e); }
}

function filterProductosLocal(q) {
  const catId = document.getElementById('prod-cat-filter')?.value;
  document.querySelectorAll('#prods-tbody tr').forEach(row => {
    const matchQ = !q || row.textContent.toLowerCase().includes(q.toLowerCase());
    const matchCat = !catId || row.dataset.cat === catId;
    row.style.display = matchQ && matchCat ? '' : 'none';
  });
}

async function showProductForm(prodId = null) {
  const cats = APP_STATE.categories.length ? APP_STATE.categories : await dbGetCategories();
  let prod = null;
  if (prodId) {
    const { data } = await sb.from('products').select('*').eq('id', prodId).single();
    prod = data;
  }
  
  showGenericModal(`
    <h3>${prod ? 'Editar' : 'Nuevo'} Producto</h3>
    <div class="form-grid-2">
      <div class="form-row"><label>Nombre *</label><input id="p-name" value="${prod?.name||''}" placeholder="Nombre del producto" /></div>
      <div class="form-row"><label>Código (SKU)</label><input id="p-sku" value="${prod?.sku||''}" placeholder="BEB001" /></div>
      <div class="form-row"><label>Categoría *</label>
        <select id="p-cat">
          ${cats.map(c => `<option value="${c.id}" ${prod?.category_id===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><label>Precio *</label><input id="p-price" type="number" value="${prod?.price||''}" placeholder="0.00" /></div>
      <div class="form-row"><label>Stock</label><input id="p-stock" type="number" value="${prod?.stock_quantity??100}" placeholder="100" /></div>
      <div class="form-row"><label>Estado</label>
        <select id="p-active"><option value="true" ${prod?.is_active!==false?'selected':''}>Activo</option><option value="false" ${prod?.is_active===false?'selected':''}>Inactivo</option></select>
      </div>
    </div>
    <div class="form-row"><label>Descripción</label><textarea id="p-desc" placeholder="Descripción del producto...">${prod?.description||''}</textarea></div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveProducto('${prodId||''}')">Guardar</button>
    </div>`);
}

async function editProducto(prodId) { await showProductForm(prodId); }

async function saveProducto(prodId) {
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  const catId = document.getElementById('p-cat').value;
  if (!name || !price || !catId) { showToast('Completá nombre, categoría y precio', 'error'); return; }
  
  try {
    await dbSaveProduct({
      name, sku: document.getElementById('p-sku').value,
      category_id: catId, price,
      stock_quantity: parseInt(document.getElementById('p-stock').value) || 0,
      description: document.getElementById('p-desc').value,
      is_active: document.getElementById('p-active').value === 'true'
    }, prodId || null);
    
    // Refresh products in state
    APP_STATE.products = await dbGetProducts();
    closeGenericModal();
    showToast('Producto guardado', 'success');
    await loadProductos();
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function deleteProducto(prodId, name) {
  if (!confirm(`¿Eliminar "${name}"?`)) return;
  showPinModal(async () => {
    await dbDeleteProduct(prodId);
    APP_STATE.products = await dbGetProducts();
    showToast('Producto eliminado', 'success');
    await loadProductos();
  });
}
