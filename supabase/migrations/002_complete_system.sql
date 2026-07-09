-- ===========================================================================
-- Fase 2: Complete System Extension
-- Extends 001_foundation.sql with tables for tables, payments, delivery, etc.
-- Author: Antigravity
-- ===========================================================================

-- ===========================================================================
-- SECTION A: Add new roles to users table check constraint
-- ===========================================================================

-- First, drop the old constraint and add a new one with all roles including super_admin and delivery
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'cashier', 'kitchen', 'waiter', 'delivery'));

-- ===========================================================================
-- SECTION B: Extend existing tables with new columns
-- ===========================================================================

-- Extend tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#e56b25';

-- Extend products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS preparation_time_minutes INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT -1; -- -1 = unlimited

-- Extend orders  
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address_id UUID,
  ADD COLUMN IF NOT EXISTS table_db_id UUID; -- FK to tables table

-- ===========================================================================
-- SECTION C: New Tables
-- ===========================================================================

-- Restaurant Zones (areas within the restaurant)
CREATE TABLE IF NOT EXISTS restaurant_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,         -- e.g. "Terraza", "Interior", "Barra"
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant Tables (physical tables)
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES restaurant_zones(id) ON DELETE SET NULL,
  name VARCHAR(50) NOT NULL,          -- e.g. "Mesa 1", "Barra 3"
  capacity INT NOT NULL DEFAULT 4,
  status VARCHAR(20) NOT NULL DEFAULT 'free' 
    CHECK (status IN ('free', 'occupied', 'reserved', 'billing')),
  current_order_id UUID,              -- FK set later after orders table check
  qr_code TEXT,                       -- QR code URL for table self-order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Addresses
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  street_address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'US',
  reference TEXT,                     -- "Yellow house, near the park"
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Assignments (which delivery person handles which order)
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_user_id UUID NOT NULL REFERENCES users(id),
  address_id UUID REFERENCES delivery_addresses(id),
  status VARCHAR(30) NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  estimated_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Register Sessions (apertura y cierre de caja)
CREATE TABLE IF NOT EXISTS cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cashier_user_id UUID NOT NULL REFERENCES users(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(10, 2),
  expected_amount DECIMAL(10, 2),     -- Calculated from sales
  difference DECIMAL(10, 2),         -- closing - expected
  notes TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (each payment for an order)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_register_sessions(id),
  payment_method VARCHAR(30) NOT NULL 
    CHECK (payment_method IN ('cash', 'card', 'transfer', 'app', 'voucher')),
  amount DECIMAL(10, 2) NOT NULL,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  change_amount DECIMAL(10, 2) DEFAULT 0,  -- Cash change
  reference_code VARCHAR(200),        -- Transaction ID for cards/transfers
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log (audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,                     -- NULL for super_admin actions
  user_id UUID,
  action VARCHAR(100) NOT NULL,       -- e.g. 'order.created', 'product.updated'
  entity_type VARCHAR(50),            -- 'order', 'product', 'user', etc.
  entity_id UUID,
  details JSONB,                      -- Additional context
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (in-app notifications per user)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = all users of tenant
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN DEFAULT false,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================================================
-- SECTION D: Add FK from orders.table_db_id to restaurant_tables
-- ===========================================================================
ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_table 
    FOREIGN KEY (table_db_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL;

ALTER TABLE orders 
  ADD CONSTRAINT fk_orders_delivery_address
    FOREIGN KEY (delivery_address_id) REFERENCES delivery_addresses(id) ON DELETE SET NULL;

-- ===========================================================================
-- SECTION E: Row Level Security (RLS) for new tables
-- ===========================================================================

ALTER TABLE restaurant_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy for new tables
CREATE POLICY tenant_isolation_policy ON restaurant_zones 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON restaurant_zones 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON restaurant_tables 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON restaurant_tables 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON delivery_addresses 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON delivery_addresses 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON delivery_assignments 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON delivery_assignments 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON cash_register_sessions 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON cash_register_sessions 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON payments 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON payments 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON activity_log 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON activity_log 
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY tenant_isolation_policy ON notifications 
  FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY service_role_policy ON notifications 
  FOR ALL USING (current_setting('role') = 'service_role');

-- ===========================================================================
-- SECTION F: Triggers for updated_at on new tables
-- ===========================================================================

CREATE TRIGGER set_timestamp BEFORE UPDATE ON restaurant_zones 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON restaurant_tables 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON delivery_assignments 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON cash_register_sessions 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ===========================================================================
-- SECTION G: Indexes for Performance
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_restaurant_zones_tenant ON restaurant_zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_tenant ON restaurant_tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone ON restaurant_tables(zone_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_tenant ON delivery_addresses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_tenant ON delivery_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_user ON delivery_assignments(delivery_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant ON cash_register_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_register_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ===========================================================================
-- SECTION H: Enable Realtime for new tables
-- ===========================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ===========================================================================
-- SECTION I: Useful Database Functions / RPC
-- ===========================================================================

-- Function: Get Dashboard Stats for a tenant
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'today_sales', COALESCE((
      SELECT SUM(total_amount) FROM orders 
      WHERE tenant_id = p_tenant_id 
        AND status = 'completed'
        AND created_at >= CURRENT_DATE
    ), 0),
    'today_orders', COALESCE((
      SELECT COUNT(*) FROM orders 
      WHERE tenant_id = p_tenant_id 
        AND created_at >= CURRENT_DATE
    ), 0),
    'active_orders', COALESCE((
      SELECT COUNT(*) FROM orders 
      WHERE tenant_id = p_tenant_id 
        AND status IN ('pending', 'in_kitchen', 'ready')
    ), 0),
    'free_tables', COALESCE((
      SELECT COUNT(*) FROM restaurant_tables 
      WHERE tenant_id = p_tenant_id AND status = 'free' AND is_active = true
    ), 0),
    'occupied_tables', COALESCE((
      SELECT COUNT(*) FROM restaurant_tables 
      WHERE tenant_id = p_tenant_id AND status = 'occupied' AND is_active = true
    ), 0),
    'week_sales', COALESCE((
      SELECT SUM(total_amount) FROM orders 
      WHERE tenant_id = p_tenant_id 
        AND status = 'completed'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ), 0),
    'month_sales', COALESCE((
      SELECT SUM(total_amount) FROM orders 
      WHERE tenant_id = p_tenant_id 
        AND status = 'completed'
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Create a complete order with items atomically
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_tenant_id UUID,
  p_user_id UUID,
  p_table_id UUID,
  p_order_type VARCHAR,
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_notes TEXT,
  p_delivery_address_id UUID,
  p_items JSONB  -- [{product_id, quantity, unit_price, notes, modifiers:[{modifier_id, price_adjustment}]}]
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_total DECIMAL(10, 2) := 0;
  v_item JSONB;
  v_modifier JSONB;
  v_order_item_id UUID;
  v_item_total DECIMAL(10, 2);
BEGIN
  -- Calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_total := (v_item->>'quantity')::INT * (v_item->>'unit_price')::DECIMAL;
    v_total := v_total + v_item_total;
  END LOOP;

  -- Insert order
  INSERT INTO orders (
    tenant_id, user_id, table_db_id, status, order_type,
    customer_name, customer_phone, notes, delivery_address_id, total_amount
  ) VALUES (
    p_tenant_id, p_user_id, p_table_id, 'pending', p_order_type,
    p_customer_name, p_customer_phone, p_notes, p_delivery_address_id, v_total
  ) RETURNING id INTO v_order_id;

  -- Update table status if dine-in
  IF p_table_id IS NOT NULL THEN
    UPDATE restaurant_tables 
    SET status = 'occupied', current_order_id = v_order_id
    WHERE id = p_table_id AND tenant_id = p_tenant_id;
  END IF;

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_total := (v_item->>'quantity')::INT * (v_item->>'unit_price')::DECIMAL;
    
    INSERT INTO order_items (
      tenant_id, order_id, product_id, quantity, unit_price, total_price, notes
    ) VALUES (
      p_tenant_id, v_order_id, 
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::DECIMAL,
      v_item_total,
      v_item->>'notes'
    ) RETURNING id INTO v_order_item_id;

    -- Insert modifiers if any
    IF v_item->'modifiers' IS NOT NULL THEN
      FOR v_modifier IN SELECT * FROM jsonb_array_elements(v_item->'modifiers') LOOP
        INSERT INTO order_item_modifiers (
          tenant_id, order_item_id, modifier_id, price_adjustment
        ) VALUES (
          p_tenant_id, v_order_item_id,
          (v_modifier->>'modifier_id')::UUID,
          COALESCE((v_modifier->>'price_adjustment')::DECIMAL, 0)
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'total', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete an order payment and update table
CREATE OR REPLACE FUNCTION complete_order_payment(
  p_tenant_id UUID,
  p_order_id UUID,
  p_payment_method VARCHAR,
  p_amount DECIMAL,
  p_tip DECIMAL,
  p_change DECIMAL,
  p_processed_by UUID,
  p_cash_session_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_table_id UUID;
BEGIN
  -- Get the table ID from the order
  SELECT table_db_id INTO v_table_id FROM orders WHERE id = p_order_id;

  -- Insert payment
  INSERT INTO payments (
    tenant_id, order_id, cash_session_id, payment_method, 
    amount, tip_amount, change_amount, processed_by
  ) VALUES (
    p_tenant_id, p_order_id, p_cash_session_id, p_payment_method,
    p_amount, p_tip, p_change, p_processed_by
  );

  -- Mark order as completed
  UPDATE orders 
  SET status = 'completed', tip_amount = p_tip, updated_at = NOW()
  WHERE id = p_order_id AND tenant_id = p_tenant_id;

  -- Free the table if any
  IF v_table_id IS NOT NULL THEN
    UPDATE restaurant_tables 
    SET status = 'free', current_order_id = NULL, updated_at = NOW()
    WHERE id = v_table_id AND tenant_id = p_tenant_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
