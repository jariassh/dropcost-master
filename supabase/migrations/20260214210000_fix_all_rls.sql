-- Migration: Fix RLS Policies for Core Tables
-- Date: 2026-02-14

-- -----------------------------------------------------------------------------
-- 1. TIENDAS (Stores)
-- -----------------------------------------------------------------------------
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tiendas" ON public.tiendas;
DROP POLICY IF EXISTS "Users select own tiendas" ON public.tiendas;
DROP POLICY IF EXISTS "Users insert own tiendas" ON public.tiendas;
DROP POLICY IF EXISTS "Users update own tiendas" ON public.tiendas;
DROP POLICY IF EXISTS "Users delete own tiendas" ON public.tiendas;

-- Comprehensive policy for CRUD (since check is simple)
CREATE POLICY "Users manage own tiendas" ON public.tiendas 
FOR ALL 
USING (usuario_id = auth.uid()) 
WITH CHECK (usuario_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. INTEGRACIONES
-- -----------------------------------------------------------------------------
ALTER TABLE public.integraciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own integraciones" ON public.integraciones;

-- Policy requires checking the parent store ownership
CREATE POLICY "Users manage own integraciones" ON public.integraciones 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tiendas 
    WHERE tiendas.id = integraciones.tienda_id 
    AND tiendas.usuario_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tiendas 
    WHERE tiendas.id = integraciones.tienda_id 
    AND tiendas.usuario_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- 3. COSTEOS
-- -----------------------------------------------------------------------------
ALTER TABLE public.costeos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own costeos" ON public.costeos;

CREATE POLICY "Users manage own costeos" ON public.costeos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tiendas 
    WHERE tiendas.id = costeos.tienda_id 
    AND tiendas.usuario_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tiendas 
    WHERE tiendas.id = costeos.tienda_id 
    AND tiendas.usuario_id = auth.uid()
  )
);

-- -----------------------------------------------------------------------------
-- 4. USERS (Re-verify)
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Ensure SELECT matches ID
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Ensure UPDATE matches ID (redundant but safe)
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
