-- ============================================================
-- Migración: Campos de Suscripción y Nuevos Triggers de Renovación
-- DropCost Master
-- ============================================================

-- 1. Añadir campos a la tabla users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'fecha_vencimiento_plan') THEN
        ALTER TABLE public.users ADD COLUMN fecha_vencimiento_plan TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'link_pago_manual') THEN
        ALTER TABLE public.users ADD COLUMN link_pago_manual TEXT;
    END IF;
END $$;

-- 2. Registrar nuevos triggers de renovación y actualizar SUSCRIPCION_ACTIVADA
INSERT INTO public.email_triggers (nombre_trigger, descripcion, codigo_evento, categoria, variables_disponibles, tipo_disparador, tabla_origen, evento_tipo)
VALUES 
('Suscripción Activada', 
 'Se dispara cuando el admin activa manualmente el plan de un usuario.', 
 'SUSCRIPCION_ACTIVADA', 'usuario', 
 '["plan_nombre", "plan_precio", "plan_detalles", "fecha_proximo_cobro", "link_pago"]', 
 'automatico', 'users', 'UPDATE'),

('Recordatorio Renovación (2 días)', 
 'Se dispara automáticamente 2 días antes del vencimiento del plan.', 
 'SUSCRIPCION_RENOVACION_2_DIAS', 'usuario', 
 '["plan_nombre", "plan_precio", "plan_detalles", "fecha_proximo_cobro", "link_pago"]', 
 'cron', 'users', 'CRON'),

('Recordatorio Renovación (1 día)', 
 'Se dispara automáticamente 1 día antes del vencimiento del plan.', 
 'SUSCRIPCION_RENOVACION_1_DIA', 'usuario', 
 '["plan_nombre", "plan_precio", "plan_detalles", "fecha_proximo_cobro", "link_pago"]', 
 'cron', 'users', 'CRON'),

('Recordatorio Renovación (Hoy)', 
 'Se dispara el mismo día que vence el plan.', 
 'SUSCRIPCION_RENOVACION_HOY', 'usuario', 
 '["plan_nombre", "plan_precio", "plan_detalles", "fecha_proximo_cobro", "link_pago"]', 
 'cron', 'users', 'CRON')
ON CONFLICT (codigo_evento) DO UPDATE SET
    nombre_trigger = EXCLUDED.nombre_trigger,
    descripcion = EXCLUDED.descripcion,
    variables_disponibles = EXCLUDED.variables_disponibles;

-- Comentario de ayuda
COMMENT ON COLUMN public.users.fecha_vencimiento_plan IS 'Fecha en la que vence el acceso actual del usuario y debe renovar.';
COMMENT ON COLUMN public.users.link_pago_manual IS 'Enlace personalizado de Mercado Pago para que el usuario realice su renovación manual.';
