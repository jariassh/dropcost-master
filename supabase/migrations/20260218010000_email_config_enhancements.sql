-- Migración: Mejoras en la configuración de email y dominio
-- Ref: AdminEmailTemplatesPage enhancements

-- 1. Agregar email_domain a configuracion_global
ALTER TABLE configuracion_global 
ADD COLUMN IF NOT EXISTS email_domain VARCHAR DEFAULT 'dropcost.jariash.com';

-- 2. Agregar sender_prefix a email_templates
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS sender_prefix VARCHAR DEFAULT 'support';

-- 3. Actualizar registro existente con un valor por defecto
UPDATE configuracion_global 
SET email_domain = 'dropcost.jariash.com' 
WHERE email_domain IS NULL;

-- 4. Comentarios para documentación
COMMENT ON COLUMN configuracion_global.email_domain IS 'Dominio base para el envío de correos transaccionales.';
COMMENT ON COLUMN email_templates.sender_prefix IS 'Prefijo del correo del remitente para esta plantilla específica (ej: soporte, ventas).';
