-- Migration: Fix Referral Lookup and Clicks Fallback
-- Description: Allows referral system to work with default ID slugs (first 8 chars of UUID) and fixes RLS issues.

-- 1. Update get_referrer_info to support fallback ID slugs
CREATE OR REPLACE FUNCTION public.get_referrer_info(ref_code text)
RETURNS TABLE (nombres text, apellidos text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.nombres, u.apellidos
  FROM public.users u
  WHERE LOWER(u.codigo_referido_personal) = LOWER(ref_code)
     OR split_part(u.id::text, '-', 1) = LOWER(ref_code)
  LIMIT 1;
END;
$$;

-- 2. Update increment_referral_clicks to support fallback ID slugs
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
  SELECT id INTO v_lider_id FROM public.referidos_lideres 
  WHERE LOWER(codigo_referido) = LOWER(ref_code)
     OR split_part(user_id::text, '-', 1) = LOWER(ref_code);

  -- 2. If not found, check if it's a valid user code (or ID fallback) and auto-create leader
  IF v_lider_id IS NULL THEN
    SELECT * INTO v_user_record FROM public.users 
    WHERE LOWER(codigo_referido_personal) = LOWER(ref_code)
       OR split_part(id::text, '-', 1) = LOWER(ref_code);
    
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

-- 3. Update handle_new_user_referral trigger function for fallback ID slugs
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code text;
  referrer_id uuid;
  v_lider_user_id uuid;
BEGIN
  -- Extract referral code from metadata
  ref_code := new.raw_user_meta_data->>'referred_by';

  -- If valid code exists
  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    -- Find referrer ID (Support custom code or ID fallback)
    SELECT id, user_id INTO referrer_id, v_lider_user_id
    FROM public.referidos_lideres
    WHERE LOWER(codigo_referido) = LOWER(ref_code)
       OR split_part(user_id::text, '-', 1) = LOWER(ref_code);

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

      -- Check for automatic promotion if promotion function exists
      -- (Wrapped in IF EXISTS check if we want to be safe, but we know it exists from previous migration)
      PERFORM public.check_and_promote_to_leader(v_lider_user_id);
    END IF;
  END IF;

  RETURN new;
END;
$$;
