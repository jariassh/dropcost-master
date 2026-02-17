-- FINAL RECOVERY: Direct RLS for Admin
-- This migration ensures that the database grants total access to admins using Session Metadata.

-- 1. Ensure the 'rol' is correctly synced in auth metadata for all users
UPDATE auth.users a
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('rol', u.rol)
FROM public.users u
WHERE a.id = u.id;

-- 2. Clean up previous policies and functions
DROP POLICY IF EXISTS "dc_users_self_view" ON public.users;
DROP POLICY IF EXISTS "dc_users_self_update" ON public.users;
DROP POLICY IF EXISTS "dc_admin_users_view" ON public.users;
DROP POLICY IF EXISTS "dc_admin_referral_view" ON public.referidos_lideres;
DROP POLICY IF EXISTS "dc_admin_referral_users_view" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "dc_lideres_self_view" ON public.referidos_lideres;
DROP POLICY IF EXISTS "dc_referentes_self_view" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Lideres view their direct referrals metrics" ON public.referidos_lideres;

-- 3. APPLY BULLETPROOF POLICIES (No Functions, No Recursion)
-- These use the JWT directly, which is the safest way to avoid recursion in Supabase.

-- USERS Table
CREATE POLICY "dc_users_self_view" ON public.users 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "dc_users_self_update" ON public.users 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "dc_admin_users_all" ON public.users 
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') );

-- REFERRAL LIDERES Table
CREATE POLICY "dc_lideres_self_view" ON public.referidos_lideres 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "dc_admin_lideres_all" ON public.referidos_lideres 
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') );

-- REFERRAL USUARIOS Table
CREATE POLICY "dc_referentes_self_view" ON public.referidos_usuarios 
FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "dc_admin_referentes_all" ON public.referidos_usuarios 
FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') );

-- 4. Clean up the function to be safe
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
