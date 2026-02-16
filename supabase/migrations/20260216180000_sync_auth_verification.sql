-- Sync public.users.email_verificado with auth.users.email_confirmed_at
-- This ensures that when a user confirms their email via Supabase Auth, 
-- the public.users table (used for referrals and profiles) stays accurate.

-- 1. Function to handle auth.users updates
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We synchronize email_verificado based on email_confirmed_at
  UPDATE public.users
  SET 
    email_verificado = (new.email_confirmed_at IS NOT NULL),
    updated_at = now()
  WHERE id = new.id;
  
  RETURN new;
END;
$$;

-- 2. Trigger on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_updated_sync ON auth.users;
CREATE TRIGGER on_auth_user_updated_sync
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_update();

-- 3. Data Patch: Update existing users
UPDATE public.users u
SET email_verificado = (a.email_confirmed_at IS NOT NULL)
FROM auth.users a
WHERE u.id = a.id;

-- 4. Permissions
GRANT EXECUTE ON FUNCTION public.handle_auth_user_update() TO postgres, authenticated, service_role;
