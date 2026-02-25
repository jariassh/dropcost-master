-- ============================================================
-- MASTER FIX: Sincronización de Triggers y Plantillas
-- ============================================================

-- 1. Asegurar que todos los triggers estándar existan
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES 
('Usuario Registrado', 'Se dispara al completar el registro.', 'USUARIO_REGISTRADO', 'usuario', '["nombres", "usuario_email", "fecha_registro", "codigo_referido", "link"]', 'automatico', 'users', 'INSERT'),
('Usuario Olvidó Contraseña', 'Solicitud de restablecimiento de contraseña.', 'USUARIO_OLVIDO_CONTRASENA', 'usuario', '["nombres", "usuario_email", "reset_link", "link", "horas_validez"]', 'automatico', 'auth_password_reset', 'INSERT'),
('Contraseña Cambiada con Éxito', 'Notificación después de actualizar contraseña.', 'CONTRASENA_CAMBIADA', 'usuario', '["nombres", "usuario_email", "fecha_actualizacion", "login_url"]', 'automatico', 'users', 'UPDATE'),
('2FA - Código de Confirmación', 'Código de verificación 2FA.', '2FA_CODIGO_CONFIRMACION', 'usuario', '["nombres", "usuario_email", "codigo_2fa", "codigo", "expira_en"]', 'automatico', 'auth_2fa_codes', 'INSERT'),
('Seguridad - Código 2FA', 'Código de verificación para acciones sensibles.', 'AUTH_2FA', 'usuario', '["nombres", "usuario_email", "codigo", "expira_en"]', 'automatico', 'auth_codes', 'INSERT'),
('Seguridad - Código de Cambio de Email', 'Código enviado al nuevo correo para confirmar cambio.', 'AUTH_EMAIL_CHANGE_CODE', 'usuario', '["nombres", "email_nuevo", "email_anterior", "codigo", "expira_en"]', 'automatico', 'auth_codes', 'INSERT'),
('Seguridad - Solicitud de Activación 2FA', 'Código para activar la seguridad de dos factores.', '2FA_SOLICITUD_ACTIVACION', 'usuario', '["nombres", "usuario_email", "codigo", "expira_en"]', 'automatico', 'auth_codes', 'INSERT'),
('Seguridad - 2FA Desactivado', 'Notificación enviada cuando se desactiva el 2FA.', '2FA_DESACTIVADO', 'usuario', '["nombres", "usuario_email", "fecha_desactivacion"]', 'automatico', 'users', 'UPDATE'),
('Email Cambiado (Confirmación)', 'Notificación de cambio de email exitoso.', 'EMAIL_CAMBIADO', 'usuario', '["nombres", "email_nuevo", "email_anterior", "fecha_cambio"]', 'automatico', 'users', 'UPDATE'),
('Suscripción Activada', 'Plan activado o renovado.', 'SUSCRIPCION_ACTIVADA', 'usuario', '["plan_nombre", "plan_precio", "fecha_proximo_cobro", "link_pago"]', 'automatico', 'users', 'UPDATE'),
('Recordatorio Renovación (2 días)', '2 días antes del vencimiento.', 'SUSCRIPCION_RENOVACION_2_DIAS', 'usuario', '["plan_nombre", "plan_precio", "fecha_proximo_cobro", "link_pago"]', 'cron', 'users', 'CRON'),
('Recordatorio Renovación (1 día)', '1 día antes del vencimiento.', 'SUSCRIPCION_RENOVACION_1_DIA', 'usuario', '["plan_nombre", "plan_precio", "fecha_proximo_cobro", "link_pago"]', 'cron', 'users', 'CRON'),
('Recordatorio Renovación (Hoy)', 'Día del vencimiento.', 'SUSCRIPCION_RENOVACION_HOY', 'usuario', '["plan_nombre", "plan_precio", "fecha_proximo_cobro", "link_pago"]', 'cron', 'users', 'CRON'),
('Referido Registrado', 'Nuevo usuario registrado vía referido.', 'REFERIDO_REGISTRADO', 'referido', '["lider_nombre", "referido_nombre", "fecha_registro"]', 'automatico', 'referidos_usuarios', 'INSERT'),
('Referido Primer Pago', 'Comisión generada por primer pago de referido.', 'REFERIDO_PRIMER_PAGO', 'referido', '["lider_nombre", "referido_nombre", "monto_comision"]', 'automatico', 'comisiones_referidos', 'INSERT'),
('Líder Ascendido', 'Ascenso a rol de Líder.', 'LIDER_ASCENDIDO', 'referido', '["nombres", "total_referidos", "fecha_ascenso"]', 'automatico', 'users', 'UPDATE'),
('Pago de Comisiones Aprobado', 'Retiro de comisiones aprobado.', 'PAGO_COMISIONES_APROBADO', 'pago', '["nombres", "monto_pago", "banco_nombre", "numero_cuenta"]', 'automatico', 'retiros_referidos', 'UPDATE'),
('Pago de Comisiones Procesado', 'Pago de comisiones efectuado.', 'PAGO_COMISIONES_PROCESADO', 'pago', '["nombres", "monto_pago", "referencia_pago"]', 'automatico', 'retiros_referidos', 'UPDATE')
ON CONFLICT (codigo_evento) DO UPDATE SET
    nombre_trigger = EXCLUDED.nombre_trigger,
    descripcion = EXCLUDED.descripcion,
    variables_disponibles = EXCLUDED.variables_disponibles;

-- 2. Vincular automáticamente basándose en Slugs conocidos
DO $$
DECLARE
    r RECORD;
    v_template_id UUID;
BEGIN
    -- Mapeo manual de Trigger -> Slug de Plantilla (Prioridades)
    FOR r IN (
        SELECT 'USUARIO_OLVIDO_CONTRASENA' as ev, ARRAY['RECUPERAR_CONTRASENA', 'recuperar_password', 'reset_password'] as slugs
        UNION ALL SELECT 'CONTRASENA_CAMBIADA', ARRAY['CONTRASENA_CAMBIADA', 'password_changed']
        UNION ALL SELECT 'USUARIO_REGISTRADO', ARRAY['bienvenida', 'welcome']
        UNION ALL SELECT 'AUTH_2FA', ARRAY['2fa', 'codigo_2fa', 'auth_2fa']
        UNION ALL SELECT '2FA_CODIGO_CONFIRMACION', ARRAY['2fa', 'codigo_2fa', 'auth_2fa']
        UNION ALL SELECT 'AUTH_EMAIL_CHANGE_CODE', ARRAY['cambio-email-codigo', 'email_change_code']
        UNION ALL SELECT '2FA_SOLICITUD_ACTIVACION', ARRAY['2FA_SOLICITUD_ACTIVACION', '2FA_ACTIVACION']
        UNION ALL SELECT '2FA_DESACTIVADO', ARRAY['2FA_DESACTIVADO', 'desactivar_2fa']
        UNION ALL SELECT 'EMAIL_CAMBIADO', ARRAY['email-cambiado', 'email_changed']
        UNION ALL SELECT 'SUSCRIPCION_ACTIVADA', ARRAY['suscripcion-activada', 'subscription_active']
        UNION ALL SELECT 'PAGO_COMISIONES_APROBADO', ARRAY['pago-aprobado', 'withdrawal_approved']
        UNION ALL SELECT 'PAGO_COMISIONES_PROCESADO', ARRAY['pago-procesado', 'withdrawal_processed']
        UNION ALL SELECT 'REFERIDO_REGISTRADO', ARRAY['referido-registrado', 'referral_signup']
    ) LOOP
        -- Buscar la primera plantilla que coincida de la lista de slugs
        SELECT id INTO v_template_id 
        FROM public.email_templates 
        WHERE slug = ANY(r.slugs)
        LIMIT 1;

        IF v_template_id IS NOT NULL THEN
            -- Eliminar asociaciones previas de este trigger para no duplicar
            DELETE FROM public.email_plantillas_triggers 
            WHERE trigger_id = (SELECT id FROM public.email_triggers WHERE codigo_evento = r.ev);

            -- Crear asociación
            INSERT INTO public.email_plantillas_triggers (plantilla_id, trigger_id, activo)
            SELECT v_template_id, id, true
            FROM public.email_triggers 
            WHERE codigo_evento = r.ev
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Vinculado Trigger % a Plantilla con Slug(s) %', r.ev, r.slugs;
        ELSE
            RAISE WARNING 'No se encontró plantilla para el Trigger % (se buscó: %)', r.ev, r.slugs;
        END IF;
    END LOOP;
END;
$$;
