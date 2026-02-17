-- RESTORING ADMIN VISIBILITY (Safe from recursion)
-- This migration restores the ability for admins to see all data without causing loops.

-- 1. Create a safe is_admin function that queries AUTH schema (Avoiding Public schema recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as postgres, bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_user_meta_data->>'rol' IN ('admin', 'superadmin') OR
      raw_app_meta_data->>'rol' IN ('admin', 'superadmin')
    )
  );
END;
$$;

-- 2. Update users policy (Admin sees all)
DROP POLICY IF EXISTS "dc_admin_users_view" ON public.users;
CREATE POLICY "dc_admin_users_view" ON public.users FOR ALL USING (is_admin());

-- 3. Update referral policies (Admin sees all)
DROP POLICY IF EXISTS "dc_admin_referral_view" ON public.referidos_lideres;
CREATE POLICY "dc_admin_referral_view" ON public.referidos_lideres FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "dc_admin_referral_users_view" ON public.referidos_usuarios;
CREATE POLICY "dc_admin_referral_users_view" ON public.referidos_usuarios FOR ALL USING (is_admin());

-- 4. Restore "Direct Referral" visibility for Leaders (Safe, Non-recursive)
-- A leader can see the metrics of their direct recruits.
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
