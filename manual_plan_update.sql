-- Manual Plan Update Script
-- Execute this in Supabase SQL Editor to activate the Pro plan for the test user

UPDATE public.users
SET 
    plan_id = 'plan_pro',
    estado_suscripcion = 'activa',
    plan_expires_at = '2026-03-15T23:43:00Z',
    updated_at = NOW()
WHERE id = '18b31076-cbf7-45f3-b363-3f1d7dc22523';

-- Verify the update
SELECT id, email, plan_id, estado_suscripcion, plan_expires_at
FROM public.users
WHERE id = '18b31076-cbf7-45f3-b363-3f1d7dc22523';
