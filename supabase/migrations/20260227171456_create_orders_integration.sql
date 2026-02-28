-- ==========================================
-- Integración de Pedidos Shopify + Dropi
-- Author: Database Architect
-- ==========================================

-- 1. Modificar tabla tiendas
ALTER TABLE public.tiendas 
ADD COLUMN IF NOT EXISTS shopify_domain TEXT,
ADD COLUMN IF NOT EXISTS webhook_short_id TEXT UNIQUE;

-- 2. Modificar tabla costeos
ALTER TABLE public.costeos
ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;

-- 3. Crear tabla orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    costeo_id UUID REFERENCES public.costeos(id) ON DELETE SET NULL,
    shopify_order_id TEXT,
    order_number TEXT NOT NULL,
    fecha_orden TIMESTAMPTZ,
    estado_pago TEXT,
    estado_logistica TEXT,
    cliente_nombre TEXT,
    cliente_telefono TEXT,
    cliente_ciudad TEXT,
    cliente_departamento TEXT,
    total_orden NUMERIC(10,2) DEFAULT 0,
    cantidad_items INTEGER DEFAULT 1,
    transportadora TEXT,
    novedad TEXT,
    origen TEXT DEFAULT 'shopify' CHECK (origen IN ('shopify', 'manual', 'dropi')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para rendimiento y unicidad (multitenancy asegurado)
CREATE UNIQUE INDEX IF NOT EXISTS unq_tienda_shopify_order ON public.orders(tienda_id, shopify_order_id) WHERE shopify_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unq_tienda_order_number ON public.orders(tienda_id, order_number);

-- Índices para futuras analíticas regionales y búsquedas
CREATE INDEX IF NOT EXISTS idx_orders_fecha ON public.orders(fecha_orden);
CREATE INDEX IF NOT EXISTS idx_orders_ciudad ON public.orders(cliente_ciudad);
CREATE INDEX IF NOT EXISTS idx_orders_departamento ON public.orders(cliente_departamento);

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política de Lectura (Select)
CREATE POLICY "Usuarios pueden ver sus propias órdenes" 
ON public.orders FOR SELECT 
USING (auth.uid() = usuario_id);

-- Política de Inserción (Insert)
CREATE POLICY "Usuarios pueden insertar sus propias órdenes" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

-- Política de Actualización (Update)
CREATE POLICY "Usuarios pueden actualizar sus propias órdenes" 
ON public.orders FOR UPDATE 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Política de Eliminación (Delete)
CREATE POLICY "Usuarios pueden eliminar sus propias órdenes" 
ON public.orders FOR DELETE 
USING (auth.uid() = usuario_id);

-- Trigger para mantener updated_at actualizado
CREATE OR REPLACE FUNCTION update_orders_modtime()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_modtime();
