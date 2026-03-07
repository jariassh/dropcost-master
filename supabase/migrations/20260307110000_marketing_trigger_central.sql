-- MIGRACIÓN: Trigger Central de Marketing
-- Descripción: Tablas para despacho configurable de emails por eventos

-- 1. Tabla de Auditoría y Log de Eventos
CREATE TABLE IF NOT EXISTS public.marketing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    variables JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, test, skipped
    is_test_email BOOLEAN DEFAULT false,
    email_service_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'test', 'skipped'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_marketing_events_type ON public.marketing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_marketing_events_status ON public.marketing_events(status);
CREATE INDEX IF NOT EXISTS idx_marketing_events_user ON public.marketing_events(user_id);

-- 2. Tabla de Mapeo: Evento -> Plantilla Default
CREATE TABLE IF NOT EXISTS public.marketing_event_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL UNIQUE,
    template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_event_mappings ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar y ver logs globales
CREATE POLICY "Admins can do everything on marketing_events" 
ON public.marketing_events TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'superadmin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'superadmin'));

CREATE POLICY "Admins can manage mappings" 
ON public.marketing_event_mappings TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'superadmin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'superadmin'));

-- 3. Mapeos iniciales de compatibilidad
DO $$
BEGIN
    INSERT INTO public.marketing_event_mappings (event_type, template_id, enabled)
    VALUES 
    ('user_registered', (SELECT id FROM public.email_templates WHERE name ILIKE '%Bienvenida%' OR name ILIKE '%Welcome%' LIMIT 1), true),
    ('password_reset', (SELECT id FROM public.email_templates WHERE name ILIKE '%Recuperar%' OR name ILIKE '%Password%' LIMIT 1), true),
    ('password_changed', (SELECT id FROM public.email_templates WHERE name ILIKE '%Contrase%a%Actualizada%' OR name ILIKE '%Password%Changed%' LIMIT 1), true),
    ('email_changed', (SELECT id FROM public.email_templates WHERE name ILIKE '%Email%Actualizado%' OR name ILIKE '%Email%Changed%' LIMIT 1), true),
    ('profile_updated', (SELECT id FROM public.email_templates WHERE name ILIKE '%Perfil%Actualizado%' OR name ILIKE '%Profile%Updated%' LIMIT 1), true),
    ('commission_approved', (SELECT id FROM public.email_templates WHERE name ILIKE '%Comisi%n%Aprobada%' OR name ILIKE '%Commission%Approved%' LIMIT 1), true),
    ('2fa_enabled', (SELECT id FROM public.email_templates WHERE name ILIKE '%2FA%' LIMIT 1), true),
    ('verification_code', (SELECT id FROM public.email_templates WHERE name ILIKE '%Verificaci%' LIMIT 1), true)
    ON CONFLICT (event_type) DO NOTHING;
END $$;
