-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT,
    accion TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario_id ON public.audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad ON public.audit_logs(entidad);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view all logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND (rol = 'admin' OR rol = 'superadmin')
        )
    );

-- User can view own logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

-- User can insert logs (Critical for audit to work)
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Enable Realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
-- Check if publication exists before creating
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'audit_logs_publication') THEN
    CREATE PUBLICATION audit_logs_publication FOR TABLE public.audit_logs;
  END IF;
END $$;
