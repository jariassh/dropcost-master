-- Migration: Rollback referidos RLS changes
-- Restore the policies to their state before the level1/secdef migrations

-- 1. Drop the policies/functions added by the broken migrations
DROP POLICY IF EXISTS "Leaders view own Level 1 referrals" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Leaders view Level 2 referrals" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Lideres view their referrals leader data" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Leaders view own lider profile" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Users view own referral entry" ON public.referidos_usuarios;
DROP FUNCTION IF EXISTS public.get_my_lider_id();

-- 2. Restore the original Level 2 policy from 20260216190000
CREATE POLICY "Lideres view their referrals leader data" ON public.referidos_lideres
FOR SELECT USING (
    user_id IN (
        SELECT usuario_id FROM public.referidos_usuarios 
        WHERE lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid())
    )
);

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
