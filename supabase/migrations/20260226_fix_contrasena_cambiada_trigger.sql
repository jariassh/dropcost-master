-- Fix: Insertar trigger CONTRASENA_CAMBIADA y asociarlo a la plantilla correcta

-- 1. Insertar trigger si no existe
INSERT INTO public.email_triggers (
    nombre_trigger, descripcion, codigo_evento, categoria,
    variables_disponibles, tipo_disparador, tabla_origen, evento_tipo
)
VALUES (
    'Contraseña Cambiada con Éxito',
    'Se dispara después de que un usuario actualiza su contraseña satisfactoriamente.',
    'CONTRASENA_CAMBIADA',
    'usuario',
    '["{{nombres}}", "{{usuario_email}}", "{{fecha_actualizacion}}", "{{login_url}}"]',
    'automatico',
    'users',
    'UPDATE'
)
ON CONFLICT (codigo_evento) DO UPDATE SET
    nombre_trigger = EXCLUDED.nombre_trigger,
    descripcion = EXCLUDED.descripcion;

-- 2. Asociar al template CONTRASENA_CAMBIADA
DO $$
DECLARE 
    v_trigger_id UUID;
    v_plantilla_id UUID;
BEGIN
    SELECT id INTO v_trigger_id
    FROM public.email_triggers 
    WHERE codigo_evento = 'CONTRASENA_CAMBIADA';
    
    SELECT id INTO v_plantilla_id
    FROM public.email_templates
    WHERE slug = 'CONTRASENA_CAMBIADA'
    LIMIT 1;
    
    IF v_plantilla_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró plantilla con slug CONTRASENA_CAMBIADA';
    END IF;
    
    -- Limpiar asociaciones anteriores
    DELETE FROM public.email_plantillas_triggers
    WHERE trigger_id = v_trigger_id;
    
    -- Crear asociación correcta
    INSERT INTO public.email_plantillas_triggers (plantilla_id, trigger_id, activo)
    VALUES (v_plantilla_id, v_trigger_id, true);
    
    RAISE NOTICE 'OK: Trigger CONTRASENA_CAMBIADA → Plantilla %', v_plantilla_id;
END;
$$;
