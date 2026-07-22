-- Tabla de ingredientes
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- ej. gr, kg, unidad, l, ml
    cost NUMERIC(10, 2) DEFAULT 0,
    current_stock NUMERIC(12, 3) DEFAULT 0,
    min_stock NUMERIC(12, 3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de recetas (relación producto - ingrediente)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL, -- cantidad de ese ingrediente requerida para 1 unidad del producto
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, ingredient_id)
);

-- Tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('product', 'ingredient')),
    item_id UUID NOT NULL,
    change_amount NUMERIC(12, 3) NOT NULL, -- Positivo (entrada) o negativo (salida)
    previous_stock NUMERIC(12, 3) NOT NULL,
    new_stock NUMERIC(12, 3) NOT NULL,
    reason TEXT NOT NULL, -- 'venta', 'compra', 'ajuste', 'desperdicio'
    reference_id UUID, -- Ej. order_id si fue por venta
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID -- Usuario que realizó el movimiento
);

-- Desactivar RLS para estas tablas para facilitar desarrollo local si es necesario
ALTER TABLE public.ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
