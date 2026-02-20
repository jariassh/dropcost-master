-- DEFINITIVE RLS & METADATA SYNC: Fix Level 2 and Recursion
-- Description: Ensures all leaders have metadata in JWT and RLS functions are robust.

-- 1. Improved is_admin() - Purely JWT
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin');
$$;

-- 2. Improved get_my_lider_id() - Bypasses RLS recursion by using metadata first
CREATE OR REPLACE FUNCTION public.get_my_lider_id() 
RETURNS uuid 
LANGUAGE plpgsql
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
DECLARE
    v_lider_id uuid;
BEGIN
    -- Try JWT first (fast, safe)
    v_lider_id := (auth.jwt() -> 'user_metadata' ->> 'lider_id')::uuid;
    
    -- Fallback to DB if JWT is missing it (e.g. before refresh)
    IF v_lider_id IS NULL THEN
        SELECT id INTO v_lider_id FROM public.referidos_lideres WHERE user_id = auth.uid();
    END IF;
    
    RETURN v_lider_id;
END;
$$;

-- 3. Dedicated Level 2 IDs Helper - Robust and Non-Recursive
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
    v_lider_id := public.get_my_lider_id();
    
    IF v_lider_id IS NULL THEN
        RETURN;
    END IF;

    -- Return users invited by my direct referrals (who are now leaders)
    RETURN QUERY
    SELECT ru.usuario_id
    FROM public.referidos_usuarios ru
    WHERE ru.lider_id IN (
        SELECT rl.id 
        FROM public.referidos_lideres rl
        WHERE rl.user_id IN (
            -- My level 1 users
            SELECT sub_ru.usuario_id 
            FROM public.referidos_usuarios sub_ru 
            WHERE sub_ru.lider_id = v_lider_id
        )
    );
END;
$$;

-- 4. Full Metadata Sync for ALL users (Admin and Leaders)
DO $$
DECLARE
    u RECORD;
BEGIN
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

-- 5. Updated RLS Policies - Definitively addressing visibility
ALTER TABLE public.referidos_usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lideres view their network" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "dc_admin_referral_users_view" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "dc_referentes_self_view" ON public.referidos_usuarios;

-- Admin: Priority 1
CREATE POLICY "dc_admin_referral_users_view" ON public.referidos_usuarios 
FOR ALL USING (public.is_admin());

-- User: Self
CREATE POLICY "dc_referentes_self_view" ON public.referidos_usuarios 
FOR SELECT USING (usuario_id = auth.uid());

-- Leader: Network (Level 1 & 2)
CREATE POLICY "Lideres view their network" ON public.referidos_usuarios
FOR SELECT USING (
    lider_id = public.get_my_lider_id()
    OR
    usuario_id IN (SELECT public.get_my_level2_user_ids())
);

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_lider_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_level2_user_ids() TO authenticated, service_role;
