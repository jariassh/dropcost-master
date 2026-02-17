-- Function to get referrer info securely (bypassing RLS for specific columns)
CREATE OR REPLACE FUNCTION public.get_referrer_info(ref_code text)
RETURNS TABLE (nombres text, apellidos text)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN QUERY
  SELECT u.nombres, u.apellidos
  FROM public.users u
  WHERE u.codigo_referido_personal = ref_code
  LIMIT 1;
END;
$$;

-- Allow public access to this function
GRANT EXECUTE ON FUNCTION public.get_referrer_info(text) TO anon, authenticated;
