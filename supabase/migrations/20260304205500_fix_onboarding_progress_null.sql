-- Migration: Fix onboarding_progress null constraint
-- Date: 2026-03-04
-- Author: AI Assistant

-- Permite insertar progreso inicial del Launchpad antes de que el usuario haya creado su tienda
ALTER TABLE public.onboarding_progress ALTER COLUMN tienda_id DROP NOT NULL;
