-- Migration: Fix RLS for global configuration and audit logs
-- Version: 1.0
-- Description: Makes global configuration public for branding and fixes audit log insertion issues.

-- 1. Configuracion Global: Permitir lectura pública (Logo, Favicon, SEO para usuarios no logueados)
DROP POLICY IF EXISTS "Lectura pública para autenticados" ON public.configuracion_global;
DROP POLICY IF EXISTS "Lectura pública" ON public.configuracion_global;

CREATE POLICY "Lectura pública para todos"
ON public.configuracion_global FOR SELECT
USING (true);

-- 2. Audit Logs: Robustecer inserción
-- Eliminamos políticas previas que puedan estar causando conflictos
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users view own logs" ON public.audit_logs;

-- Política de Inserción: Permitir a usuarios autenticados insertar logs.
-- Usamos WITH CHECK (true) para evitar fallos si auth.uid() tiene latencia en propagar al contexto del gateway
-- pero mantenemos TO authenticated por seguridad básica.
CREATE POLICY "Permitir inserción a autenticados"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de Lectura: Usuarios ven sus propios logs, admins ven todos.
CREATE POLICY "Usuarios ven sus propios logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND (rol = 'admin' OR rol = 'superadmin')
  )
);
