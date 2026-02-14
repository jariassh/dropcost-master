-- Migration: Fix Users RLS Recursion and Notifications Schema
-- Date: 2026-02-14

-- 1. Create Notifications Table (Idempotent)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'alert')),
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);


-- 2. FIX RLS RECURSION IN USERS TABLE
-- The previous policy selected from public.users to check role, causing infinite recursion.
-- We will change it to check user_metadata or just use a simpler check for now.

DROP POLICY IF EXISTS "Admin view all users" ON public.users;

-- New policy: Check role in auth.users metadata (avoids recursion on public.users)
-- Note: This requires the role to be synced to metadata.
CREATE POLICY "Admin view all users" ON public.users FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin')
);

-- Ensure other policies are safe
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

-- Self-update policy for users (to allow them to update their own profile)
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);


-- 3. Verify Users Table Columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='wallet_saldo') THEN
        ALTER TABLE public.users ADD COLUMN wallet_saldo NUMERIC(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='2fa_habilitado') THEN
        ALTER TABLE public.users ADD COLUMN "2fa_habilitado" BOOLEAN DEFAULT false;
    END IF;
END $$;
