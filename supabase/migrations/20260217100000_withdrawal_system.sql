-- Migration: Withdrawal System Schema
-- Description: Adds tables for tracking commissions and withdrawal requests.
-- Date: 2026-02-17

-- 1. Table for Commissions (To track specific earnings)
CREATE TABLE IF NOT EXISTS public.comisiones_referidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lider_id UUID REFERENCES public.referidos_lideres(id) ON DELETE SET NULL, -- Leader receiving the commission
    usuario_referido_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- The user who bought/paid
    monto_usd NUMERIC(15,2) NOT NULL,
    estado VARCHAR DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'canjeada', 'rechazada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table for Withdrawal Requests
CREATE TABLE IF NOT EXISTS public.retiros_referidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    monto_usd NUMERIC(15,2) NOT NULL,
    moneda_destino VARCHAR(3) NOT NULL DEFAULT 'COP', -- Currency they want to receive
    monto_local NUMERIC(15,2) NOT NULL, -- Calculated at request time
    tasa_cambio NUMERIC(15,6) NOT NULL,
    estado VARCHAR DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'rechazado')),
    
    -- Banking details at time of request (snapshots)
    banco_nombre TEXT NOT NULL,
    cuenta_numero TEXT NOT NULL,
    cuenta_tipo TEXT NOT NULL,
    documento_id TEXT NOT NULL, -- DNI/Cedula
    titular_nombre TEXT NOT NULL, -- Account holder name
    
    -- Wise info
    wise_transaction_id TEXT,
    
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_procesamiento TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Banking Info for Users (Profile default)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}';

-- 4. Enable RLS
ALTER TABLE public.comisiones_referidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retiros_referidos ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Commissions: Leaders can view their earnings
DROP POLICY IF EXISTS "Leaders view own commissions" ON public.comisiones_referidos;
CREATE POLICY "Leaders view own commissions" ON public.comisiones_referidos
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.referidos_lideres rl 
        WHERE rl.id = comisiones_referidos.lider_id AND rl.user_id = auth.uid()
    ));

-- Withdrawals: Users manage their own requests
DROP POLICY IF EXISTS "Users view own withdrawals" ON public.retiros_referidos;
CREATE POLICY "Users view own withdrawals" ON public.retiros_referidos
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own withdrawals" ON public.retiros_referidos;
CREATE POLICY "Users create own withdrawals" ON public.retiros_referidos
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin: Can see everything
DROP POLICY IF EXISTS "Admins view all commissions" ON public.comisiones_referidos;
CREATE POLICY "Admins view all commissions" ON public.comisiones_referidos
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')));

DROP POLICY IF EXISTS "Admins view all withdrawals" ON public.retiros_referidos;
CREATE POLICY "Admins view all withdrawals" ON public.retiros_referidos
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_comisiones_lider ON public.comisiones_referidos(lider_id);
CREATE INDEX IF NOT EXISTS idx_retiros_user ON public.retiros_referidos(user_id);
CREATE INDEX IF NOT EXISTS idx_retiros_estado ON public.retiros_referidos(estado);
