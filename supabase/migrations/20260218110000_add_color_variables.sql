-- ============================================================
-- Migración: Agregar variables de color faltantes a configuracion_global
-- Fecha: 2026-02-18
-- Descripción: Agrega columnas para todas las variables CSS del sistema
--              de diseño que no estaban en la tabla. Permite control
--              total de colores desde el panel de Branding.
-- ============================================================

ALTER TABLE configuracion_global
    -- Semánticos
    ADD COLUMN IF NOT EXISTS color_neutral        TEXT DEFAULT '#6B7280',

    -- Fondos
    ADD COLUMN IF NOT EXISTS color_bg_tertiary    TEXT DEFAULT '#F9FAFB',
    ADD COLUMN IF NOT EXISTS color_card_bg        TEXT DEFAULT '#FFFFFF',

    -- Texto
    ADD COLUMN IF NOT EXISTS color_text_tertiary  TEXT DEFAULT '#9CA3AF',
    ADD COLUMN IF NOT EXISTS color_text_inverse   TEXT DEFAULT '#FFFFFF',

    -- Bordes
    ADD COLUMN IF NOT EXISTS color_border         TEXT DEFAULT '#E5E7EB',
    ADD COLUMN IF NOT EXISTS color_border_hover   TEXT DEFAULT '#D1D5DB',

    -- Sidebar
    ADD COLUMN IF NOT EXISTS color_sidebar_active TEXT DEFAULT '#0066FF';

-- Actualizar el registro existente con los valores por defecto
-- (solo si los campos están vacíos/null)
UPDATE configuracion_global
SET
    color_neutral        = COALESCE(NULLIF(color_neutral, ''), '#6B7280'),
    color_bg_tertiary    = COALESCE(NULLIF(color_bg_tertiary, ''), '#F9FAFB'),
    color_card_bg        = COALESCE(NULLIF(color_card_bg, ''), '#FFFFFF'),
    color_text_tertiary  = COALESCE(NULLIF(color_text_tertiary, ''), '#9CA3AF'),
    color_text_inverse   = COALESCE(NULLIF(color_text_inverse, ''), '#FFFFFF'),
    color_border         = COALESCE(NULLIF(color_border, ''), '#E5E7EB'),
    color_border_hover   = COALESCE(NULLIF(color_border_hover, ''), '#D1D5DB'),
    color_sidebar_active = COALESCE(NULLIF(color_sidebar_active, ''), '#0066FF')
WHERE id = '00000000-0000-0000-0000-000000000001';
