-- Migration: Restore Full Visibility, Self-View Policies and Sync Triggers
-- Description: Ensures admins can see everything, users can see themselves, 
--              and metadata is automatically synced to avoid RLS lockouts.

-- 1. Restore Self-View Policies on critical tables
-- USERS
DROP POLICY IF EXISTS "dc_users_self_view" ON public.users;
CREATE POLICY "dc_users_self_view" ON public.users FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "dc_users_self_update" ON public.users;
CREATE POLICY "dc_users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());

-- REFERIDOS_LIDERES (Self view for normal leaders)
DROP POLICY IF EXISTS "dc_lideres_self_view" ON public.referidos_lideres;
CREATE POLICY "dc_lideres_self_view" ON public.referidos_lideres FOR SELECT USING (user_id = auth.uid());

-- REFERIDOS_USUARIOS (Self view for the referred user)
DROP POLICY IF EXISTS "dc_referentes_self_view" ON public.referidos_usuarios;
CREATE POLICY "dc_referentes_self_view" ON public.referidos_usuarios FOR SELECT USING (usuario_id = auth.uid());

-- PLANS (Update to use standardized is_admin)
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL USING (public.is_admin());

-- 2. Automatic Metadata Sync Trigger
-- This ensures that ANY change to 'rol' in public.users is instantly reflected in auth.users
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('rol', NEW.rol)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_role ON public.users;
CREATE TRIGGER tr_sync_user_role
AFTER UPDATE OF rol ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_auth();

-- 3. Data Integrity Fix for Superadmin
-- Restore role and upgrade plan to Enterprise to resolve "Plan Gratis" perception issues
UPDATE public.users 
SET rol = 'superadmin', 
    plan_id = 'plan_enterprise',
    estado_suscripcion = 'activa'
WHERE email = 'jariash.freelancer@gmail.com';

-- Immediate Sync for existing admins
UPDATE auth.users a
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('rol', u.rol)
FROM public.users u
WHERE a.id = u.id AND u.rol IN ('admin', 'superadmin');
