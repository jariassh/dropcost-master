-- Migración: Soporte para carpetas y estados en Email Templates
-- Descripción: Añade columnas para organización jerárquica y estados de archivado.

DO $$ 
BEGIN
    -- Añadir columna is_folder
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'is_folder') THEN
        ALTER TABLE public.email_templates ADD COLUMN is_folder BOOLEAN DEFAULT false;
    END IF;

    -- Añadir columna parent_id para carpetas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'parent_id') THEN
        ALTER TABLE public.email_templates ADD COLUMN parent_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE;
    END IF;

    -- Añadir columna status (activo, archivado)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'status') THEN
        ALTER TABLE public.email_templates ADD COLUMN status VARCHAR DEFAULT 'activo' CHECK (status IN ('activo', 'archivado'));
    END IF;

    -- Añadir columna updated_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'updated_by') THEN
        ALTER TABLE public.email_templates ADD COLUMN updated_by UUID REFERENCES public.users(id);
    END IF;
END $$;

-- Índice para búsquedas por carpeta
CREATE INDEX IF NOT EXISTS idx_email_templates_parent ON public.email_templates(parent_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON public.email_templates(status);
