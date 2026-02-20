-- Migración: Actualizar tabla costeos para control de cuota y flujo Mis Costeos
-- Fecha: 2026-02-20

BEGIN;

-- 1. Agregar usuario_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='usuario_id') THEN
        ALTER TABLE public.costeos ADD COLUMN usuario_id UUID REFERENCES public.users(id);
    END IF;
END $$;

-- 2. Poblar usuario_id basándose en la tienda (integridad de datos antiguos)
UPDATE public.costeos c
SET usuario_id = t.usuario_id
FROM public.tiendas t
WHERE c.tienda_id = t.id AND c.usuario_id IS NULL;

-- 3. Hacer usuario_id NOT NULL después de poblar
ALTER TABLE public.costeos ALTER COLUMN usuario_id SET NOT NULL;

-- 4. Renombrar columnas para coincidir con la lógica del negocio (si existen con nombres viejos)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='flete_envio') THEN
        ALTER TABLE public.costeos RENAME COLUMN flete_envio TO costo_flete;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='precio_sugerido') THEN
        ALTER TABLE public.costeos RENAME COLUMN precio_sugerido TO precio_final;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='cpa_promedio') THEN
        ALTER TABLE public.costeos RENAME COLUMN cpa_promedio TO cpa;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='margen_deseado_porcentaje') THEN
        ALTER TABLE public.costeos RENAME COLUMN margen_deseado_porcentaje TO margen;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='tasa_devolucion_porcentaje') THEN
        ALTER TABLE public.costeos RENAME COLUMN tasa_devolucion_porcentaje TO devoluciones;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='otros_gastos') THEN
        ALTER TABLE public.costeos RENAME COLUMN otros_gastos TO gastos_adicionales;
    END IF;
END $$;

-- 5. Agregar el campo de estado
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='costeos' AND column_name='estado') THEN
        ALTER TABLE public.costeos ADD COLUMN estado VARCHAR(20) DEFAULT 'vacio';
    END IF;
END $$;

-- 6. Hacer columnas para que permitan nulos (necesario para el estado 'vacio')
ALTER TABLE public.costeos ALTER COLUMN costo_producto DROP NOT NULL;
ALTER TABLE public.costeos ALTER COLUMN precio_final DROP NOT NULL;
ALTER TABLE public.costeos ALTER COLUMN cpa DROP NOT NULL;

-- 7. Agregar restricción única (Evitar productos duplicados en la misma tienda)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_tienda_producto') THEN
        ALTER TABLE public.costeos ADD CONSTRAINT unique_tienda_producto UNIQUE (tienda_id, nombre_producto);
    END IF;
END $$;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_costeos_usuario_tienda ON public.costeos(usuario_id, tienda_id);

COMMIT;
