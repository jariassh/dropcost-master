-- -----------------------------------------------------------------------------
-- Módulo: Email Marketing y Campañas
-- Descripción: Tablas para Listas Inteligentes, Campañas y Cola de Envíos.
-- Fecha: 2026-03-06
-- -----------------------------------------------------------------------------

BEGIN;

-- 1. Tabla: email_segments (Listas Inteligentes / Filtros)
CREATE TABLE IF NOT EXISTS public.email_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla: email_campaigns (Definición de Campañas)
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_id UUID NOT NULL REFERENCES public.email_templates(id),
    segment_id UUID REFERENCES public.email_segments(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla: email_campaign_logs (Cola de Envío Unitario)
CREATE TABLE IF NOT EXISTS public.email_campaign_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    tienda_id UUID NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Receptor
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- Regla Global: TODA query filtra por tienda_id + usuario_id. SIN EXCEPCIONES.
-- -----------------------------------------------------------------------------

-- Políticas para email_segments
DROP POLICY IF EXISTS "Usuarios ven sus propios segmentos" ON public.email_segments;
CREATE POLICY "Usuarios ven sus propios segmentos" ON public.email_segments
    FOR ALL USING (
        usuario_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.tiendas 
            WHERE tiendas.id = email_segments.tienda_id AND tiendas.usuario_id = auth.uid()
        )
    );

-- Políticas para email_campaigns
DROP POLICY IF EXISTS "Usuarios ven sus propias campañas" ON public.email_campaigns;
CREATE POLICY "Usuarios ven sus propias campañas" ON public.email_campaigns
    FOR ALL USING (
        usuario_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.tiendas 
            WHERE tiendas.id = email_campaigns.tienda_id AND tiendas.usuario_id = auth.uid()
        )
    );

-- Políticas para email_campaign_logs
-- El log le pertenece a la campaña y por ende al dueño de la campaña y tienda
DROP POLICY IF EXISTS "Usuarios ven logs de sus campañas" ON public.email_campaign_logs;
CREATE POLICY "Usuarios ven logs de sus campañas" ON public.email_campaign_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.email_campaigns 
            WHERE email_campaigns.id = email_campaign_logs.campaign_id 
            AND (
                email_campaigns.usuario_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.tiendas 
                    WHERE tiendas.id = email_campaigns.tienda_id AND tiendas.usuario_id = auth.uid()
                )
            )
        )
    );

-- -----------------------------------------------------------------------------
-- ÍNDICES (Performance)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_email_segments_tienda ON public.email_segments(tienda_id);
CREATE INDEX IF NOT EXISTS idx_email_segments_usuario ON public.email_segments(usuario_id);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_tienda ON public.email_campaigns(tienda_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_campaign ON public.email_campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_status ON public.email_campaign_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_tienda ON public.email_campaign_logs(tienda_id);

-- -----------------------------------------------------------------------------
-- TRIGGERS: Actualización de updated_at
-- La función update_modified_column() debe existir previamente; si no, la creamos:
-- -----------------------------------------------------------------------------

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
        EXECUTE 'CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $body$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $body$ LANGUAGE plpgsql;';
    END IF;
END $$;

DROP TRIGGER IF EXISTS update_email_segments_modtime ON public.email_segments;
CREATE TRIGGER update_email_segments_modtime
    BEFORE UPDATE ON public.email_segments
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_email_campaigns_modtime ON public.email_campaigns;
CREATE TRIGGER update_email_campaigns_modtime
    BEFORE UPDATE ON public.email_campaigns
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

COMMIT;
