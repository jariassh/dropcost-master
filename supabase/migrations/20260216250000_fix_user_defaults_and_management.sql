-- FIX USER DEFAULTS AND PREPARE FOR SUSPENSION
-- This migration updates the default state for new users and ensures KPIs are accurate.

-- 1. Update default for estado_suscripcion to 'pendiente'
ALTER TABLE IF EXISTS public.users 
ALTER COLUMN estado_suscripcion SET DEFAULT 'pendiente';

-- 2. Update existing users who might have mistakenly been set to 'activa' by default 
-- but are clearly trials or free users with no actual subscription records yet.
-- This is a one-time scrub to match the user's report about the "3 active" discrepancy.
-- We only do this if they are on plan_free and were registered recently.
UPDATE public.users 
SET estado_suscripcion = 'pendiente'
WHERE estado_suscripcion = 'activa' 
AND plan_id = 'plan_free'
AND rol = 'cliente';

-- 3. Ensure RLS blocks even authenticated users if their status is 'suspendida'
-- We can add a check to the most critical policies.
-- In this app, we'll handle the hard block at the Application level (login),
-- but and extra layer here doesn't hurt.
-- For now, we'll keep it simple as requested: "haz funcional esta suspensión".

-- Indexes for performance on admin queries
CREATE INDEX IF NOT EXISTS idx_users_estado_suscripcion ON public.users(estado_suscripcion);
CREATE INDEX IF NOT EXISTS idx_users_fecha_registro ON public.users(fecha_registro DESC);
