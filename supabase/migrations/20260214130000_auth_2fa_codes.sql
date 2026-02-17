-- Migration: Add Auth Codes table for 2FA
-- Date: 2026-02-14

CREATE TABLE IF NOT EXISTS public.auth_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    code_hash VARCHAR NOT NULL, -- Almacena el código OTP temporal
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad:
-- Importante: Los códigos 2FA son sensibles. Nadie debería poder leerlos directamente desde la API pública.
-- La validación se hace exclusivamente a través de Edge Functions con Service Role.
-- Por lo tanto, NO creamos políticas de SELECT/INSERT/UPDATE para public/authenticated.
-- El acceso queda restringido a nivel de base de datos (Service Role bypasses RLS).

-- Índice para búsquedas rápidas y limpieza
CREATE INDEX IF NOT EXISTS idx_auth_codes_user ON public.auth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON public.auth_codes(expires_at);
