-- Update RLS policies to allow Leaders to see metrics for their Level 2 network
-- This is necessary for the referral details modal to show accurate counts.

-- 1. Allow Leaders to see the referidos_lideres entry of their direct referrals
DROP POLICY IF EXISTS "Lideres view their referrals leader data" ON public.referidos_lideres;
CREATE POLICY "Lideres view their referrals leader data" ON public.referidos_lideres
FOR SELECT USING (
    user_id IN (
        SELECT usuario_id FROM public.referidos_usuarios 
        WHERE lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid())
    )
);

-- 2. Allow Leaders to see the referidos_usuarios records of their Level 2 network (referrals of their referrals)
DROP POLICY IF EXISTS "Leaders view Level 2 referrals" ON public.referidos_usuarios;
CREATE POLICY "Leaders view Level 2 referrals" ON public.referidos_usuarios
FOR SELECT USING (
    lider_id IN (
        SELECT id FROM public.referidos_lideres
        WHERE user_id IN (
            SELECT usuario_id FROM public.referidos_usuarios
            WHERE lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid())
        )
    )
);

-- 3. Data Patch: Ensure existing leaders have their user_id set correctly
-- (This is just a safety measure for any records created with old triggers)
UPDATE public.referidos_lideres l
SET user_id = u.id
FROM public.users u
WHERE LOWER(l.email) = LOWER(u.email) AND l.user_id IS NULL;
