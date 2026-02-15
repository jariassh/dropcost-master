-- Update Audit Logs table to include new fields
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS entidad VARCHAR(50),
ADD COLUMN IF NOT EXISTS entidad_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb; --details already exists as detalles, but I'll keep consistency

-- Rename existing columns if necessary or just use them
-- The existing table has: id, usuario_id, accion, detalles, ip_address, created_at

-- Ensure we have indices for new columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad ON public.audit_logs(entidad);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Update RLS Policies
DROP POLICY IF EXISTS "Admin view logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND (users.rol = 'admin' OR users.rol = 'superadmin')
    )
);

-- Policy to allow users to insert logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT 
TO authenticated
WITH CHECK (true);
