-- Fase 1: Foundation - Multi-tenant SaaS Scheme
-- Author: Antigravity

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- Extracts tenant_id from the JWT token for Row Level Security
  RETURN (nullif(current_setting('request.jwt.claim.tenant_id', true), ''))::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to automatically update "updated_at" column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Tables

-- Tenants (Restaurants)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Staff & Admin)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'owner', 'admin', 'manager', 'cashier', 'kitchen', 'waiter', 'delivery')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Modifiers (e.g. "No Onion", "Extra Cheese")
CREATE TABLE product_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    name VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items (Ingredients)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(20) NOT NULL,
    minimum_threshold DECIMAL(10, 3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Recipes (Escandallos)
CREATE TABLE product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity_required DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, inventory_item_id)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id), -- Employee who took the order
    table_id VARCHAR(50), -- Just string for phase 1
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_kitchen', 'ready', 'served', 'completed', 'cancelled')),
    order_type VARCHAR(50) NOT NULL CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Item Modifiers
CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    modifier_id UUID NOT NULL REFERENCES product_modifiers(id),
    price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Tenants Policies
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    USING (id = get_current_tenant_id());

-- Generic Isolation Policy for all other tables
CREATE POLICY tenant_isolation_policy ON users FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY self_read_policy ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY tenant_isolation_policy ON categories FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON products FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON product_modifiers FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON inventory_items FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON product_recipes FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON orders FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON order_items FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON order_item_modifiers FOR ALL USING (tenant_id = get_current_tenant_id());

-- Service Role Policy (Bypass RLS for backend tasks like Webhooks or Sync)
CREATE POLICY service_role_policy ON tenants FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON users FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON categories FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON products FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON product_modifiers FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON inventory_items FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON product_recipes FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON orders FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON order_items FOR ALL USING (current_setting('role') = 'service_role');
CREATE POLICY service_role_policy ON order_item_modifiers FOR ALL USING (current_setting('role') = 'service_role');


-- 4. Triggers for updated_at
CREATE TRIGGER set_timestamp BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON product_modifiers FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- 5. Indexes for Performance (Especially on tenant_id)
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_product_modifiers_tenant ON product_modifiers(tenant_id);
CREATE INDEX idx_product_modifiers_product ON product_modifiers(product_id);
CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_product_recipes_tenant ON product_recipes(tenant_id);
CREATE INDEX idx_product_recipes_product ON product_recipes(product_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_item_modifiers_tenant ON order_item_modifiers(tenant_id);
CREATE INDEX idx_order_item_modifiers_order_item ON order_item_modifiers(order_item_id);

-- Enable realtime for KDS (Orders)
alter publication supabase_realtime add table orders;
