-- Migration: Referral System V3 Configuration & Auto-Promotion
-- Description: Centralized config table and logic for levels, commissions, and automatic leader promotion.

-- 1. Table for Dynamic Configuration
CREATE TABLE IF NOT EXISTS public.sistema_referidos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Comisiones
  comision_nivel_1 NUMERIC(5,2) DEFAULT 15.00, -- % para referidos directos
  comision_nivel_2 NUMERIC(5,2) DEFAULT 5.00,  -- % para referidos de referidos (Líderes)
  
  -- Ascenso a Líder
  referidos_minimo_lider INTEGER DEFAULT 50, -- cantidad de referidos activos necesarios
  
  -- Vigencia
  meses_vigencia_comision INTEGER DEFAULT 12, -- meses de duración de la comisión recurrente
  
  -- Control
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  actualizado_por UUID REFERENCES public.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Audit Table for Config Changes
CREATE TABLE IF NOT EXISTS public.sistema_referidos_cambios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_cambio VARCHAR NOT NULL, -- 'comision_nivel_1', 'comision_nivel_2', etc.
  valor_anterior NUMERIC,
  valor_nuevo NUMERIC,
  usuario_admin UUID NOT NULL REFERENCES public.users(id),
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  descripcion TEXT
);

-- 3. Insert initial configuration (if not exists)
INSERT INTO public.sistema_referidos_config (comision_nivel_1, comision_nivel_2, referidos_minimo_lider, meses_vigencia_comision)
SELECT 15.00, 5.00, 50, 12
WHERE NOT EXISTS (SELECT 1 FROM public.sistema_referidos_config);

-- 4. Enable RLS
ALTER TABLE public.sistema_referidos_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sistema_referidos_cambios ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Everyone can read the config (to show percentages in UI)
DROP POLICY IF EXISTS "Anyone can read referral config" ON public.sistema_referidos_config;
CREATE POLICY "Anyone can read referral config" ON public.sistema_referidos_config
FOR SELECT TO authenticated USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can modify referral config" ON public.sistema_referidos_config;
CREATE POLICY "Admins can modify referral config" ON public.sistema_referidos_config
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol IN ('admin', 'superadmin'))
);

-- 6. Function for Automatic Promotion (Auto-Leader)
CREATE OR REPLACE FUNCTION public.check_and_promote_to_leader(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_min_referidos INTEGER;
  v_actual_referidos INTEGER;
BEGIN
  -- Get min required from config
  SELECT referidos_minimo_lider INTO v_min_referidos FROM public.sistema_referidos_config LIMIT 1;
  
  -- Count active referrals
  SELECT COUNT(*) INTO v_actual_referidos 
  FROM public.referidos_usuarios 
  WHERE lider_id IN (SELECT id FROM public.referidos_lideres WHERE user_id = p_user_id);
  
  -- If reached limit, promote
  IF v_actual_referidos >= v_min_referidos THEN
    UPDATE public.users 
    SET rol = 'lider' 
    WHERE id = p_user_id AND rol = 'cliente';
  END IF;
END;
$$;

-- 7. Update handle_new_user_referral to include promotion check
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code text;
  referrer_id uuid;
  v_user_id uuid;
BEGIN
  -- Extract referral code from metadata
  ref_code := new.raw_user_meta_data->>'referred_by';

  -- If valid code exists
  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    -- Find referrer ID (Case Insensitive)
    SELECT id, user_id INTO referrer_id, v_user_id
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

      -- NEW: Check for automatic promotion
      IF v_user_id IS NOT NULL THEN
        PERFORM public.check_and_promote_to_leader(v_user_id);
      END IF;
    END IF;
  END IF;

  RETURN new;
END;
$$;
