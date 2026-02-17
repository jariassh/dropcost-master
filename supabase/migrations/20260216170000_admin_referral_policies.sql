-- Migration: Fix RLS Infinite Recursion
-- Description: Replace recursive role checks with a SECURITY DEFINER function to prevent "infinite recursion" errors.

-- 1. Create a security helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND rol IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix the recursive policy on public.users (Root cause)
-- This policy was calling itself through the SELECT on public.users
DROP POLICY IF EXISTS "Admin view all users" ON public.users;
CREATE POLICY "Admin view all users" ON public.users 
FOR ALL USING (public.is_admin());

-- 3. Update referral policies to use the non-recursive check
DROP POLICY IF EXISTS "Admins view all lideres" ON public.referidos_lideres;
CREATE POLICY "Admins view all lideres" ON public.referidos_lideres
FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins view all referred users" ON public.referidos_usuarios;
CREATE POLICY "Admins view all referred users" ON public.referidos_usuarios
FOR ALL USING (public.is_admin());

-- 4. Keep the existing leader policies intact (they are not recursive)
-- "Lideres view own data" on public.referidos_lideres uses (user_id = auth.uid())
-- "Lideres view their referred users" on public.referidos_usuarios uses a subquery but it targets referidos_lideres, not users.
