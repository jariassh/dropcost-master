-- Migration: Standardize Password Email Triggers
-- Version: 1.0
-- Description: Ensures consistent event codes for password-related emails and avoids duplication.

-- 1. Asegurar que el trigger de solicitud existe con el código correcto
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES (
    'Solicitud de Recuperación de Contraseña',
    'Se dispara cuando un usuario solicita el enlace para restablecer su contraseña.',
    'USUARIO_OLVIDO_CONTRASENA',
    'usuario',
    '["${usuario_nombre}", "${usuario_email}", "${reset_link}", "${horas_validez}"]',
    'automatico',
    'auth_password_reset',
    'INSERT'
)
ON CONFLICT (codigo_evento) DO UPDATE SET
    nombre_trigger = EXCLUDED.nombre_trigger,
    descripcion = EXCLUDED.descripcion,
    variables_disponibles = EXCLUDED.variables_disponibles;

-- 2. Asegurar que el trigger de éxito existe
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES (
    'Contraseña Cambiada con Éxito',
    'Se dispara después de que un usuario actualiza su contraseña satisfactoriamente.',
    'CONTRASENA_CAMBIADA',
    'usuario',
    '["${usuario_nombre}", "${usuario_email}", "${fecha_actualizacion}", "${login_url}"]',
    'automatico',
    'users',
    'UPDATE'
)
ON CONFLICT (codigo_evento) DO UPDATE SET
    nombre_trigger = EXCLUDED.nombre_trigger,
    descripcion = EXCLUDED.descripcion,
    variables_disponibles = EXCLUDED.variables_disponibles;

-- 3. Limpiar duplicados antiguos si existen
-- Buscamos triggers que no sigan la nomenclatura estándar
UPDATE public.email_plantillas_triggers
SET trigger_id = (SELECT id FROM public.email_triggers WHERE codigo_evento = 'USUARIO_OLVIDO_CONTRASENA')
WHERE trigger_id IN (SELECT id FROM public.email_triggers WHERE codigo_evento = 'PASSWORD_RECOVERY');

DELETE FROM public.email_triggers WHERE codigo_evento = 'PASSWORD_RECOVERY';
