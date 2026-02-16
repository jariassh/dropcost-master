-- EMERGENCY ROLLBACK: Remove recursive policies that are blocking the database
-- Run this first to restore access to the application.

DROP POLICY IF EXISTS "Lideres view their referrals leader data" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Leaders view Level 2 referrals" ON public.referidos_usuarios;

-- -----------------------------------------------------------------------------
-- FIXED ADMIN ACCESS (Avoids recursion on public.users)
-- -----------------------------------------------------------------------------

-- 1. Helper function to check admin status without triggering RLS loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as system, bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND rol IN ('admin', 'superadmin')
  );
END;
$$;

-- 2. Update users policy to use the helper (Prevents recursion)
DROP POLICY IF EXISTS "Admin view all users" ON public.users;
CREATE POLICY "Admin view all users" ON public.users 
FOR ALL USING (is_admin());

-- -----------------------------------------------------------------------------
-- FIXED REFERRAL NETWORK POLICIES (Non-recursive)
-- -----------------------------------------------------------------------------

-- 3. Allow Lideres to see their OWN record without recursion
DROP POLICY IF EXISTS "Users see own leader record" ON public.referidos_lideres;
CREATE POLICY "Users see own leader record" ON public.referidos_lideres
FOR SELECT USING (user_id = auth.uid());

-- 4. Allow Lideres to see metrics of their Level 1 network (Direct referrals)
-- We check if the user we want to see is in our list of direct referrals.
-- This uses a subquery on referidos_usuarios which is safe if referidos_usuarios policy is safe.
CREATE POLICY "Lideres view their direct referrals metrics" ON public.referidos_lideres
FOR SELECT USING (
    user_id IN (
        SELECT usuario_id FROM public.referidos_usuarios 
        WHERE lider_id = (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid() LIMIT 1)
    )
);

-- 5. Safe policy for referidos_usuarios: See your own record + Level 1 network
-- We avoid querying referidos_lideres recursively.
DROP POLICY IF EXISTS "Leaders view direct referrals" ON public.referidos_usuarios;
CREATE POLICY "Leaders view direct referrals" ON public.referidos_usuarios
FOR SELECT USING (
    usuario_id = auth.uid() OR -- See yourself
    lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid()) -- See your direct guests
);

-- 6. Grant admin full control on everything
CREATE POLICY "Admin full access referidos_lideres" ON public.referidos_lideres FOR ALL USING (is_admin());
CREATE POLICY "Admin full access referidos_usuarios" ON public.referidos_usuarios FOR ALL USING (is_admin());

-- Permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
