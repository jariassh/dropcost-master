-- Fix RLS: Restore missing policies for ofertas, integraciones, and comisiones_referidos
-- Root cause: 20260220270000_nuclear_rls_fix.sql dropped all policies on these tables
-- but neglected to recreate policies for ofertas, integraciones, and comisiones_referidos.

-- =============================================
-- TABLE: ofertas
-- =============================================
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Drop any stale policies first
DROP POLICY IF EXISTS "Users manage own ofertas" ON public.ofertas;
DROP POLICY IF EXISTS "dc_admin_ofertas_all" ON public.ofertas;
DROP POLICY IF EXISTS "dc_ofertas_self" ON public.ofertas;

-- Admin: full access
CREATE POLICY "dc_admin_ofertas_all" ON public.ofertas
    FOR ALL USING (public.is_admin());

-- Users: own records only
CREATE POLICY "dc_ofertas_self" ON public.ofertas
    FOR ALL USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

-- =============================================
-- TABLE: integraciones
-- =============================================
ALTER TABLE public.integraciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own integraciones" ON public.integraciones;
DROP POLICY IF EXISTS "dc_admin_integraciones_all" ON public.integraciones;
DROP POLICY IF EXISTS "dc_integraciones_self" ON public.integraciones;

-- Admin: full access
CREATE POLICY "dc_admin_integraciones_all" ON public.integraciones
    FOR ALL USING (public.is_admin());

-- Users: own records only (tied via tienda which belongs to user)
CREATE POLICY "dc_integraciones_self" ON public.integraciones
    FOR ALL USING (
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

-- =============================================
-- TABLE: comisiones_referidos
-- =============================================
ALTER TABLE public.comisiones_referidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own comisiones" ON public.comisiones_referidos;
DROP POLICY IF EXISTS "dc_admin_comisiones_all" ON public.comisiones_referidos;
DROP POLICY IF EXISTS "dc_comisiones_self" ON public.comisiones_referidos;

-- Admin: full access
CREATE POLICY "dc_admin_comisiones_all" ON public.comisiones_referidos
    FOR ALL USING (public.is_admin());

-- Leaders: own commissions (as lider)
CREATE POLICY "dc_comisiones_self" ON public.comisiones_referidos
    FOR SELECT USING (lider_id = public.get_my_lider_id());
