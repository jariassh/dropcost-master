-- Link Bienvenida template to USUARIO_REGISTRADO trigger
DO $$
DECLARE
    v_trigger_id UUID;
    v_template_id UUID;
BEGIN
    -- 1. Get Trigger ID
    SELECT id INTO v_trigger_id FROM public.email_triggers WHERE codigo_evento = 'USUARIO_REGISTRADO' LIMIT 1;
    
    -- 2. Get Template ID (using slug as it's more stable)
    SELECT id INTO v_template_id FROM public.email_templates WHERE slug = 'bienvenida' LIMIT 1;

    IF v_trigger_id IS NOT NULL AND v_template_id IS NOT NULL THEN
        -- Insert association if it doesn't exist
        INSERT INTO public.email_plantillas_triggers (trigger_id, plantilla_id, activo)
        VALUES (v_trigger_id, v_template_id, true)
        ON CONFLICT (trigger_id, plantilla_id) DO UPDATE SET activo = true;
        
        RAISE NOTICE '✅ Vinculación creada: USUARIO_REGISTRADO -> Bienvenida';
    ELSE
        RAISE WARNING '⚠️ No se pudo vincular: Trigger % o Plantilla % no encontrados', v_trigger_id, v_template_id;
    END IF;
END $$;
