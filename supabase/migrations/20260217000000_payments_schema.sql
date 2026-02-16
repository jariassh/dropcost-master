-- DropCost Master - Payments Schema
-- Description: Adds structure for payment tracking and subscription expiration.
-- Version: 1.0
-- Date: 2026-02-17

-- 1. Alter USERS table to support subscriptions
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT; -- Reference to external subscription ID if needed (or recurring)

-- 2. Create PAYMENTS table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  provider_payment_id TEXT, -- Mercado Pago Transaction ID
  plan_id TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'semiannual')),
  metadata JSONB DEFAULT '{}', -- Store extra MP info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Users can view their own payments history
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Admins can view all payments
DROP POLICY IF EXISTS "Admins view all payments" ON public.payments;
CREATE POLICY "Admins view all payments" ON public.payments
  FOR SELECT 
  USING (
    exists (select 1 from public.users where id = auth.uid() and rol in ('admin', 'superadmin'))
  );

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_payment_id);
