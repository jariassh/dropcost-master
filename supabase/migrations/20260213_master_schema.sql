-- DropCost Master - Unified Master Schema
-- Description: Centralized database schema for Multi-tenancy, Financial Engine, Referral System, and Admin Tools.
-- Version: 1.0
-- Date: 2026-02-13

-- -----------------------------------------------------------------------------
-- 1. BASE DE USUARIOS Y ROLES (EXTENSION DE AUTH)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombres TEXT,
  apellidos TEXT,
  rol TEXT DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin', 'superadmin')),
  estado_suscripcion TEXT DEFAULT 'activa' CHECK (estado_suscripcion IN ('activa', 'cancelada', 'suspendida', 'pendiente')),
  plan_id TEXT DEFAULT 'plan_free', -- free, pro, enterprise
  telefono TEXT,
  pais TEXT, -- ISO 2-letter code (CO, MX, EC, etc)
  email_verificado BOOLEAN DEFAULT false,
  "2fa_habilitado" BOOLEAN DEFAULT false,
  codigo_referido_personal VARCHAR UNIQUE, -- Codigo para invitar a otros
  wallet_saldo NUMERIC(15,2) DEFAULT 0, -- Saldo acumulado por comisiones
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ultima_actividad TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. MULTITENANCY: TIENDAS E INTEGRACIONES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tiendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  nombre VARCHAR NOT NULL,
  logo_url TEXT,
  pais VARCHAR(2) NOT NULL, -- Cada tienda opera en un pais especifico
  moneda VARCHAR(3) DEFAULT 'COP',
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.integraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('meta_ads', 'dropi', 'shopify', 'acortador')),
  estado VARCHAR NOT NULL DEFAULT 'desconectado' CHECK (estado IN ('conectado', 'desconectado', 'error')),
  credenciales_encriptadas TEXT, -- AES-256 encrypted tokens/keys
  config_sync JSONB DEFAULT '{}',
  ultima_sincronizacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. MOTOR FINANCIERO: COSTEO Y SIMULACIONES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.costeos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
  nombre_producto VARCHAR NOT NULL,
  sku VARCHAR,
  
  -- Variables de Entrada (Costo)
  costo_producto NUMERIC(15,2) NOT NULL DEFAULT 0,
  flete_envio NUMERIC(15,2) NOT NULL DEFAULT 0,
  comision_recaudo_porcentaje NUMERIC(5,2) DEFAULT 0,
  tasa_devolucion_porcentaje NUMERIC(5,2) DEFAULT 0,
  otros_gastos NUMERIC(15,2) DEFAULT 0,
  cpa_promedio NUMERIC(15,2) NOT NULL DEFAULT 0,
  cancelacion_pre_envio_porcentaje NUMERIC(5,2) DEFAULT 0,
  margen_deseado_porcentaje NUMERIC(5,2) DEFAULT 0,
  
  -- Resultados (Calculados)
  precio_sugerido NUMERIC(15,2) NOT NULL,
  utilidad_neta NUMERIC(15,2) NOT NULL,
  roas_objetivo NUMERIC(5,2),
  viabilidad_color VARCHAR(10) CHECK (viabilidad_color IN ('verde', 'amarillo', 'rojo')),
  
  -- Relaciones Meta Ads
  meta_campana_id VARCHAR,
  meta_asset_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 4. HERRAMIENTAS ADMINISTRATIVAS: TRAFICO Y ACORTADOR
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.acortador_enlaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Null si es admin
  url_original TEXT NOT NULL,
  slug VARCHAR UNIQUE NOT NULL, -- El codigo corto (ej: dc.m/xyz)
  titulo VARCHAR,
  visitas_totales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.analisis_trafico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES public.acortador_enlaces(id) ON DELETE CASCADE,
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE,
  referentes TEXT,
  dispositivo VARCHAR(50),
  pais_visita VARCHAR(2),
  eventos_conversion JSONB DEFAULT '[]', -- pixel events
  fecha_evento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. SISTEMA DE REFERIDOS (MODULO LIDERES Y COMISIONES)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.referidos_lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Si el lider es un usuario de la app
  nombre VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  codigo_referido VARCHAR UNIQUE NOT NULL,
  porcentaje_comision NUMERIC(5,2) NOT NULL,
  estado VARCHAR NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'suspendido')),
  
  -- Statistics
  total_usuarios_referidos INTEGER DEFAULT 0,
  total_comisiones_generadas NUMERIC(15,2) DEFAULT 0,
  
  -- Banking Info
  banco_info JSONB DEFAULT '{}', -- Datos para pagos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referidos_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  lider_id UUID NOT NULL REFERENCES public.referidos_lideres(id) ON DELETE CASCADE,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 6. AUDITORIA Y PLANES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id),
  accion VARCHAR NOT NULL, -- ej: LOGIN, DELETE_COSTEO, CHANGE_PLAN
  detalles JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 7. SEGURIDAD: RLS Y POLICIES
-- -----------------------------------------------------------------------------

-- Habilitar RLS en todas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costeos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acortador_enlaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_trafico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: Users
-- POLICIES: Users
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin view all users" ON public.users;
CREATE POLICY "Admin view all users" ON public.users FOR ALL USING (
  exists (select 1 from public.users where id = auth.uid() and rol in ('admin', 'superadmin'))
);

-- POLICIES: Tiendas (Multitenancy)
DROP POLICY IF EXISTS "Users manage own tiendas" ON public.tiendas;
CREATE POLICY "Users manage own tiendas" ON public.tiendas FOR ALL USING (usuario_id = auth.uid());

-- POLICIES: Costeos (Aislamiento total)
DROP POLICY IF EXISTS "Users manage own costeos" ON public.costeos;
CREATE POLICY "Users manage own costeos" ON public.costeos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tiendas WHERE tiendas.id = costeos.tienda_id AND tiendas.usuario_id = auth.uid())
);

-- POLICIES: Audit (Solo lectura por admin)
DROP POLICY IF EXISTS "Admin view logs" ON public.audit_logs;
CREATE POLICY "Admin view logs" ON public.audit_logs FOR SELECT USING (
  exists (select 1 from public.users where id = auth.uid() and rol in ('admin', 'superadmin'))
);

-- -----------------------------------------------------------------------------
-- 8. INDEXACION PARA PERFORMANCE
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_rol ON public.users(rol);
CREATE INDEX IF NOT EXISTS idx_tiendas_usuario ON public.tiendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_costeos_tienda ON public.costeos(tienda_id);
CREATE INDEX IF NOT EXISTS idx_acortador_slug ON public.acortador_enlaces(slug);
CREATE INDEX IF NOT EXISTS idx_analisis_tienda ON public.analisis_trafico(tienda_id);
CREATE INDEX IF NOT EXISTS idx_referidos_codigo ON public.referidos_lideres(codigo_referido);
