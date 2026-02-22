-- Migration: Cleanup and Consolidation of Duplicate Triggers
-- Version: 1.1
-- Description: Unifies 2FA and Password Recovery triggers into the current standards.

-- 1. CONSOLIDACIÓN DE 2FA: Migrar de 2FA_CODIGO_CONFIRMACION a AUTH_2FA
-- Mover asociaciones de plantillas
UPDATE public.email_plantillas_triggers
SET trigger_id = (SELECT id FROM public.email_triggers WHERE codigo_evento = 'AUTH_2FA')
WHERE trigger_id = (SELECT id FROM public.email_triggers WHERE codigo_evento = '2FA_CODIGO_CONFIRMACION')
AND EXISTS (SELECT 1 FROM public.email_triggers WHERE codigo_evento = 'AUTH_2FA');

-- Eliminar el disparador antiguo
DELETE FROM public.email_triggers WHERE codigo_evento = '2FA_CODIGO_CONFIRMACION';

-- 2. CONSOLIDACIÓN DE CONTRASEÑA: Migrar de PASSWORD_RECOVERY a USUARIO_OLVIDO_CONTRASENA
-- Mover asociaciones de plantillas
UPDATE public.email_plantillas_triggers
SET trigger_id = (SELECT id FROM public.email_triggers WHERE codigo_evento = 'USUARIO_OLVIDO_CONTRASENA')
WHERE trigger_id = (SELECT id FROM public.email_triggers WHERE codigo_evento = 'PASSWORD_RECOVERY')
AND EXISTS (SELECT 1 FROM public.email_triggers WHERE codigo_evento = 'USUARIO_OLVIDO_CONTRASENA');

-- Eliminar el disparador antiguo
DELETE FROM public.email_triggers WHERE codigo_evento = 'PASSWORD_RECOVERY';

-- 3. ACTUALIZAR INFO DE AUTH_2FA (Asegurar que tenga las variables correctas)
UPDATE public.email_triggers
SET variables_disponibles = '["${usuario_nombre}", "${usuario_email}", "${codigo}", "${expira_en}"]'
WHERE codigo_evento = 'AUTH_2FA';
