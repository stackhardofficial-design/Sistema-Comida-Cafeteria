// ============================
// modules/delivery.js - Kanban drag & drop
// ============================
let draggedCard = null;

async function renderDelivery(container) {
  container.innerHTML = `
    <div class="module-header">
      <h1>Delivery</h1>
      <button class="btn-new-sale" onclick="newDeliverySale()">＋ NUEVO PEDIDO</button>
    </div>
    <div class="delivery-container">
      <div class="delivery-board" id="delivery-board">
        ${['pendiente','en-viaje','entregado'].map(col =>
          `<div class="kanban-col ${col}">
            <div class="kanban-col-header">
              ${{pendiente:'🕐 Pendientes',  'en-viaje':'🛵 En Viaje', entregado:'✅ Entregados'}[col]}
              <span class="count-badge" id="count-${col}">0</span>
            </div>
            <div class="kanban-cards" id="col-${col}" 
              ondragover="onDragOver(event)" ondragleave="onDragLeave(event)" ondrop="onDrop(event,'${col}')">
            </div>
          </div>`
        ).join('')}
      </div>
    </div>`;
  
  await loadDeliveryData();
}

async function loadDeliveryData() {
  try {
    const orders = await dbGetDeliveryOrders();
    const colMap = { open: 'pendiente', in_transit: 'en-viaje', delivered: 'entregado', paid: 'entregado' };
    
    ['pendiente','en-viaje','entregado'].forEach(col => {
      const el = document.getElementById(`col-${col}`);
      if (el) el.innerHTML = '';
    });

    let counts = { pendiente: 0, 'en-viaje': 0, entregado: 0 };
    
    orders.forEach(order => {
      const col = colMap[order.status] || 'pendiente';
      counts[col]++;
      const el = document.getElementById(`col-${col}`);
      if (el) el.insertAdjacentHTML('beforeend', deliveryCardHtml(order, col));
    });

    Object.entries(counts).forEach(([col, n]) => {
      const el = document.getElementById(`count-${col}`);
      if (el) el.textContent = n;
    });

    // Attach drag events
    document.querySelectorAll('.delivery-card').forEach(card => {
      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragend', onDragEnd);
    });
  } catch(e) { console.error(e); }
}

function deliveryCardHtml(order, col) {
  const addr = order.delivery_addresses;
  return `<div class="delivery-card" draggable="true" data-order-id="${order.id}" onclick="openDeliveryOrder('${order.id}')">
    <div class="delivery-card-name">${order.customer_name || 'Cliente'}</div>
    <div class="delivery-card-info">
      📍 ${addr?.street || order.notes || 'Sin dirección'}<br>
      📞 ${order.customer_phone || '-'}<br>
      🕐 ${fmtDate(order.created_at)}
    </div>
    <div class="delivery-card-total">${fmtMoney(order.total_amount)}</div>
    ${col !== 'entregado' ? `<div style="margin-top:6px;display:flex;gap:4px">
      ${col === 'pendiente' ? `<button class="btn-primary" style="font-size:11px;padding:4px 8px" onclick="event.stopPropagation();moveDelivery('${order.id}','in_transit')">→ En Viaje</button>` : ''}
      ${col === 'en-viaje' ? `<button class="btn-primary" style="font-size:11px;padding:4px 8px;background:var(--green)" onclick="event.stopPropagation();moveDelivery('${order.id}','delivered')">✓ Entregar</button>` : ''}
    </div>` : ''}
  </div>`;
}

// Drag & Drop
function onDragStart(e) {
  draggedCard = e.currentTarget;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.orderId);
}
function onDragEnd(e) { e.currentTarget.classList.remove('dragging'); }
function onDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
async function onDrop(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const orderId = e.dataTransfer.getData('text/plain');
  const statusMap = { pendiente: 'open', 'en-viaje': 'in_transit', entregado: 'delivered' };
  await dbUpdateOrder(orderId, { status: statusMap[col] });
  await loadDeliveryData();
}

async function moveDelivery(orderId, status) {
  await dbUpdateOrder(orderId, { status });
  await loadDeliveryData();
  showToast('Estado actualizado', 'success');
}

function newDeliverySale() {
  showGenericModal(`
    <h3>Nuevo Pedido Delivery</h3>
    <div class="form-row"><label>Nombre Cliente</label><input id="d-name" placeholder="Juan García" /></div>
    <div class="form-row"><label>Teléfono</label><input id="d-phone" placeholder="11-1234-5678" /></div>
    <div class="form-row"><label>Dirección</label><input id="d-addr" placeholder="Av. Corrientes 1234" /></div>
    <div class="form-actions">
      <button class="btn-secondary btn-primary" onclick="closeGenericModal()">Cancelar</button>
      <button class="btn-primary" onclick="createDeliveryOrder()">Crear Pedido</button>
    </div>`);
}

async function createDeliveryOrder() {
  const name = document.getElementById('d-name').value.trim();
  const phone = document.getElementById('d-phone').value.trim();
  const addr = document.getElementById('d-addr').value.trim();
  if (!name) { showToast('Ingresa el nombre del cliente', 'error'); return; }
  
  try {
    const order = await dbCreateOrder('delivery', null, null, name, phone);
    // Save address if provided
    if (addr) {
      await sb.from('delivery_addresses').insert({
        tenant_id: APP_STATE.tenantId, order_id: order.id,
        street: addr, is_active: true
      });
    }
    APP_STATE.currentContext = { type: 'delivery', orderId: order.id };
    APP_STATE.cart = [];
    renderCart();
    updateComandaHeader(`Delivery: ${name}`, `📍 ${addr || 'Sin dirección'}`);
    closeGenericModal();
    showToast('Pedido delivery creado', 'success');
    await loadDeliveryData();
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function openDeliveryOrder(orderId) {
  try {
    const order = await dbGetOrder(orderId);
    if (!order) return;
    APP_STATE.currentContext = { type: 'delivery', orderId: orderId };
    APP_STATE.cart = (order.order_items || []).map(oi => ({
      id: Date.now() + Math.random(), product: oi.products,
      qty: oi.quantity, notes: oi.notes || '', dbItemId: oi.id
    }));
    renderCart();
    updateComandaHeader(`Delivery: ${order.customer_name}`, `📞 ${order.customer_phone || '-'}`);
  } catch(e) { showToast('Error al cargar pedido', 'error'); }
}
