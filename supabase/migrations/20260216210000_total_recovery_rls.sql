-- 🚨 TOTAL RECOVERY: STOP RECURSION NOW
-- This migration drops ALL problematic policies on users and referrals.
-- Use this to restore basic application functionality.

-- 1. Disable RLS temporarily or simplify it to the basics
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_lideres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Clean up ALL previous (potentially recursive) policies
DROP POLICY IF EXISTS "Lideres view their referrals leader data" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Leaders view Level 2 referrals" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Admin view all users" ON public.users;
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Users see own leader record" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Lideres view their direct referrals metrics" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Leaders view direct referrals" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Admin full access referidos_lideres" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Admin full access referidos_usuarios" ON public.referidos_usuarios;
DROP POLICY IF EXISTS "Admins view all lideres" ON public.referidos_lideres;
DROP POLICY IF EXISTS "Admins view all referred users" ON public.referidos_usuarios;

-- 3. Restore Basic RLS (Safe, Non-recursive)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_usuarios ENABLE ROW LEVEL SECURITY;

-- SAFE POLICY: See yourself (Absolutely no subqueries)
CREATE POLICY "dc_users_self_view" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "dc_users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());

-- SAFE POLICY: Admin (Using JWT metadata to bypass table queries)
-- This assumes raw_user_meta_data->>rol is set, which is standard for this app.
CREATE POLICY "dc_admin_users_view" ON public.users FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') );

-- SAFE REFERRAL POLICIES: Basics only
CREATE POLICY "dc_lideres_self_view" ON public.referidos_lideres FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "dc_referentes_self_view" ON public.referidos_usuarios FOR SELECT USING (usuario_id = auth.uid());

-- 4. Clean up the function to make sure it's not used in current policies
DROP FUNCTION IF EXISTS public.is_admin();

-- 5. Give Admin power via JWT
CREATE POLICY "dc_admin_referral_view" ON public.referidos_lideres FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') );

CREATE POLICY "dc_admin_referral_users_view" ON public.referidos_usuarios FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') );
