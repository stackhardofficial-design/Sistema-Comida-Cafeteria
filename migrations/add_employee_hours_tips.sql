-- Agregar sueldo por hora a la tabla de usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) DEFAULT 0;

-- Tabla de registro de horas trabajadas
CREATE TABLE IF NOT EXISTS public.employee_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  hours_worked NUMERIC(5, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employee_hours DISABLE ROW LEVEL SECURITY;

-- La tabla payments ya tiene tip_amount, solo aseguramos que exista
ALTER TABLE public.payments ALTER COLUMN tip_amount SET DEFAULT 0;
