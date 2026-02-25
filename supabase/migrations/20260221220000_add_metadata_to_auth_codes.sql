-- Migration: Add metadata to auth_codes to store temporary data (like new emails)
-- Date: 2026-02-21

ALTER TABLE public.auth_codes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
