-- Add mjml_content column to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS mjml_content TEXT;

-- Update description to clarify it's optional
COMMENT ON COLUMN public.email_templates.mjml_content IS 'Código fuente en formato MJML para edición responsiva.';
