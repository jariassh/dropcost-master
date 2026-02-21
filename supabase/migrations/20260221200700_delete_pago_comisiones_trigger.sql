-- Eliminar trigger redundante PAGO_COMISIONES_PROCESADO
-- Las plantillas asociadas a este trigger quedarán sin trigger asignado
-- pero no se eliminan para no perder contenido

-- 1. Eliminar asociaciones en tabla puente
DELETE FROM email_plantillas_triggers
WHERE trigger_id IN (
    SELECT id FROM email_triggers WHERE codigo_evento = 'PAGO_COMISIONES_PROCESADO'
);

-- 2. Limpiar trigger_event de plantillas que lo tenían
UPDATE email_templates
SET trigger_event = NULL
WHERE trigger_event = 'PAGO_COMISIONES_PROCESADO';

-- 3. Eliminar el trigger
DELETE FROM email_triggers WHERE codigo_evento = 'PAGO_COMISIONES_PROCESADO';
