-- ==========================================
-- Campos Dropi faltantes en tabla orders
-- Author: Backend Engineer
-- Contexto: El frontend de SincronizarPage.tsx mapea 17 campos
-- de Dropi pero solo 7 existían en la tabla orders.
-- ==========================================

-- 1. Campos de logística/transporte
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guia_transporte TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS novedad TEXT;

-- 2. Campos financieros de Dropi
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS valor_compra NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_flete NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costo_devolucion NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS comision_dropi NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_proveedor NUMERIC(10,2) DEFAULT 0;

-- 3. Campo de contacto del cliente
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- 4. Fechas adicionales de Dropi
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS fecha_dropi TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fecha_novedad TIMESTAMPTZ;

-- 5. Categorías de producto
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS categorias TEXT;

-- 6. Índice compuesto para búsquedas por transportadora + estado
CREATE INDEX IF NOT EXISTS idx_orders_transportadora ON public.orders(transportadora) WHERE transportadora IS NOT NULL;

-- 7. Índice para búsquedas por guía de transporte
CREATE INDEX IF NOT EXISTS idx_orders_guia ON public.orders(guia_transporte) WHERE guia_transporte IS NOT NULL;

-- 8. Actualizar el CHECK constraint de origen para incluir 'dropi'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%orders_origen_check%'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_origen_check;
  END IF;
  
  ALTER TABLE public.orders ADD CONSTRAINT orders_origen_check 
    CHECK (origen IN ('shopify', 'manual', 'dropi', 'csv'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
