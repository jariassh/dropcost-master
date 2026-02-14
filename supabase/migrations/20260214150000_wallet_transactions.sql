-- Migration: Add Wallet Transactions table and RLS policies
-- Date: 2026-02-14

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('referral_bonus', 'withdrawal', 'adjustment')),
    amount NUMERIC(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own transactions" ON public.wallet_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
