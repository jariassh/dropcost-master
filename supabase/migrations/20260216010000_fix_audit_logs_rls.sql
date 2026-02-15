-- Fix Audit Logs RLS policies
-- Ensure users can view their own activity history

-- 1. Enable RLS (just in case)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;

-- 3. Create policies
-- Policy: Admin can view all logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (rol = 'admin' OR rol = 'superadmin')
        )
    );

-- Policy: User can view ONLY their own logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

-- Policy: User can insert logs (Critical)
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

-- 4. Enable Realtime if not already enabled (idempotent usually)
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
begin;
  drop publication if exists audit_logs_publication;
  create publication audit_logs_publication for table public.audit_logs;
commit;
