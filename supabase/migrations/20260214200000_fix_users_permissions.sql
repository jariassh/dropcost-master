-- Migration: Fix Users RLS and Enable Realtime
-- Date: 2026-02-14

-- 1. Enable Realtime for users table (so session enforcement hook receives updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;

-- 2. Allow users to update their own profile (including session_token)
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. Allow users to insert their own profile (in case of registration flows)
DROP POLICY IF EXISTS "Users insert own profile" ON public.users;
CREATE POLICY "Users insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
