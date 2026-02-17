-- FUNCTION: record_user_activity
-- Automates audit logging, captures client IP accurately, and updates user activity timestamp.

CREATE OR REPLACE FUNCTION public.record_user_activity(
    p_accion TEXT,
    p_entidad TEXT DEFAULT NULL,
    p_entidad_id TEXT DEFAULT NULL,
    p_detalles JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as system to allow updates to users table and audit_logs
AS $$
DECLARE
    v_user_id UUID;
    v_ip_address TEXT;
BEGIN
    -- 1. Get current user ID
    v_user_id := auth.uid();
    
    -- 2. Capture client IP from Supabase/PostgreSQL environment
    -- inet_client_addr() is the standard way to get the connection IP.
    v_ip_address := host(inet_client_addr());

    -- 3. Update the users table with the latest activity timestamp
    IF v_user_id IS NOT NULL THEN
        UPDATE public.users
        SET ultima_actividad = timezone('utc'::text, now())
        WHERE id = v_user_id;
    END IF;

    -- 4. Record the audit log
    INSERT INTO public.audit_logs (
        usuario_id,
        accion,
        entidad,
        entidad_id,
        detalles,
        ip_address,
        created_at
    ) VALUES (
        v_user_id,
        p_accion,
        p_entidad,
        p_entidad_id,
        p_detalles,
        v_ip_address,
        timezone('utc'::text, now())
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.record_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_user_activity TO service_role;
