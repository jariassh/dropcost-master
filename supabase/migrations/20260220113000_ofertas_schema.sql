-- Migration: Add Ofertas table
-- Description: Stores irreversible offers data and removes unnecessary status fields.
-- Date: 2026-02-20

CREATE TABLE IF NOT EXISTS public.ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
    costeo_id UUID REFERENCES public.costeos(id) ON DELETE SET NULL,
    nombre_producto VARCHAR NOT NULL,
    tipo_estrategia VARCHAR NOT NULL CHECK (tipo_estrategia IN ('descuento', 'bundle', 'obsequio')),
    
    -- Configuración JSON (Contiene discountConfig, bundleConfig o giftConfig)
    configuracion_json JSONB NOT NULL DEFAULT '{}',
    
    ganancia_estimada NUMERIC(15,2) DEFAULT 0,
    margen_estimado_porcentaje NUMERIC(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users manage own ofertas" ON public.ofertas;
CREATE POLICY "Users manage own ofertas" ON public.ofertas 
    FOR ALL USING (usuario_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_ofertas_usuario ON public.ofertas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_tienda ON public.ofertas(tienda_id);
