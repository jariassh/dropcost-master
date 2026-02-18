-- Migración: Agregar sender_name a email_templates
-- Ref: Sender Logic & Preview Refinement

-- 1. Agregar sender_name a email_templates
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS sender_name VARCHAR DEFAULT 'DropCost Notification';

-- 2. Comentarios para documentación
COMMENT ON COLUMN email_templates.sender_name IS 'Nombre visible del remitente (ej: DropCost Ventas).';
