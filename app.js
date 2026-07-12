// ============================
// app.js - Main application controller
// ============================

let currentModule = 'mesas';
let clockInterval = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const session = await dbGetSession();
  if (session) {
    await initApp(session);
  }
  // else: stay on login screen
});

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  btn.textContent = 'Ingresando...';
  btn.disabled = true;
  try {
    const data = await dbLogin(email, password);
    await initApp(data.session);
  } catch(e) {
    errEl.textContent = 'Credenciales incorrectas. Verificá email y contraseña.';
    errEl.classList.remove('hidden');
  } finally {
    btn.textContent = 'Iniciar Sesión';
    btn.disabled = false;
  }
}

async function initApp(session) {
  APP_STATE.user = session?.user;
  
  // Load tenant
  const tenant = await dbGetTenant();
  if (tenant) APP_STATE.tenantId = tenant.id;

  // Show app
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Set user display
  const meta = session?.user?.user_metadata;
  document.getElementById('user-display-name').textContent = meta?.full_name || session?.user?.email?.split('@')[0] || 'Admin';
  document.getElementById('user-display-role').textContent = meta?.role || 'Administrador';

  // Start clock
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  // Load categories and products into state
  APP_STATE.categories = await dbGetCategories();
  APP_STATE.products = await dbGetProducts();

  // Init comanda
  initComanda();

  // Navigate to first module
  navigate('mesas');
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.getElementById('user-clock');
  if (el) el.textContent = timeStr;
}

async function handleLogout() {
  clearInterval(clockInterval);
  await dbLogout();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  APP_STATE.cart = [];
  APP_STATE.currentContext = null;
}

// ===== NAVIGATION =====
function navigate(module) {
  currentModule = module;
  
  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${module}`);
  if (navEl) navEl.classList.add('active');

  // Show/hide comanda panel
  const comandaPanel = document.getElementById('comanda-panel');
  const showComanda = ['mesas', 'mostrador', 'delivery'].includes(module);
  comandaPanel.style.display = showComanda ? 'flex' : 'none';

  // Render module
  const workspace = document.getElementById('workspace');
  switch(module) {
    case 'mesas': renderMesas(workspace); break;
    case 'mostrador': renderMostrador(workspace); break;
    case 'delivery': renderDelivery(workspace); break;
    case 'ventas': renderVentas(workspace); break;
    case 'gastos': renderGastos(workspace); break;
    case 'caja': renderCaja(workspace); break;
    case 'clientes': renderClientes(workspace); break;
    case 'productos': renderProductos(workspace); break;
    case 'reportes': renderReportes(workspace); break;
    case 'configuracion': renderConfiguracion(workspace); break;
  }
}

// ===== PAYMENT MODAL =====
let selectedPayMethods = {};
function showPaymentModal() {
  if (APP_STATE.cart.length === 0) { showToast('El carrito está vacío', 'error'); return; }
  const total = calcTotal();
  
  // Populate items
  const list = document.getElementById('payment-items-list');
  list.innerHTML = APP_STATE.cart.map(item =>
    `<div class="payment-item-row">
      <span>${item.qty}x ${item.product.name}</span>
      <span>${fmtMoney(item.product.price * item.qty)}</span>
    </div>`
  ).join('');
  
  document.getElementById('payment-total-big').textContent = fmtMoney(total);
  selectedPayMethods = {};
  document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('selected'));
  document.getElementById('cash-section').classList.add('hidden');
  document.getElementById('cash-received').value = '';
  document.getElementById('change-amount').textContent = '$0';
  document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

function togglePayMethod(method) {
  const btn = document.getElementById(`pay-${method}`);
  if (selectedPayMethods[method]) {
    delete selectedPayMethods[method];
    btn.classList.remove('selected');
  } else {
    selectedPayMethods[method] = calcTotal();
    btn.classList.add('selected');
  }
  // Show cash section if efectivo selected
  const cashSec = document.getElementById('cash-section');
  cashSec.classList.toggle('hidden', !selectedPayMethods['efectivo']);
  
  // Update split info
  const methods = Object.keys(selectedPayMethods);
  const info = document.getElementById('payment-split-info');
  if (methods.length > 1) {
    info.textContent = `Pago mixto: ${methods.join(' + ')}`;
  } else {
    info.textContent = '';
  }
}

function calcChange() {
  const total = calcTotal();
  const received = parseFloat(document.getElementById('cash-received').value) || 0;
  const change = Math.max(0, received - total);
  document.getElementById('change-amount').textContent = fmtMoney(change);
}

async function closeSale() {
  if (Object.keys(selectedPayMethods).length === 0) {
    showToast('Selecciona al menos un medio de pago', 'error'); return;
  }
  const total = calcTotal();
  const btn = document.getElementById('btn-close-sale');
  btn.disabled = true; btn.textContent = 'Procesando...';
  
  try {
    let orderId = APP_STATE.currentContext?.orderId;
    
    // Create order if not exists
    if (!orderId) {
      const type = APP_STATE.currentContext?.type === 'delivery' ? 'delivery' : 
                   APP_STATE.currentContext?.type === 'mostrador' ? 'takeaway' : 'dine_in';
      const order = await dbCreateOrder(type, APP_STATE.currentContext?.tableId, APP_STATE.currentContext?.tableDbId);
      orderId = order.id;
      // Add all cart items
      for (const item of APP_STATE.cart) {
        await dbAddItem(orderId, item.product, item.qty, item.notes);
      }
    }

    // Apply discount
    if (APP_STATE.discount.value > 0) {
      const disc = APP_STATE.discount.type === 'percent' 
        ? (calcSubtotal() * APP_STATE.discount.value / 100)
        : APP_STATE.discount.value;
      await dbUpdateOrder(orderId, { discount_amount: disc, total_amount: total });
    }

    // Mark order as paid
    await dbUpdateOrder(orderId, { status: 'paid' });

    // Create payment records
    const session = await dbGetOpenSession();
    const cashReceived = parseFloat(document.getElementById('cash-received').value) || 0;
    const methods = Object.keys(selectedPayMethods).map(m => ({
      method: m,
      amount: m === 'efectivo' && Object.keys(selectedPayMethods).length === 1 ? total : (total / Object.keys(selectedPayMethods).length),
      change: m === 'efectivo' ? Math.max(0, cashReceived - total) : 0
    }));
    await dbCreatePayment(orderId, methods, session?.id);

    // Decrement stock
    for (const item of APP_STATE.cart) {
      if (item.product.stock_quantity !== null) {
        await dbUpdateStock(item.product.id, Math.max(0, (item.product.stock_quantity || 0) - item.qty));
      }
    }

    // Free table if mesa
    if (APP_STATE.currentContext?.type === 'mesa' && APP_STATE.currentContext?.tableDbId) {
      await dbUpdateTable(APP_STATE.currentContext.tableDbId, { status: 'free', current_order_id: null });
    }

    // Reset
    APP_STATE.cart = [];
    APP_STATE.discount = { type: 'none', value: 0 };
    APP_STATE.currentContext = null;
    renderCart();
    updateComandaHeader('Selecciona una mesa', '');
    
    closePaymentModal();
    showToast('✅ Venta cerrada con éxito', 'success');
    
    // Refresh current module
    navigate(currentModule);
  } catch(e) {
    console.error(e);
    showToast('Error al procesar el pago: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '✅ CERRAR VENTA';
  }
}

// ===== DISCOUNT MODAL =====
function showDiscountModal() {
  document.getElementById('discount-value').value = '';
  document.getElementById('discount-preview').textContent = 'Descuento: $0';
  document.getElementById('discount-modal').classList.remove('hidden');
}
function closeDiscountModal() { document.getElementById('discount-modal').classList.add('hidden'); }
function updateDiscountPreview() {
  const val = parseFloat(document.getElementById('discount-value').value) || 0;
  const type = document.querySelector('[name="discount-type"]:checked').value;
  const sub = calcSubtotal();
  const disc = type === 'percent' ? (sub * val / 100) : val;
  document.getElementById('discount-preview').textContent = `Descuento: ${fmtMoney(disc)} (Total: ${fmtMoney(sub - disc)})`;
}
function applyDiscount() {
  const val = parseFloat(document.getElementById('discount-value').value) || 0;
  const type = document.querySelector('[name="discount-type"]:checked').value;
  APP_STATE.discount = { type, value: val };
  closeDiscountModal();
  renderCart();
  showToast('Descuento aplicado', 'success');
}

// ===== PIN MODAL =====
function showPinModal(action) {
  APP_STATE.pendingPinAction = action;
  document.getElementById('admin-pin-input').value = '';
  document.getElementById('pin-error').classList.add('hidden');
  document.getElementById('pin-modal').classList.remove('hidden');
}
function closePinModal() { document.getElementById('pin-modal').classList.add('hidden'); }
function verifyPin() {
  const pin = document.getElementById('admin-pin-input').value;
  if (pin === ADMIN_PIN) {
    closePinModal();
    if (APP_STATE.pendingPinAction) APP_STATE.pendingPinAction();
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
  }
}

// ===== GENERIC MODAL =====
function showGenericModal(html) {
  document.getElementById('generic-modal-content').innerHTML = html;
  document.getElementById('generic-modal').classList.remove('hidden');
}
function closeGenericModal() { document.getElementById('generic-modal').classList.add('hidden'); }

// Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const loginScreen = document.getElementById('login-screen');
    if (!loginScreen.classList.contains('hidden')) handleLogin();
  }
});
