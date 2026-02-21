-- ============================================================
-- Migración: Programar Cron de Recordatorios de Suscripción
-- DropCost Master
-- ============================================================

-- Habilitar extensión pg_cron si no está activa
-- (debe estar habilitada desde el dashboard de Supabase en Database > Extensions)

-- Crear cron job que llama a la Edge Function diariamente a las 9:00 AM UTC (4 AM Col)
-- Requiere pg_cron y pg_net habilitados en Supabase

SELECT cron.schedule(
    'subscription-reminder-daily',        -- Nombre del job (único)
    '0 9 * * *',                          -- Cron expression: todos los días a las 9:00 AM UTC
    $$
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/subscription-reminder-cron',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Para verificar que el job fue creado:
-- SELECT * FROM cron.job WHERE jobname = 'subscription-reminder-daily';

-- Para eliminar si es necesario:
-- SELECT cron.unschedule('subscription-reminder-daily');

COMMENT ON EXTENSION pg_cron IS 'Extensión para programar jobs periódicos en PostgreSQL';
