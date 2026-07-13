// ============================
// db.js - Supabase client layer
// ============================
const SUPABASE_URL = 'https://mylukzjucxgjjmvbteuf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bHVremp1Y3hnamptdmJ0ZXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTgzMzQsImV4cCI6MjA5OTEzNDMzNH0.82zOrsjibu3S898QJAv2mY41hgXe399cYVgBCLXVHm0';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// State
const APP_STATE = {
  tenantId: null,
  user: null,
  cart: [],
  discount: { type: 'none', value: 0 },
  currentContext: null, // {type:'mesa'|'mostrador'|'delivery', id, tableId, orderId}
  pendingPinAction: null,
  products: [],
  categories: [],
  zones: [],
  tables: [],
};

const ADMIN_PIN = '1234'; // Simple PIN for demo

// ===== AUTH =====
async function dbLogin(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function dbLogout() {
  await sb.auth.signOut();
}

async function dbGetSession() {
  const { data } = await sb.auth.getSession();
  return data?.session;
}

// ===== TENANT =====
async function dbGetTenant() {
  const { data } = await sb.from('tenants').select('*').limit(1).single();
  return data;
}

// ===== ZONES =====
async function dbGetZones() {
  const { data } = await sb.from('restaurant_zones')
    .select('*')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

async function dbCreateZone(name) {
  const { data, error } = await sb.from('restaurant_zones').insert({
    tenant_id: APP_STATE.tenantId,
    name: name,
    is_active: true
  }).select().single();
  if (error) throw error;
  return data;
}

// ===== TABLES =====
async function dbGetTables(zoneId = null) {
  let q = sb.from('restaurant_tables')
    .select('*, orders(id, status, total_amount, created_at)')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('is_active', true)
    .order('name');
  if (zoneId) q = q.eq('zone_id', zoneId);
  const { data } = await q;
  return data || [];
}

async function dbUpdateTable(tableId, updates) {
  const { data, error } = await sb.from('restaurant_tables').update(updates).eq('id', tableId).select().single();
  if (error) throw error;
  return data;
}

async function dbCreateTable(payload) {
  const { data, error } = await sb.from('restaurant_tables').insert({
    ...payload,
    tenant_id: APP_STATE.tenantId,
    status: 'free',
    is_active: true
  }).select().single();
  if (error) throw error;
  return data;
}

// ===== CATEGORIES =====
async function dbGetCategories() {
  const { data } = await sb.from('categories')
    .select('*')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

async function dbSaveCategory(cat, id = null) {
  const payload = { ...cat, tenant_id: APP_STATE.tenantId };
  if (id) {
    const { data, error } = await sb.from('categories').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await sb.from('categories').insert(payload).select().single();
    if (error) throw error;
    return data;
  }
}

async function dbDeleteCategory(id) {
  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ===== PRODUCTS =====
async function dbGetProducts(categoryId = null) {
  let q = sb.from('products')
    .select('*, categories(name)')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('is_active', true)
    .order('name');
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data } = await q;
  return data || [];
}

async function dbGetAllProducts() {
  const { data } = await sb.from('products')
    .select('*, categories(name)')
    .eq('tenant_id', APP_STATE.tenantId)
    .order('name');
  return data || [];
}

async function dbSaveProduct(prod, id = null) {
  const payload = { ...prod, tenant_id: APP_STATE.tenantId };
  if (id) {
    const { data, error } = await sb.from('products').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await sb.from('products').insert(payload).select().single();
    if (error) throw error;
    return data;
  }
}

async function dbDeleteProduct(id) {
  const { error } = await sb.from('products').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

async function dbUpdateStock(productId, qty) {
  const { error } = await sb.from('products').update({ stock_quantity: qty }).eq('id', productId);
  if (error) throw error;
}

// ===== ORDERS =====
async function dbCreateOrder(type, tableId = null, tableDbId = null, customerName = null, phone = null) {
  const payload = {
    tenant_id: APP_STATE.tenantId,
    order_type: type, // 'dine_in' | 'takeaway' | 'delivery'
    status: 'open',
    total_amount: 0,
    discount_amount: 0,
    tax_amount: 0,
  };
  if (tableId) payload.table_id = tableId;
  if (tableDbId) payload.table_db_id = tableDbId;
  if (customerName) payload.customer_name = customerName;
  if (phone) payload.customer_phone = phone;

  const { data, error } = await sb.from('orders').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function dbGetOrder(orderId) {
  const { data } = await sb.from('orders')
    .select('*, order_items(*, products(name, price))')
    .eq('id', orderId)
    .single();
  return data;
}

async function dbGetOrders(filters = {}) {
  let q = sb.from('orders')
    .select('*, order_items(id)')
    .eq('tenant_id', APP_STATE.tenantId)
    .order('created_at', { ascending: false });
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.type) q = q.eq('order_type', filters.type);
  if (filters.from) q = q.gte('created_at', filters.from);
  if (filters.to) q = q.lte('created_at', filters.to);
  if (filters.limit) q = q.limit(filters.limit);
  const { data } = await q;
  return data || [];
}

async function dbUpdateOrder(orderId, updates) {
  const { data, error } = await sb.from('orders').update(updates).eq('id', orderId).select().single();
  if (error) throw error;
  return data;
}

async function dbDeleteOrder(orderId) {
  await sb.from('order_items').delete().eq('order_id', orderId);
  await sb.from('orders').delete().eq('id', orderId);
}

// ===== ORDER ITEMS =====
async function dbAddItem(orderId, product, qty = 1, notes = '') {
  // Check if item already exists
  const { data: existing } = await sb.from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('product_id', product.id)
    .eq('notes', notes || '')
    .single();

  if (existing) {
    const { data, error } = await sb.from('order_items')
      .update({ quantity: existing.quantity + qty, total_price: (existing.quantity + qty) * product.price })
      .eq('id', existing.id).select().single();
    if (error) throw error;
  } else {
    const { error } = await sb.from('order_items').insert({
      tenant_id: APP_STATE.tenantId,
      order_id: orderId,
      product_id: product.id,
      quantity: qty,
      unit_price: product.price,
      total_price: product.price * qty,
      notes: notes || ''
    });
    if (error) throw error;
  }
  await dbRecalcOrder(orderId);
}

async function dbUpdateItem(itemId, updates) {
  const { data, error } = await sb.from('order_items').update(updates).eq('id', itemId).select().single();
  if (error) throw error;
  return data;
}

async function dbRemoveItem(itemId, orderId) {
  await sb.from('order_items').delete().eq('id', itemId);
  await dbRecalcOrder(orderId);
}

async function dbRecalcOrder(orderId) {
  const { data: items } = await sb.from('order_items').select('total_price').eq('order_id', orderId);
  const total = (items || []).reduce((s, i) => s + parseFloat(i.total_price), 0);
  await sb.from('orders').update({ total_amount: total }).eq('id', orderId);
}

// ===== PAYMENTS =====
async function dbCreatePayment(orderId, methods, cashSessionId = null) {
  const payloads = methods.map(m => ({
    tenant_id: APP_STATE.tenantId,
    order_id: orderId,
    cash_session_id: cashSessionId,
    payment_method: m.method,
    amount: m.amount,
    change_amount: m.change || 0,
  }));
  const { data, error } = await sb.from('payments').insert(payloads).select();
  if (error) throw error;
  return data;
}

// ===== CASH SESSIONS =====
async function dbGetOpenSession() {
  const { data } = await sb.from('cash_register_sessions')
    .select('*')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function dbOpenSession(openingAmount) {
  const { data, error } = await sb.from('cash_register_sessions').insert({
    tenant_id: APP_STATE.tenantId,
    opening_amount: openingAmount,
    status: 'open'
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbCloseSession(sessionId, closingAmount, expectedAmount) {
  const diff = closingAmount - expectedAmount;
  const { data, error } = await sb.from('cash_register_sessions').update({
    status: 'closed', closing_amount: closingAmount,
    expected_amount: expectedAmount, difference: diff, closed_at: new Date().toISOString()
  }).eq('id', sessionId).select().single();
  if (error) throw error;
  return data;
}

// ===== CUSTOMERS =====
async function dbGetCustomers(search = '') {
  let q = sb.from('users').select('*').eq('tenant_id', APP_STATE.tenantId).order('created_at', { ascending: false });
  // if (search) q = q.ilike('name', `%${search}%`);
  const { data } = await q.limit(100);
  return data || [];
}

// ===== GASTOS (using activity_log as workaround if no expenses table) =====
async function dbGetGastos(filters = {}) {
  // We'll use a simple structure stored in a meta table or simulate with orders of type 'expense'
  // For now just return empty - can be expanded
  return [];
}

// ===== DELIVERY =====
async function dbGetDeliveryOrders() {
  const { data } = await sb.from('orders')
    .select('*, delivery_addresses(*), delivery_assignments(*)')
    .eq('tenant_id', APP_STATE.tenantId)
    .eq('order_type', 'delivery')
    .in('status', ['open', 'in_transit', 'delivered'])
    .order('created_at', { ascending: false });
  return data || [];
}

// ===== HELPERS =====
function fmtMoney(n) {
  return '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d) {
  return new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtTimer(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}
