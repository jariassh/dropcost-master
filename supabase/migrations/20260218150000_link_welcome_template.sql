-- 1. Actualizar el slug visual en email_templates para mayor claridad
UPDATE public.email_templates
SET trigger_event = 'USUARIO_REGISTRADO'
WHERE slug = 'bienvenida';

-- 2. Vincular la plantilla 'bienvenida' al trigger 'USUARIO_REGISTRADO' en el sistema de dispatcher
INSERT INTO public.email_plantillas_triggers (plantilla_id, trigger_id, activo)
SELECT 
    t.id as plantilla_id, 
    tr.id as trigger_id,
    true as activo
FROM public.email_templates t
JOIN public.email_triggers tr ON tr.codigo_evento = 'USUARIO_REGISTRADO'
WHERE t.slug = 'bienvenida'
ON CONFLICT (plantilla_id, trigger_id) DO NOTHING;
