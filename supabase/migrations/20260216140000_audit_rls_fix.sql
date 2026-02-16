-- Add policy to allow users to view their own activity logs
DROP POLICY IF EXISTS "Users view own logs" ON public.audit_logs;
CREATE POLICY "Users view own logs" ON public.audit_logs FOR SELECT USING (usuario_id = auth.uid());
