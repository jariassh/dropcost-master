-- EMERGENCY RESTORE ADMIN ACCESS
-- 1. Restore SuperAdmin role for specific email
UPDATE public.users SET rol = 'superadmin' WHERE email = 'jariash.freelancer@gmail.com';

-- 2. Sync metadata to ensure JWT/Auth table has the correct role
UPDATE auth.users a
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('rol', u.rol)
FROM public.users u
WHERE a.id = u.id;

-- 3. Robust is_admin function (Non-recursive)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin')
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data ->> 'rol') IN ('admin', 'superadmin')
    )
  );
END;
$$;

-- 4. Restore Core Admin Policies
-- USERS Table
DROP POLICY IF EXISTS "dc_admin_users_all" ON public.users;
DROP POLICY IF EXISTS "dc_admin_users_view" ON public.users;
DROP POLICY IF EXISTS "Admin view all users" ON public.users;
CREATE POLICY "dc_admin_users_all" ON public.users FOR ALL USING (public.is_admin());

-- REFERIDOS_LIDERES Table
DROP POLICY IF EXISTS "dc_admin_lideres_all" ON public.referidos_lideres;
DROP POLICY IF EXISTS "dc_admin_referral_view" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Admins view all lideres" ON public.referidos_lideres;
CREATE POLICY "dc_admin_referral_view" ON public.referidos_lideres FOR ALL USING (public.is_admin());

-- REFERIDOS_USUARIOS Table
DROP POLICY IF EXISTS "dc_admin_referentes_all" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "dc_admin_referral_users_view" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Admins view all referred users" ON public.referidos_usuarios;
CREATE POLICY "dc_admin_referral_users_view" ON public.referidos_usuarios FOR ALL USING (public.is_admin());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
