-- ============================================================
-- Migración: Agregar Trigger para Cambio de Email
-- ============================================================

-- 1. Asegurar que existe el trigger para el código de cambio de email
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES (
    'Seguridad - Código de Cambio de Email',
    'Se envía al nuevo correo cuando el usuario solicita cambiar su dirección de email.',
    'AUTH_EMAIL_CHANGE_CODE', 
    'usuario',
    '["${usuario_nombre}", "${email_nuevo}", "${email_anterior}", "${codigo}", "${expira_en}"]',
    'automatico',
    'auth_codes',
    'INSERT'
) ON CONFLICT (codigo_evento) DO NOTHING;

-- 2. Asegurar que existe el trigger EMAIL_CAMBIADO (Ya debería existir, pero reforzamos variables)
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES (
    'Email Cambiado (Confirmación)',
    'Notificación enviada después de que el cambio de email se ha completado con éxito.',
    'EMAIL_CAMBIADO',
    'usuario',
    '["${usuario_nombre}", "${email_nuevo}", "${email_anterior}", "${fecha_cambio}"]',
    'automatico',
    'users',
    'UPDATE'
) ON CONFLICT (codigo_evento) DO UPDATE 
SET variables_disponibles = '["${usuario_nombre}", "${email_nuevo}", "${email_anterior}", "${fecha_cambio}"]';

-- 3. Agregar AUTH_2FA como alias o trigger adicional si es necesario para el admin panel
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES (
    'Seguridad - Código 2FA',
    'Código de verificación para inicio de sesión o acciones sensibles.',
    'AUTH_2FA',
    'usuario',
    '["${usuario_nombre}", "${usuario_email}", "${codigo}", "${expira_en}"]',
    'automatico',
    'auth_codes',
    'INSERT'
) ON CONFLICT (codigo_evento) DO NOTHING;
