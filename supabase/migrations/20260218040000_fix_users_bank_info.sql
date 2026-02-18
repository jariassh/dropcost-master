-- Migración: Asegurar columna bank_info en users
-- Ref: Fix withdrawal system error

-- 1. Asegurar campo bank_info en users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bank_info') THEN
        ALTER TABLE users ADD COLUMN bank_info JSONB DEFAULT '{}'::jsonb;
        COMMENT ON COLUMN users.bank_info IS 'Información bancaria por defecto del usuario para retiros';
    END IF;
END $$;

-- 2. Asegurar que la tabla retiros_referidos tenga las columnas necesarias (Double check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'retiros_referidos' AND column_name = 'banco_nombre') THEN
        ALTER TABLE retiros_referidos ADD COLUMN banco_nombre TEXT;
    END IF;
END $$;
