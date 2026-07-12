// ============================
// modules/comanda.js - Right panel (cart/order)
// ============================

const CAT_ICONS = {
  'Bebidas': '🥤', 'Entradas': '🥗', 'Principales': '🍽️',
  'Postres': '🍰', 'Cafetería': '☕', 'default': '🍴'
};

function initComanda() {
  renderCategoryGrid();
}

function updateComandaHeader(title, context) {
  document.getElementById('comanda-title').textContent = title;
  document.getElementById('comanda-context').textContent = context;
}

function renderCategoryGrid() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = APP_STATE.categories.map(cat =>
    `<button class="cat-btn" onclick="showProductsByCategory('${cat.id}', '${cat.name.replace(/'/g,"\\'")}')">
      <span class="cat-icon">${CAT_ICONS[cat.name] || CAT_ICONS['default']}</span>
      <span>${cat.name}</span>
    </button>`
  ).join('');
}

async function showProductsByCategory(catId, catName) {
  document.getElementById('category-grid').classList.add('hidden');
  document.getElementById('products-grid').classList.remove('hidden');
  const prods = await dbGetProducts(catId);
  document.getElementById('products-list').innerHTML = prods.length
    ? prods.map(p =>
        `<button class="product-btn" onclick="addToCart('${p.id}')">
          <span class="prod-name">${p.name}</span>
          <span class="prod-price">${fmtMoney(p.price)}</span>
        </button>`
      ).join('')
    : '<p style="text-align:center;color:var(--text-muted);padding:16px">Sin productos</p>';
  
  // Store displayed products for cart lookup
  APP_STATE._displayedProducts = prods;
}

function showCategories() {
  document.getElementById('category-grid').classList.remove('hidden');
  document.getElementById('products-grid').classList.add('hidden');
}

async function searchProducts(query) {
  if (!query.trim()) {
    showCategories();
    return;
  }
  const q = query.toLowerCase();
  const results = APP_STATE.products.filter(p =>
    p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
  );
  document.getElementById('category-grid').classList.add('hidden');
  document.getElementById('products-grid').classList.remove('hidden');
  document.getElementById('products-list').innerHTML = results.length
    ? results.map(p =>
        `<button class="product-btn" onclick="addToCart('${p.id}')">
          <span class="prod-name">${p.name}</span>
          <span class="prod-price">${fmtMoney(p.price)}</span>
        </button>`
      ).join('')
    : '<p style="text-align:center;color:var(--text-muted);padding:16px">Sin resultados</p>';
  APP_STATE._displayedProducts = results;
}

// ===== CART =====
function addToCart(productId) {
  const prod = (APP_STATE._displayedProducts || APP_STATE.products).find(p => p.id === productId)
    || APP_STATE.products.find(p => p.id === productId);
  if (!prod) return;

  if (!APP_STATE.currentContext) {
    showToast('Selecciona una mesa, mostrador o delivery primero', 'error');
    return;
  }

  const existing = APP_STATE.cart.find(i => i.product.id === productId && !i.notes);
  if (existing) {
    existing.qty += 1;
  } else {
    APP_STATE.cart.push({ product: prod, qty: 1, notes: '', id: Date.now() });
  }
  renderCart();
  showToast(`${prod.name} agregado`, 'success');
}

function removeFromCart(itemId) {
  APP_STATE.cart = APP_STATE.cart.filter(i => i.id !== itemId);
  renderCart();
}

function updateQty(itemId, delta) {
  const item = APP_STATE.cart.find(i => i.id === itemId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart();
}

function toggleNoteInput(itemId) {
  const noteRow = document.getElementById(`note-${itemId}`);
  if (noteRow) noteRow.classList.toggle('hidden');
  else {
    const row = document.querySelector(`[data-item="${itemId}"]`);
    if (row) {
      const item = APP_STATE.cart.find(i => i.id === itemId);
      const noteDiv = document.createElement('div');
      noteDiv.id = `note-${itemId}`;
      noteDiv.className = 'note-input-row';
      noteDiv.innerHTML = `<input type="text" placeholder="Nota de cocina (ej: sin sal)" value="${item.notes || ''}" 
        oninput="setNote(${itemId}, this.value)" />`;
      row.after(noteDiv);
    }
  }
}

function setNote(itemId, val) {
  const item = APP_STATE.cart.find(i => i.id === itemId);
  if (item) item.notes = val;
}

function calcSubtotal() {
  return APP_STATE.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
}

function calcDiscount() {
  const sub = calcSubtotal();
  const d = APP_STATE.discount;
  if (d.type === 'percent') return sub * d.value / 100;
  if (d.type === 'fixed') return Math.min(d.value, sub);
  return 0;
}

function calcTotal() {
  return Math.max(0, calcSubtotal() - calcDiscount());
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const sub = calcSubtotal();
  const disc = calcDiscount();
  const total = calcTotal();

  if (APP_STATE.cart.length === 0) {
    cartEmpty.classList.remove('hidden');
    cartItems.innerHTML = '';
  } else {
    cartEmpty.classList.add('hidden');
    cartItems.innerHTML = APP_STATE.cart.map(item =>
      `<div class="cart-item" data-item="${item.id}">
        <div style="flex:1;min-width:0">
          <div class="cart-item-name" onclick="toggleNoteInput(${item.id})" title="Click para agregar nota">
            ${item.product.name}
          </div>
          <div class="cart-item-price">${fmtMoney(item.product.price)} c/u</div>
          ${item.notes ? `<div class="cart-item-note">📝 ${item.notes}</div>` : ''}
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
        <span style="font-size:13px;font-weight:700;min-width:64px;text-align:right">${fmtMoney(item.product.price * item.qty)}</span>
        <button class="btn-remove-item" onclick="removeFromCart(${item.id})" title="Eliminar">🗑️</button>
      </div>`
    ).join('');
  }

  document.getElementById('subtotal-display').textContent = fmtMoney(sub);
  const discRow = document.getElementById('discount-row');
  if (disc > 0) {
    discRow.style.display = 'flex';
    document.getElementById('discount-display').textContent = `-${fmtMoney(disc)}`;
  } else {
    discRow.style.display = 'none';
  }
  document.getElementById('total-display').textContent = fmtMoney(total);

  // Enable/disable buttons
  const hasItems = APP_STATE.cart.length > 0;
  ['btn-cobrar','btn-kitchen','btn-discount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !hasItems;
  });
}

async function sendToKitchen() {
  if (APP_STATE.cart.length === 0) { showToast('Carrito vacío', 'error'); return; }
  if (!APP_STATE.currentContext) { showToast('Selecciona contexto primero', 'error'); return; }
  
  try {
    let orderId = APP_STATE.currentContext.orderId;
    if (!orderId) {
      const type = APP_STATE.currentContext.type === 'mesa' ? 'dine_in' : 'takeaway';
      const order = await dbCreateOrder(type, APP_STATE.currentContext.tableId, APP_STATE.currentContext.tableDbId);
      orderId = order.id;
      APP_STATE.currentContext.orderId = orderId;
      
      // Update table status to occupied if mesa
      if (APP_STATE.currentContext.type === 'mesa' && APP_STATE.currentContext.tableDbId) {
        await dbUpdateTable(APP_STATE.currentContext.tableDbId, { status: 'occupied', current_order_id: orderId });
      }
    }
    
    // Add items to DB
    for (const item of APP_STATE.cart) {
      await dbAddItem(orderId, item.product, item.qty, item.notes);
    }
    
    showToast('🍳 Pedido enviado a cocina', 'success');
    APP_STATE.cart = [];
    renderCart();
    navigate(currentModule);
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
  }
}
