-- DropCost Master: Dashboard & Integrations Schema
-- Version: 1.0
-- Date: 2026-02-26

-- =============================================
-- 1. MODIFICAR TABLA: integraciones
-- =============================================
-- Soporte para integraciones a nivel de usuario (Meta Ads) o tienda (Shopify, Dropi)

ALTER TABLE public.integraciones 
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ALTER COLUMN tienda_id DROP NOT NULL;

-- Index para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_integraciones_usuario ON public.integraciones(usuario_id);

-- Actualizar comentarios
COMMENT ON COLUMN public.integraciones.usuario_id IS 'ID del usuario propietario (para integraciones globales como Meta Ads)';
COMMENT ON COLUMN public.integraciones.tienda_id IS 'ID de la tienda (para integraciones específicas como Shopify/Dropi)';

-- =============================================
-- 2. TABLA: data_shopify_orders
-- =============================================
CREATE TABLE IF NOT EXISTS public.data_shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
  shopify_order_id BIGINT NOT NULL,
  order_number VARCHAR(50),
  
  -- Montos
  total_price NUMERIC(15,2),
  subtotal_price NUMERIC(15,2),
  total_tax NUMERIC(15,2),
  currency VARCHAR(3),
  
  -- Estados
  financial_status VARCHAR(50), -- paid, pending, refunded, etc
  fulfillment_status VARCHAR(50), -- fulfilled, null, restocked, etc
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  
  -- Timestamps
  shopify_created_at TIMESTAMP WITH TIME ZONE,
  shopify_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(tienda_id, shopify_order_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_tienda ON public.data_shopify_orders(tienda_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created ON public.data_shopify_orders(shopify_created_at);

-- =============================================
-- 3. TABLA: data_meta_ads
-- =============================================
CREATE TABLE IF NOT EXISTS public.data_meta_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  id_campana_meta VARCHAR NOT NULL,
  nombre_campana VARCHAR,
  id_cuenta_publicidad VARCHAR,
  nombre_cuenta VARCHAR,
  moneda VARCHAR(3),
  
  -- Métricas (Acumuladas o por periodo, usualmente diarias)
  impresiones BIGINT DEFAULT 0,
  clics BIGINT DEFAULT 0,
  conversiones BIGINT DEFAULT 0,
  valor_acciones NUMERIC(15,2) DEFAULT 0,
  gasto_real NUMERIC(15,2) DEFAULT 0,
  cpa_real NUMERIC(15,2) DEFAULT 0,
  
  -- Configuración
  presupuesto_diario NUMERIC(15,2),
  estado_campana VARCHAR(50),
  
  -- Timestamps
  fecha_sincronizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fecha_creacion_campana TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(usuario_id, id_campana_meta)
);

CREATE INDEX IF NOT EXISTS idx_meta_ads_usuario ON public.data_meta_ads(usuario_id);

-- =============================================
-- 4. TABLA: dashboard_metrics (KPIs Consolidados)
-- =============================================
CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  
  -- Ventas (Shopify)
  ventas_count INTEGER DEFAULT 0,
  ingresos_totales NUMERIC(15,2) DEFAULT 0,
  tasa_cancelacion_pre_envio NUMERIC(5,2) DEFAULT 0,
  
  -- Publi (Meta Ads)
  gasto_publicidad NUMERIC(15,2) DEFAULT 0,
  cpa_promedio NUMERIC(15,2) DEFAULT 0,
  roas_real NUMERIC(5,2) DEFAULT 0,
  
  -- Operativo (Dropi/Manual)
  tasa_entrega_neta NUMERIC(5,2) DEFAULT 0,
  margen_real NUMERIC(15,2) DEFAULT 0,
  
  last_calculation TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(tienda_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_tienda_fecha ON public.dashboard_metrics(tienda_id, fecha);

-- =============================================
-- 5. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.data_shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_meta_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- 5.1 data_shopify_orders
DROP POLICY IF EXISTS "dc_shopify_orders_self" ON public.data_shopify_orders;
CREATE POLICY "dc_shopify_orders_self" ON public.data_shopify_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tiendas
            WHERE tiendas.id = data_shopify_orders.tienda_id
              AND tiendas.usuario_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tiendas
            WHERE tiendas.id = data_shopify_orders.tienda_id
              AND tiendas.usuario_id = auth.uid()
        )
    );

-- 5.2 data_meta_ads
DROP POLICY IF EXISTS "dc_meta_ads_self" ON public.data_meta_ads;
CREATE POLICY "dc_meta_ads_self" ON public.data_meta_ads
    FOR ALL USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

-- 5.3 dashboard_metrics
DROP POLICY IF EXISTS "dc_dashboard_metrics_self" ON public.dashboard_metrics;
CREATE POLICY "dc_dashboard_metrics_self" ON public.dashboard_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tiendas
            WHERE tiendas.id = dashboard_metrics.tienda_id
              AND tiendas.usuario_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tiendas
            WHERE tiendas.id = dashboard_metrics.tienda_id
              AND tiendas.usuario_id = auth.uid()
        )
    );

-- 5.4 Update integraciones RLS to support usuario_id
DROP POLICY IF EXISTS "dc_integraciones_self" ON public.integraciones;
CREATE POLICY "dc_integraciones_self" ON public.integraciones
    FOR ALL USING (
        (usuario_id = auth.uid()) OR
        (EXISTS (
            SELECT 1 FROM public.tiendas
            WHERE tiendas.id = integraciones.tienda_id
              AND tiendas.usuario_id = auth.uid()
        ))
    )
    WITH CHECK (
        (usuario_id = auth.uid()) OR
        (EXISTS (
            SELECT 1 FROM public.tiendas
            WHERE tiendas.id = integraciones.tienda_id
              AND tiendas.usuario_id = auth.uid()
        ))
    );

-- 5.5 Admin access for all
CREATE POLICY "dc_admin_shopify_all" ON public.data_shopify_orders FOR ALL USING (public.is_admin());
CREATE POLICY "dc_admin_meta_all" ON public.data_meta_ads FOR ALL USING (public.is_admin());
CREATE POLICY "dc_admin_metrics_all" ON public.dashboard_metrics FOR ALL USING (public.is_admin());
