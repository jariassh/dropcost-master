-- ============================================================
-- Migración: Agregar columna dias_restantes a users
-- Se actualiza diariamente por el cron subscription-reminder-cron
-- DropCost Master
-- ============================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS dias_restantes INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.users.dias_restantes IS 
'Días restantes del plan activo. Calculado diariamente por el cron subscription-reminder-cron basado en fecha_vencimiento_plan o plan_expires_at usando UTC-5 (hora Colombia).';

-- Inicializar para usuarios activos con fecha de vencimiento ya establecida
UPDATE public.users
SET dias_restantes = GREATEST(0, 
    EXTRACT(DAY FROM (
        COALESCE(fecha_vencimiento_plan, plan_expires_at) 
        - (NOW() AT TIME ZONE 'America/Bogota')::date
    ))::INTEGER
)
WHERE estado_suscripcion = 'activa'
  AND plan_id != 'plan_free'
  AND COALESCE(fecha_vencimiento_plan, plan_expires_at) IS NOT NULL;
