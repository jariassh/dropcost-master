-- 1. Function to handle new user referral from metadata (Case Insensitive)
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code text;
  referrer_id uuid;
BEGIN
  -- Extract referral code from metadata
  ref_code := new.raw_user_meta_data->>'referred_by';

  -- If valid code exists
  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    -- Find referrer ID (Case Insensitive)
    SELECT id INTO referrer_id
    FROM public.referidos_lideres
    WHERE LOWER(codigo_referido) = LOWER(ref_code);

    -- If referrer found, link user
    IF referrer_id IS NOT NULL THEN
      INSERT INTO public.referidos_usuarios (usuario_id, lider_id, fecha_registro)
      VALUES (new.id, referrer_id, now())
      ON CONFLICT (usuario_id) DO NOTHING;
      
      -- Update referrer stats
      UPDATE public.referidos_lideres
      SET total_usuarios_referidos = (
        SELECT count(*) FROM public.referidos_usuarios WHERE lider_id = referrer_id
      )
      WHERE id = referrer_id;
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- 2. Trigger on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral();


-- 3. RPC Function to increment clicks (Case Insensitive)
CREATE OR REPLACE FUNCTION public.increment_referral_clicks(ref_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record record;
  v_lider_id uuid;
BEGIN
  -- 1. Try to find existing leader (Case Insensitive)
  SELECT id INTO v_lider_id FROM public.referidos_lideres WHERE LOWER(codigo_referido) = LOWER(ref_code);

  -- 2. If not found, check if it's a valid user code and auto-create leader
  IF v_lider_id IS NULL THEN
    SELECT * INTO v_user_record FROM public.users WHERE LOWER(codigo_referido_personal) = LOWER(ref_code);
    
    IF v_user_record.id IS NOT NULL THEN
      INSERT INTO public.referidos_lideres (
        user_id, 
        nombre, 
        email, 
        codigo_referido, 
        porcentaje_comision, 
        estado,
        total_clicks
      ) VALUES (
        v_user_record.id,
        COALESCE(v_user_record.nombres || ' ' || v_user_record.apellidos, 'Usuario ' || ref_code),
        v_user_record.email,
        ref_code,
        15.00,
        'activo',
        1
      ) RETURNING id INTO v_lider_id;
      RETURN;
    END IF;
  END IF;

  -- 3. If leader found (or existed), increment clicks
  IF v_lider_id IS NOT NULL THEN
    UPDATE public.referidos_lideres
    SET total_clicks = COALESCE(total_clicks, 0) + 1
    WHERE id = v_lider_id;
  END IF;
END;
$$;

-- 4. Permissions & Security
GRANT EXECUTE ON FUNCTION public.increment_referral_clicks(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_referral() TO postgres, authenticated, service_role;

-- 5. RLS Policies
ALTER TABLE public.referidos_lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referidos_usuarios ENABLE ROW LEVEL SECURITY;

-- Policy for referidos_lideres
DROP POLICY IF EXISTS "Lideres view own data" ON public.referidos_lideres;
CREATE POLICY "Lideres view own data" ON public.referidos_lideres
FOR SELECT USING (user_id = auth.uid());

-- Policy for referidos_usuarios: A leader can see their referred users
DROP POLICY IF EXISTS "Lideres view their referred users" ON public.referidos_usuarios;
CREATE POLICY "Lideres view their referred users" ON public.referidos_usuarios
FOR SELECT USING (
  lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid())
);

-- Policy for public.users: A leader can see the limited profile of their referred users
DROP POLICY IF EXISTS "Lideres view referred profiles" ON public.users;
CREATE POLICY "Lideres view referred profiles" ON public.users
FOR SELECT USING (
  id IN (
    SELECT usuario_id FROM public.referidos_usuarios 
    WHERE lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = auth.uid())
  )
);
