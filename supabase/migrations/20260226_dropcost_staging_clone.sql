-- ============================================================
-- DROPCOST MASTER: STAGING CLONE SCRIPT
-- Versión: 1.0 (Consolidada)
-- Propósito: Clonar estructura de Producción a Staging
-- ============================================================

-- 0. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLAS CORE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombres TEXT,
  apellidos TEXT,
  rol TEXT DEFAULT 'cliente',
  estado_suscripcion TEXT DEFAULT 'pendiente',
  plan_id TEXT DEFAULT 'plan_free',
  telefono TEXT,
  pais TEXT,
  email_verificado BOOLEAN DEFAULT false,
  "2fa_habilitado" BOOLEAN DEFAULT false,
  codigo_referido_personal VARCHAR UNIQUE,
  wallet_saldo NUMERIC(15,2) DEFAULT 0,
  session_token UUID,
  avatar_url TEXT,
  fecha_vencimiento_plan TIMESTAMP WITH TIME ZONE,
  dias_restantes INTEGER,
  plan_precio_pagado NUMERIC(15,2) DEFAULT 0,
  plan_periodo TEXT,
  bank_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tiendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  nombre VARCHAR NOT NULL,
  logo_url TEXT,
  pais VARCHAR(2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'COP',
  configuracion JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.costeos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
  nombre_producto VARCHAR NOT NULL,
  sku VARCHAR,
  costo_producto NUMERIC(15,2) NOT NULL DEFAULT 0,
  flete_envio NUMERIC(15,2) NOT NULL DEFAULT 0,
  comision_recaudo_porcentaje NUMERIC(5,2) DEFAULT 0,
  tasa_devolucion_porcentaje NUMERIC(5,2) DEFAULT 0,
  otros_gastos NUMERIC(15,2) DEFAULT 0,
  cpa_promedio NUMERIC(15,2) NOT NULL DEFAULT 0,
  cancelacion_pre_envio_porcentaje NUMERIC(5,2) DEFAULT 0,
  margen_deseado_porcentaje NUMERIC(5,2) DEFAULT 0,
  precio_sugerido NUMERIC(15,2) NOT NULL,
  utilidad_neta NUMERIC(15,2) NOT NULL,
  roas_objetivo NUMERIC(5,2),
  viabilidad_color VARCHAR(10),
  meta_campana_id VARCHAR,
  meta_asset_url TEXT,
  campaign_id_meta VARCHAR, -- New field for Dashboard
  product_id_shopify VARCHAR, -- New field for Dashboard
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_monthly NUMERIC(15,2) NOT NULL,
  price_semiannual NUMERIC(15,2),
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referidos_lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  nombre VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  codigo_referido VARCHAR UNIQUE NOT NULL,
  porcentaje_comision NUMERIC(5,2) NOT NULL DEFAULT 15,
  estado VARCHAR NOT NULL DEFAULT 'activo',
  total_usuarios_referidos INTEGER DEFAULT 0,
  total_comisiones_generadas NUMERIC(15,2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  banco_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referidos_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.referidos_lideres(id) ON DELETE CASCADE,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  subject VARCHAR NOT NULL,
  content_mjml TEXT,
  content_html TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. FUNCIONES DE SEGURIDAD (RLS DEFRECUENTES)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, nombres, apellidos, rol, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'nombres', 
    new.raw_user_meta_data->>'apellidos', 
    COALESCE(new.raw_user_meta_data->>'rol', 'cliente'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGERS CORE
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. HABILITAR RLS Y POLÍTICAS BÁSICAS
-- -----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costeos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view self" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update self" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins all" ON public.users FOR ALL USING (public.is_admin());

CREATE POLICY "Users manage own tiendas" ON public.tiendas FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "Users manage own costeos" ON public.costeos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tiendas WHERE tiendas.id = costeos.tienda_id AND tiendas.usuario_id = auth.uid())
);

-- 5. SEMILLAS (DATA INICIAL CRÍTICA)
-- -----------------------------------------------------------------------------

INSERT INTO public.plans (slug, name, price_monthly, price_semiannual, limits)
VALUES 
('plan_free', 'Plan Gratis', 0, 0, '{"stores": 1}'),
('plan_pro', 'Plan Pro', 25, 120, '{"stores": 5, "costeos_limit": 100}'),
('plan_enterprise', 'Plan Enterprise', 50, 240, '{"stores": 10, "costeos_limit": 500}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
