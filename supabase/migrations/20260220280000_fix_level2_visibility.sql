-- FIX LEVEL 2 VISIBILITY: Non-recursive red-viewing
-- Description: Allows leaders and admins to see secondary referrals (Level 2) 
--              without triggering infinite RLS recursion.

-- 1. Helper Function: Get IDs of Level 2 referrals (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_level2_user_ids()
RETURNS TABLE (usuario_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_lider_id uuid;
BEGIN
    -- Get lider_id from JWT metadata to be fast and safe
    v_lider_id := (auth.jwt() -> 'user_metadata' ->> 'lider_id')::uuid;
    
    IF v_lider_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT ru2.usuario_id
    FROM public.referidos_usuarios ru2
    WHERE ru2.lider_id IN (
        -- Level 1 leaders (people invited by me who are now leaders)
        SELECT rl.id 
        FROM public.referidos_lideres rl
        WHERE rl.user_id IN (
            SELECT ru1.usuario_id 
            FROM public.referidos_usuarios ru1 
            WHERE ru1.lider_id = v_lider_id
        )
    );
END;
$$;

-- 2. Update RLS on referidos_usuarios to include Level 2 visibility
DROP POLICY IF EXISTS "Lideres view their referred users" ON public.referidos_usuarios;

-- Policy: Admin/Superadmin (Full power, no restrictions)
-- (Already handled by dc_admin_referral_users_view in nuclear_rls_fix)

-- Policy: Leader view their direct and indirect (Level 2) referrals
CREATE POLICY "Lideres view their network" ON public.referidos_usuarios
FOR SELECT USING (
    -- Level 1: Direct referrals
    lider_id::text = (auth.jwt() -> 'user_metadata' ->> 'lider_id')
    OR
    -- Level 2: Referral of my referrals
    usuario_id IN (SELECT public.get_my_level2_user_ids())
);

-- 3. Update RLS on referidos_lideres to allow viewing direct referrals' leader profiles (for Level 2 display)
DROP POLICY IF EXISTS "Lideres view their level 2 metrics" ON public.referidos_lideres;

CREATE POLICY "Lideres view sub-leaders" ON public.referidos_lideres
FOR SELECT USING (
    user_id IN (
        SELECT ru.usuario_id 
        FROM public.referidos_usuarios ru
        WHERE ru.lider_id::text = (auth.jwt() -> 'user_metadata' ->> 'lider_id')
    )
);

GRANT EXECUTE ON FUNCTION public.get_my_level2_user_ids() TO authenticated, service_role;
