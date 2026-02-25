-- ============================================================
-- Migración: Sistema de Triggers de Email
-- RF-161 a RF-167 | DropCost Master
-- Fecha: 2026-02-18
-- ============================================================

-- ============================================================
-- 1. TABLA: email_triggers
--    Catálogo de los 19 eventos automáticos disponibles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    nombre_trigger VARCHAR NOT NULL,
    descripcion TEXT,
    codigo_evento VARCHAR(60) UNIQUE NOT NULL,

    -- Metadata
    categoria VARCHAR(20) CHECK (categoria IN ('usuario', 'referido', 'pago')),
    variables_disponibles JSONB DEFAULT '[]'::jsonb,
    tipo_disparador VARCHAR(20) DEFAULT 'automatico' CHECK (tipo_disparador IN ('automatico', 'cron')),
    tabla_origen VARCHAR(100),
    evento_tipo VARCHAR(20) CHECK (evento_tipo IN ('INSERT', 'UPDATE', 'CRON')),
    condicion TEXT,

    -- Control
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.email_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_triggers_read_authenticated" ON public.email_triggers;
DROP POLICY IF EXISTS "email_triggers_all_admin" ON public.email_triggers;

CREATE POLICY "email_triggers_read_authenticated" ON public.email_triggers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "email_triggers_all_admin" ON public.email_triggers
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'admin')
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_triggers_codigo ON public.email_triggers(codigo_evento);
CREATE INDEX IF NOT EXISTS idx_email_triggers_categoria ON public.email_triggers(categoria);

-- ============================================================
-- 2. SEED: 19 Triggers automáticos
-- ============================================================

-- USUARIO (10 triggers)
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo, condicion) VALUES

('Usuario Registrado',
 'Se dispara cuando un nuevo usuario completa el registro en la plataforma.',
 'USUARIO_REGISTRADO', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${fecha_registro}", "${codigo_referido}"]',
 'automatico', 'users', 'INSERT', 'INSERT en tabla users'),

('Usuario Olvidó Contraseña',
 'Se dispara cuando un usuario solicita restablecer su contraseña.',
 'USUARIO_OLVIDO_CONTRASENA', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${reset_link}", "${expira_en}"]',
 'automatico', 'password_resets', 'INSERT', 'INSERT en password_resets'),

('2FA - Código de Confirmación',
 'Se dispara cuando se genera un código de verificación 2FA para el usuario.',
 '2FA_CODIGO_CONFIRMACION', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${codigo_2fa}", "${expira_en}"]',
 'automatico', 'auth_2fa_codes', 'INSERT', 'INSERT en auth_2fa_codes'),

('2FA Activado',
 'Se dispara cuando el usuario activa la autenticación de dos factores.',
 '2FA_ACTIVADO', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${fecha_activacion}"]',
 'automatico', 'users', 'UPDATE', 'UPDATE users SET 2fa_habilitado = true'),

('2FA Desactivado',
 'Se dispara cuando el usuario desactiva la autenticación de dos factores.',
 '2FA_DESACTIVADO', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${fecha_desactivacion}"]',
 'automatico', 'users', 'UPDATE', 'UPDATE users SET 2fa_habilitado = false'),

('Perfil Actualizado',
 'Se dispara cuando el usuario actualiza su información de perfil.',
 'PERFIL_ACTUALIZADO', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${fecha_actualizacion}"]',
 'automatico', 'users', 'UPDATE', 'UPDATE en campos de perfil de users'),

('Email Cambiado',
 'Se dispara cuando el usuario cambia su dirección de correo electrónico.',
 'EMAIL_CAMBIADO', 'usuario',
 '["${usuario_nombre}", "${email_nuevo}", "${email_anterior}", "${fecha_cambio}"]',
 'automatico', 'users', 'UPDATE', 'UPDATE users SET email'),

('Suscripción Activada',
 'Se dispara cuando se activa o renueva la suscripción de un usuario.',
 'SUSCRIPCION_ACTIVADA', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${plan_nombre}", "${fecha_inicio}", "${fecha_vencimiento}"]',
 'automatico', 'subscriptions', 'INSERT', 'INSERT en subscriptions con status=activa'),

('Suscripción Por Vencer',
 'Se dispara 3 días antes de que venza la suscripción del usuario (CRON diario).',
 'SUSCRIPCION_POR_VENCER', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${plan_nombre}", "${fecha_vencimiento}", "${dias_restantes}"]',
 'cron', 'subscriptions', 'CRON', 'Suscripciones que vencen en exactamente 3 días'),

('Suscripción Vencida',
 'Se dispara cuando la suscripción de un usuario vence.',
 'SUSCRIPCION_VENCIDA', 'usuario',
 '["${usuario_nombre}", "${usuario_email}", "${plan_nombre}", "${fecha_vencimiento}"]',
 'automatico', 'subscriptions', 'UPDATE', 'UPDATE subscriptions SET status = vencida')
ON CONFLICT (codigo_evento) DO NOTHING;

-- REFERIDOS (7 triggers)
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo, condicion) VALUES

('Referido Registrado',
 'Se dispara cuando un usuario se registra usando el enlace de referido de otro usuario.',
 'REFERIDO_REGISTRADO', 'referido',
 '["${lider_nombre}", "${lider_email}", "${referido_nombre}", "${referido_email}", "${fecha_registro}", "${total_referidos}"]',
 'automatico', 'referidos_usuarios', 'INSERT', 'INSERT en referidos_usuarios'),

('Referido Primer Pago',
 'Se dispara cuando un referido realiza su primer pago de suscripción.',
 'REFERIDO_PRIMER_PAGO', 'referido',
 '["${lider_nombre}", "${lider_email}", "${referido_nombre}", "${monto_comision}", "${fecha_pago}"]',
 'automatico', 'comisiones_referidos', 'INSERT', 'INSERT en comisiones_referidos (primer pago del referido)'),

('Líder Ascendido',
 'Se dispara cuando un usuario asciende al rol de Líder por acumular suficientes referidos.',
 'LIDER_ASCENDIDO', 'referido',
 '["${usuario_nombre}", "${usuario_email}", "${total_referidos}", "${fecha_ascenso}"]',
 'automatico', 'users', 'UPDATE', 'UPDATE users SET rol = lider'),

('Referido Canceló Suscripción',
 'Se dispara cuando un referido cancela su suscripción.',
 'REFERIDO_CANCELO_SUSCRIPCION', 'referido',
 '["${lider_nombre}", "${lider_email}", "${referido_nombre}", "${referido_email}", "${fecha_cancelacion}"]',
 'automatico', 'subscriptions', 'UPDATE', 'UPDATE subscriptions SET status = cancelada (usuario referido)'),

('Próximo Referido Para Líder',
 'Se dispara cuando al líder le faltan pocos referidos para el siguiente hito (CRON diario).',
 'PROXIMO_REFERIDO_PARA_LIDER', 'referido',
 '["${lider_nombre}", "${lider_email}", "${total_referidos}", "${referidos_para_siguiente_hito}", "${siguiente_hito}"]',
 'cron', 'referidos_usuarios', 'CRON', 'Líderes en múltiplos de 10 referidos antes de llegar a 50'),

('Comisión Próxima a Expirar',
 'Se dispara 30 días antes de que expire una comisión pendiente de cobro (CRON diario).',
 'COMISION_PROXIMA_EXPIRAR', 'referido',
 '["${usuario_nombre}", "${usuario_email}", "${monto_comision}", "${fecha_expiracion}", "${dias_restantes}"]',
 'cron', 'comisiones_referidos', 'CRON', 'Comisiones con fecha_expiracion_comision en 30 días'),

('Comisión Expirada',
 'Se dispara cuando una comisión llega a su fecha de expiración sin ser cobrada (CRON diario).',
 'COMISION_EXPIRADA', 'referido',
 '["${usuario_nombre}", "${usuario_email}", "${monto_comision}", "${fecha_expiracion}"]',
 'cron', 'comisiones_referidos', 'CRON', 'Comisiones con fecha_expiracion_comision <= NOW()')
ON CONFLICT (codigo_evento) DO NOTHING;

-- PAGOS (2 triggers)
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo, condicion) VALUES

('Pago de Comisiones Aprobado',
 'Se dispara cuando el admin aprueba una solicitud de retiro de comisiones.',
 'PAGO_COMISIONES_APROBADO', 'pago',
 '["${usuario_nombre}", "${usuario_email}", "${monto_pago}", "${fecha_aprobacion}", "${banco_nombre}", "${numero_cuenta}"]',
 'automatico', 'retiros_referidos', 'UPDATE', 'UPDATE retiros_referidos SET estado = aprobado'),

('Pago de Comisiones Procesado',
 'Se dispara cuando el admin marca como procesado/completado el pago de comisiones.',
 'PAGO_COMISIONES_PROCESADO', 'pago',
 '["${usuario_nombre}", "${usuario_email}", "${monto_pago}", "${fecha_procesado}", "${banco_nombre}", "${numero_cuenta}", "${referencia_pago}"]',
 'automatico', 'retiros_referidos', 'UPDATE', 'UPDATE retiros_referidos SET estado = completado')
ON CONFLICT (codigo_evento) DO NOTHING;

-- ============================================================
-- 3. TABLA: email_plantillas_triggers
--    Asociación N:M entre plantillas y triggers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_plantillas_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    trigger_id UUID NOT NULL REFERENCES public.email_triggers(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    fecha_asociacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plantilla_id, trigger_id)
);

-- RLS
ALTER TABLE public.email_plantillas_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_plantillas_triggers_read" ON public.email_plantillas_triggers;
DROP POLICY IF EXISTS "email_plantillas_triggers_admin" ON public.email_plantillas_triggers;

CREATE POLICY "email_plantillas_triggers_read" ON public.email_plantillas_triggers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "email_plantillas_triggers_admin" ON public.email_plantillas_triggers
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'admin')
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_ept_plantilla ON public.email_plantillas_triggers(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_ept_trigger ON public.email_plantillas_triggers(trigger_id);

-- ============================================================
-- 4. TABLA: email_historial
--    Log de todos los emails enviados por el sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relaciones
    plantilla_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    trigger_id UUID REFERENCES public.email_triggers(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Destinatario
    usuario_email VARCHAR NOT NULL,

    -- Contenido enviado (snapshot)
    asunto_enviado TEXT,
    contenido_html_enviado TEXT,

    -- Remitente usado
    from_email VARCHAR,
    from_name VARCHAR,

    -- Estado
    estado VARCHAR(20) DEFAULT 'enviado' CHECK (estado IN ('enviado', 'fallido', 'rebote')),
    razon_error TEXT,

    -- Tipo de envío
    tipo_envio VARCHAR(20) DEFAULT 'automatico' CHECK (tipo_envio IN ('automatico', 'prueba')),

    -- Timestamp
    fecha_envio TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.email_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_historial_read_admin" ON public.email_historial;
DROP POLICY IF EXISTS "email_historial_insert_service" ON public.email_historial;

CREATE POLICY "email_historial_read_admin" ON public.email_historial
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'admin')
    );

CREATE POLICY "email_historial_insert_service" ON public.email_historial
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_historial_usuario ON public.email_historial(usuario_id);
CREATE INDEX IF NOT EXISTS idx_email_historial_trigger ON public.email_historial(trigger_id);
CREATE INDEX IF NOT EXISTS idx_email_historial_fecha ON public.email_historial(fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_email_historial_estado ON public.email_historial(estado);

-- ============================================================
-- 5. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================
COMMENT ON TABLE public.email_triggers IS 'Catálogo de los 19 eventos automáticos que pueden disparar emails en DropCost Master.';
COMMENT ON TABLE public.email_plantillas_triggers IS 'Asociación N:M entre plantillas de email y triggers. Si no hay asociación, no se envía email.';
COMMENT ON TABLE public.email_historial IS 'Log completo de todos los emails enviados por el sistema, incluyendo pruebas manuales.';
COMMENT ON COLUMN public.email_historial.tipo_envio IS 'automatico = disparado por evento/cron | prueba = enviado manualmente desde el editor de plantillas';
