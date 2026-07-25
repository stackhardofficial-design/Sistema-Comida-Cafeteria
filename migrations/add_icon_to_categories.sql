-- Agregar la columna 'icon' a la tabla de categorias
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
