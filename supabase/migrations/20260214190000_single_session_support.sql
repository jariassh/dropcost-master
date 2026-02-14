-- Migration: Add Session Token for Single Session Enforcement
-- Date: 2026-02-14

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS session_token UUID DEFAULT gen_random_uuid();

-- Update existing users with a random token
UPDATE public.users SET session_token = gen_random_uuid() WHERE session_token IS NULL;

-- Ensure RLS allows users to read their own session token (already covered by "Users view own profile" policy)
-- But we need to ensure they can UPDATE it during login if they are the user.
-- The existing policy "Users update own profile" should cover this if it allows UPDATE on all columns or specific ones.
-- Let's verification: usually we want policies to be explicit.
