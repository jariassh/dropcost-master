-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    subject VARCHAR NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    is_folder BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'activo' CHECK (status IN ('activo', 'archivado')),
    trigger_event VARCHAR, -- Para futuros disparadores
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.users(id)
);

-- RLS Policies
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.email_templates;
DROP POLICY IF EXISTS "Allow all for admins" ON public.email_templates;

CREATE POLICY "Allow read for authenticated users" ON public.email_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all for admins" ON public.email_templates
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_parent ON public.email_templates(parent_id);
