-- ATOMIC FIX: Email System & RLS Robustness
-- Description: Fixes the is_admin function to be more robust, updates RLS for email system, 
--              and ensures the domain and associations are correct.

-- 1. Robust is_admin() (Metadata + DB Fallback)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try JWT first (fastest)
  IF (auth.jwt() -> 'user_metadata' ->> 'rol') IN ('admin', 'superadmin') THEN
    RETURN true;
  END IF;
  
  -- Fallback to DB check (bypass recursion via security definer and search_path)
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'superadmin')
  );
END;
$$;

-- 2. Ensure Email Tables have robust RLS
-- email_triggers
DROP POLICY IF EXISTS "email_triggers_all_admin" ON public.email_triggers;
CREATE POLICY "email_triggers_all_admin" ON public.email_triggers
FOR ALL USING (public.is_admin());

-- email_plantillas_triggers
DROP POLICY IF EXISTS "email_plantillas_triggers_admin" ON public.email_plantillas_triggers;
DROP POLICY IF EXISTS "email_plantillas_triggers_read" ON public.email_plantillas_triggers;
CREATE POLICY "email_plantillas_triggers_admin" ON public.email_plantillas_triggers
FOR ALL USING (public.is_admin());

-- email_historial
DROP POLICY IF EXISTS "email_historial_read_admin" ON public.email_historial;
CREATE POLICY "email_historial_read_admin" ON public.email_historial
FOR SELECT USING (public.is_admin());

-- configuracion_global (Lenient read for authenticated)
DROP POLICY IF EXISTS "Lectura pública para autenticados" ON public.configuracion_global;
CREATE POLICY "Lectura pública para autenticados" ON public.configuracion_global
FOR SELECT TO authenticated USING (true);

-- 3. Fix Domain and Template Associations (AGAIN, to be 100% sure)
UPDATE public.configuracion_global SET email_domain = 'dropcost.jariash.com';

DO $$
DECLARE
    v_template_id uuid;
    v_trigger_id uuid;
BEGIN
    -- Association for USUARIO_REGISTRADO
    SELECT id INTO v_template_id FROM public.email_templates WHERE slug = 'BIENVENIDO_A_DROPCOST_MASTER' LIMIT 1;
    SELECT id INTO v_trigger_id FROM public.email_triggers WHERE codigo_evento = 'USUARIO_REGISTRADO' LIMIT 1;
    
    IF v_template_id IS NOT NULL AND v_trigger_id IS NOT NULL THEN
        INSERT INTO public.email_plantillas_triggers (plantilla_id, trigger_id, activo)
        VALUES (v_template_id, v_trigger_id, true)
        ON CONFLICT (plantilla_id, trigger_id) DO UPDATE SET activo = true;
    END IF;

    -- Association for 2FA
    SELECT id INTO v_template_id FROM public.email_templates WHERE slug = 'CODIGO_DE_VERIFICACION_2FA' OR name ILIKE '%2FA%' LIMIT 1;
    SELECT id INTO v_trigger_id FROM public.email_triggers WHERE codigo_evento = '2FA_CODIGO_CONFIRMACION' LIMIT 1;
    
    IF v_template_id IS NOT NULL AND v_trigger_id IS NOT NULL THEN
        INSERT INTO public.email_plantillas_triggers (plantilla_id, trigger_id, activo)
        VALUES (v_template_id, v_trigger_id, true)
        ON CONFLICT (plantilla_id, trigger_id) DO UPDATE SET activo = true;
    END IF;

    RAISE NOTICE 'RLS and Associations fixed.';
END $$;
