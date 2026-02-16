-- FINAL FIX: Sync Meta-data + Non-recursive RLS
-- This ensures that your 'admin' role is visible to the database engine via JWT tokens.

-- 1. SYNC ROLES: Copy the role from public.users to auth.users metadata
-- This is what allows the "is_admin()" check to work instantly without querying public.users.
UPDATE auth.users a
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('rol', u.rol)
FROM public.users u
WHERE a.id = u.id;

-- 2. ROBUST is_admin() function
-- This check is now extremely fast and safe because it only looks at the JWT or the metadata table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We prioritize the JWT claim (current session) but fallback to the metadata table
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

-- 3. APPLY POLICIES (Users)
DROP POLICY IF EXISTS "dc_users_self_view" ON public.users;
DROP POLICY IF EXISTS "dc_users_self_update" ON public.users;
DROP POLICY IF EXISTS "dc_admin_users_view" ON public.users;

-- User can see themselves
CREATE POLICY "dc_users_self_view" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "dc_users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());

-- Admin can see EVERYONE
CREATE POLICY "dc_admin_users_view" ON public.users FOR ALL USING (is_admin());

-- 4. APPLY POLICIES (Referrals)
DROP POLICY IF EXISTS "dc_lideres_self_view" ON public.referidos_lideres;
DROP POLICY IF EXISTS "dc_referentes_self_view" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "dc_admin_referral_view" ON public.referidos_lideres;
DROP POLICY IF EXISTS "dc_admin_referral_users_view" ON public.referidos_usuarios;

-- Basics
CREATE POLICY "dc_lideres_self_view" ON public.referidos_lideres FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "dc_referentes_self_view" ON public.referidos_usuarios FOR SELECT USING (usuario_id = auth.uid());

-- Admin Power
CREATE POLICY "dc_admin_referral_view" ON public.referidos_lideres FOR ALL USING (is_admin());
CREATE POLICY "dc_admin_referral_users_view" ON public.referidos_usuarios FOR ALL USING (is_admin());

-- 5. Restore Leader visibility for their network (Non-recursive)
DROP POLICY IF EXISTS "Lideres view their direct referrals metrics" ON public.referidos_lideres;
CREATE POLICY "Lideres view their direct referrals metrics" ON public.referidos_lideres
FOR SELECT USING (
    user_id IN (
        SELECT usuario_id FROM public.referidos_usuarios 
        WHERE lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid())
    )
);

-- Permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
