-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    entidad TEXT NOT NULL,
    entidad_id TEXT,
    accion TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin can view all logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND (rol = 'admin' OR rol = 'superadmin')
        )
    );

-- User can view own logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

-- User can insert logs (Critical for audit to work)
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

-- Enable Realtime
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
CREATE PUBLICATION audit_logs_publication FOR TABLE public.audit_logs;
