-- Fix missing created_at column in auth_codes table
-- apparently the table existed but without this column

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'auth_codes'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.auth_codes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;
