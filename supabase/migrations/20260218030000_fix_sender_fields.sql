-- Migración: Asegurar campos de remitente en email_templates
-- Ref: Fix sender persistence

-- 1. Asegurar campo sender_prefix
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'sender_prefix') THEN
        ALTER TABLE email_templates ADD COLUMN sender_prefix VARCHAR DEFAULT 'support';
        COMMENT ON COLUMN email_templates.sender_prefix IS 'Prefijo del correo (ej: ventas, soporte)';
    END IF;
END $$;

-- 2. Asegurar campo sender_name
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'sender_name') THEN
        ALTER TABLE email_templates ADD COLUMN sender_name VARCHAR DEFAULT 'DropCost Notification';
        COMMENT ON COLUMN email_templates.sender_name IS 'Nombre visible del remitente';
    END IF;
END $$;
