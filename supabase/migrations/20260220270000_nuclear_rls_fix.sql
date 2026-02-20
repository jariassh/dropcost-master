-- NUCLEAR RLS FIX: Programmatic Policy Cleanup + JWT-Only RLS
-- Description: Drops every single policy on core tables to eliminate hidden recursion.
--              Implements RLS using only JWT metadata for zero-table-touch verification.

-- 1. Redefine is_admin() - STRICTLY PURE (No table touches)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only trust the JWT metadata for RLS to avoid recursion loops
  SELECT (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin');
$$;

-- 2. NUCLEAR CLEANUP: Drop ALL policies on targeted tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- We target all tables that might be involved in the circular dependency
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'users', 
            'tiendas', 
            'referidos_lideres', 
            'referidos_usuarios', 
            'costeos', 
            'ofertas',
            'audit_logs',
            'integraciones',
            'comisiones_referidos'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. SYNC METADATA: Ensure all users have their role and leader_id in auth.users
-- This is the foundation for the non-recursive policies below.
DO $$
DECLARE
    u RECORD;
BEGIN
    -- Sync roles and leader info from public.users and public.referidos_lideres to auth.users
    FOR u IN (
        SELECT 
            usr.id, 
            usr.rol, 
            lid.id as lider_id, 
            lid.codigo_referido
        FROM public.users usr
        LEFT JOIN public.referidos_lideres lid ON usr.id = lid.user_id
    ) LOOP
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'rol', u.rol,
                'lider_id', u.lider_id,
                'codigo_referido', u.codigo_referido
            )
        WHERE id = u.id;
    END LOOP;
END $$;

-- 4. APPLY SAFE POLICIES (No table-to-table dependencies)

-- A. USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_admin_users_all" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "dc_users_self_view" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "dc_users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());

-- B. TIENDAS
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_admin_tiendas_all" ON public.tiendas FOR ALL USING (public.is_admin());
CREATE POLICY "dc_tiendas_self_view" ON public.tiendas FOR ALL USING (usuario_id = auth.uid());

-- C. REFERIDOS_LIDERES (The recursion root)
ALTER TABLE public.referidos_lideres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_admin_referral_view" ON public.referidos_lideres FOR ALL USING (public.is_admin());

-- Leader self-view (using its own ID from the JWT)
CREATE POLICY "dc_lideres_self_view" ON public.referidos_lideres 
FOR SELECT USING ( id::text = (auth.jwt() -> 'user_metadata' ->> 'lider_id') );

-- D. REFERIDOS_USUARIOS
ALTER TABLE public.referidos_usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_admin_referral_users_view" ON public.referidos_usuarios FOR ALL USING (public.is_admin());

-- Guest self-view
CREATE POLICY "dc_referentes_self_view" ON public.referidos_usuarios FOR SELECT USING (usuario_id = auth.uid());

-- Leader: View their referred users (using its lider_id from JWT)
CREATE POLICY "Lideres view their referred users" ON public.referidos_usuarios
FOR SELECT USING (
    lider_id::text = (auth.jwt() -> 'user_metadata' ->> 'lider_id')
);

-- E. COSTEOS
ALTER TABLE public.costeos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_admin_costeos_all" ON public.costeos FOR ALL USING (public.is_admin());
-- For users, we still use the join to tiendas which is safe as long as tiendas policy is direct.
CREATE POLICY "dc_costeos_self_view" ON public.costeos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tiendas WHERE tiendas.id = costeos.tienda_id AND tiendas.usuario_id = auth.uid())
);

-- F. AUDIT_LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_admin_audit_all" ON public.audit_logs FOR ALL USING (public.is_admin());

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
