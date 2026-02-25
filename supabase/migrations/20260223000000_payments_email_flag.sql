-- DropCost Master - Payments Email Flag
-- Description: Añade bandera de idempotencia para evitar envío duplicado del email de suscripción
-- Date: 2026-02-23

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS email_suscripcion_enviado BOOLEAN DEFAULT false;
