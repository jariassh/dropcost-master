-- Allow users to update their own profile rows (e.g. for ultima_actividad)
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);
