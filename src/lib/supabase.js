import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mylukzjucxgjjmvbteuf.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bHVremp1Y3hnamptdmJ0ZXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTgzMzQsImV4cCI6MjA5OTEzNDMzNH0.82zOrsjibu3S898QJAv2mY41hgXe399cYVgBCLXVHm0'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON)

// ===== AUTH =====
export const dbLogin = (email, password) =>
  sb.auth.signInWithPassword({ email, password })

export const dbLogout = () => sb.auth.signOut()
export const dbGetSession = () => sb.auth.getSession()

export async function dbGetUserInfo(userId) {
  const { data } = await sb.from('users').select('*').eq('id', userId).single()
  return data
}

// ===== TENANT =====
export async function dbGetTenant() {
  const { data } = await sb.from('tenants').select('*').limit(1).single()
  return data
}

// ===== ZONES =====
export async function dbGetZones(tenantId) {
  const { data } = await sb.from('restaurant_zones')
    .select('*').eq('tenant_id', tenantId).eq('is_active', true).order('sort_order')
  return data || []
}

export async function dbCreateZone(tenantId, name) {
  const { data, error } = await sb.from('restaurant_zones')
    .insert({ tenant_id: tenantId, name, is_active: true }).select().single()
  if (error) throw error
  return data
}

export async function dbUpdateZone(id, payload) {
  const { data, error } = await sb.from('restaurant_zones')
    .update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function dbDeleteZone(id) {
  const { error } = await sb.from('restaurant_zones').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

// ===== TABLES =====
export async function dbGetTables(tenantId, zoneId = null) {
  let q = sb.from('restaurant_tables')
    .select('*, orders(id, status, total_amount, created_at)')
    .eq('tenant_id', tenantId).eq('is_active', true).order('name')
  if (zoneId) q = q.eq('zone_id', zoneId)
  const { data } = await q
  return data || []
}

export async function dbCreateTable(tenantId, payload) {
  const { data, error } = await sb.from('restaurant_tables')
    .insert({ ...payload, tenant_id: tenantId, status: 'free', is_active: true })
    .select().single()
  if (error) throw error
  return data
}

export async function dbUpdateTable(id, updates) {
  const { data, error } = await sb.from('restaurant_tables')
    .update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function dbDeleteTable(id) {
  const { error } = await sb.from('restaurant_tables').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

// ===== CATEGORIES =====
export async function dbGetCategories(tenantId) {
  const { data } = await sb.from('categories')
    .select('*').eq('tenant_id', tenantId).eq('is_active', true).order('sort_order')
  return data || []
}

export async function dbSaveCategory(tenantId, cat, id = null) {
  const payload = { ...cat, tenant_id: tenantId }
  if (id) {
    const { data, error } = await sb.from('categories').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await sb.from('categories').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function dbDeleteCategory(id) {
  const { error } = await sb.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ===== PRODUCTS =====
export async function dbGetProducts(tenantId, categoryId = null) {
  let q = sb.from('products').select('*, categories(name)')
    .eq('tenant_id', tenantId).eq('is_active', true).order('name')
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data } = await q
  return data || []
}

export async function dbGetAllProducts(tenantId) {
  const { data } = await sb.from('products').select('*, categories(name)')
    .eq('tenant_id', tenantId).order('name')
  return data || []
}

export async function dbSaveProduct(tenantId, prod, id = null) {
  const payload = { ...prod, tenant_id: tenantId }
  if (id) {
    const { data, error } = await sb.from('products').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  }
  const { data, error } = await sb.from('products').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function dbDeleteProduct(id) {
  const { error } = await sb.from('products').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

// ===== ORDERS =====
export async function dbCreateOrder(tenantId, type, tableDbId = null, customerName = null, phone = null) {
  const payload = { tenant_id: tenantId, order_type: type, status: 'open', total_amount: 0, discount_amount: 0 }
  if (tableDbId) payload.table_db_id = tableDbId
  if (customerName) payload.customer_name = customerName
  if (phone) payload.customer_phone = phone
  const { data, error } = await sb.from('orders').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function dbGetOrder(orderId) {
  const { data } = await sb.from('orders')
    .select('*, delivery_addresses(*), order_items(*, products(id, name, price))')
    .eq('id', orderId).single()
  return data
}

export async function dbGetOrders(tenantId, filters = {}) {
  let q = sb.from('orders')
    .select('*, order_items(id, quantity, unit_price, total_price, products(name)), payments(payment_method, amount, change_amount), restaurant_tables(name)')
    .eq('tenant_id', tenantId).order('created_at', { ascending: false })
  
  if (filters.status) {
    if (filters.status.includes(',')) {
      q = q.in('status', filters.status.split(','))
    } else {
      q = q.eq('status', filters.status)
    }
  }
  
  if (filters.type) q = q.eq('order_type', filters.type)
  if (filters.from) q = q.gte('created_at', filters.from)
  if (filters.to) q = q.lte('created_at', filters.to)
  if (filters.limit) q = q.limit(filters.limit)
  const { data } = await q
  return data || []
}

export async function dbUpdateOrder(orderId, updates) {
  const { data, error } = await sb.from('orders').update(updates).eq('id', orderId).select().single()
  if (error) throw error
  return data
}

export async function dbDeleteOrder(orderId) {
  await sb.from('order_items').delete().eq('order_id', orderId)
  await sb.from('orders').delete().eq('id', orderId)
}

// ===== ORDER ITEMS =====
export async function dbAddItem(tenantId, orderId, product, qty = 1, notes = '') {
  const { data: existing } = await sb.from('order_items')
    .select('*').eq('order_id', orderId).eq('product_id', product.id).eq('notes', notes || '').single()
  if (existing) {
    await sb.from('order_items').update({
      quantity: existing.quantity + qty,
      total_price: (existing.quantity + qty) * product.price
    }).eq('id', existing.id)
  } else {
    const { error } = await sb.from('order_items').insert({
      tenant_id: tenantId, order_id: orderId, product_id: product.id,
      quantity: qty, unit_price: product.price, total_price: product.price * qty, notes: notes || ''
    })
    if (error) throw error
  }
  await dbRecalcOrder(orderId)
}

export async function dbUpdateItem(itemId, updates) {
  const { data, error } = await sb.from('order_items').update(updates).eq('id', itemId).select().single()
  if (error) throw error
  return data
}

export async function dbRemoveItem(itemId, orderId) {
  await sb.from('order_items').delete().eq('id', itemId)
  await dbRecalcOrder(orderId)
}

export async function dbRecalcOrder(orderId) {
  const { data: items } = await sb.from('order_items').select('total_price').eq('order_id', orderId)
  const total = (items || []).reduce((s, i) => s + parseFloat(i.total_price), 0)
  await sb.from('orders').update({ total_amount: total }).eq('id', orderId)
}

// ===== PAYMENTS =====
export async function dbCreatePayment(tenantId, orderId, methods, cashSessionId = null) {
  const payloads = methods.map(m => ({
    tenant_id: tenantId, order_id: orderId, cash_session_id: cashSessionId,
    payment_method: m.method, amount: m.amount, change_amount: m.change || 0
  }))
  const { data, error } = await sb.from('payments').insert(payloads).select()
  if (error) throw error
  return data
}

// ===== CASH SESSIONS =====
export async function dbGetOpenSession(tenantId) {
  const { data } = await sb.from('cash_register_sessions')
    .select('*').eq('tenant_id', tenantId).eq('status', 'open')
    .order('created_at', { ascending: false }).limit(1).single()
  return data
}

export async function dbOpenSession(tenantId, openingAmount) {
  const { data: { user } } = await sb.auth.getUser()
  const { data, error } = await sb.from('cash_register_sessions')
    .insert({
      tenant_id: tenantId,
      opening_amount: openingAmount,
      status: 'open',
      cashier_user_id: user?.id || null
    }).select().single()
  if (error) throw error
  return data
}

export async function dbCloseSession(sessionId, closingAmount, expectedAmount) {
  const diff = closingAmount - expectedAmount
  const { data, error } = await sb.from('cash_register_sessions').update({
    status: 'closed', closing_amount: closingAmount,
    expected_amount: expectedAmount, difference: diff, closed_at: new Date().toISOString()
  }).eq('id', sessionId).select().single()
  if (error) throw error
  return data
}

// ===== DELIVERY =====
export async function dbGetDeliveryOrders(tenantId) {
  const { data } = await sb.from('orders')
    .select('*, delivery_addresses(*), order_items(id)')
    .eq('tenant_id', tenantId)
    .eq('order_type', 'delivery')
    .in('status', ['open', 'in_transit', 'delivered'])
    .order('created_at', { ascending: false })
  return data || []
}

export async function dbCreateDeliveryOrder(tenantId, { customerName, customerPhone, streetAddress, city, state, postalCode, reference }) {
  // 1. Crear la dirección de entrega
  const { data: addr, error: errAddr } = await sb.from('delivery_addresses').insert({
    tenant_id: tenantId,
    customer_name: customerName,
    customer_phone: customerPhone || '',
    street_address: streetAddress || '',
    city: city || '',
    state: state || null,
    postal_code: postalCode || null,
    country: 'AR',
    reference: reference || null
  }).select().single()
  if (errAddr) throw errAddr

  // 2. Crear la orden vinculando la dirección
  const { data: order, error: errOrder } = await sb.from('orders').insert({
    tenant_id: tenantId,
    order_type: 'delivery',
    status: 'open',
    total_amount: 0,
    discount_amount: 0,
    customer_name: customerName,
    customer_phone: customerPhone || null,
    delivery_address_id: addr.id
  }).select().single()
  if (errOrder) throw errOrder

  return { ...order, delivery_addresses: addr }
}

export async function dbUpdateDeliveryAddress(addressId, payload) {
  const { data, error } = await sb.from('delivery_addresses')
    .update(payload)
    .eq('id', addressId)
    .select().single()
  if (error) throw error
  return data
}


// ===== CUSTOMERS =====
export async function dbGetCustomers(tenantId) {
  const { data } = await sb.from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100)
  return data || []
}

// ===== HELPERS =====
export const fmtMoney = n =>
  '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const fmtDate = d =>
  new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const fmtTimer = d => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ===== ACTIVITY LOGS =====
export async function logActivity(tenantId, userId, userName, action, entityType, details = {}) {
  try {
    await sb.from('activity_logs').insert({
      tenant_id: tenantId,
      user_id: userId || null,
      user_name: userName || 'Sistema',
      action,
      entity_type: entityType,
      details
    })
  } catch (e) {
    // Silent fail - logging should never break the app
    console.warn('Log activity failed:', e.message)
  }
}

export async function dbGetActivityLogs(tenantId, filters = {}) {
  let q = sb.from('activity_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (filters.userId) q = q.eq('user_id', filters.userId)
  if (filters.action) q = q.eq('action', filters.action)
  if (filters.entityType) q = q.eq('entity_type', filters.entityType)
  if (filters.from) q = q.gte('created_at', filters.from)
  if (filters.to) q = q.lte('created_at', filters.to)
  q = q.limit(filters.limit || 200)
  const { data, error } = await q
  if (error) throw error
  return data || []
}
