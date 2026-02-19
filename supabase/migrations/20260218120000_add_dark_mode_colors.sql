-- Add Dark Mode Color Variables to configuracion_global
-- RF- branding / Modo Oscuro
-- Fecha: 2026-02-18

ALTER TABLE configuracion_global
-- Fondos Dark
ADD COLUMN IF NOT EXISTS dark_bg_primary VARCHAR(7) DEFAULT '#0F172A',
ADD COLUMN IF NOT EXISTS dark_bg_secondary VARCHAR(7) DEFAULT '#1E293B',
ADD COLUMN IF NOT EXISTS dark_bg_tertiary VARCHAR(7) DEFAULT '#334155',
ADD COLUMN IF NOT EXISTS dark_card_bg VARCHAR(7) DEFAULT '#1E293B',

-- Texto Dark
ADD COLUMN IF NOT EXISTS dark_text_primary VARCHAR(7) DEFAULT '#F1F5F9',
ADD COLUMN IF NOT EXISTS dark_text_secondary VARCHAR(7) DEFAULT '#94A3B8',
ADD COLUMN IF NOT EXISTS dark_text_tertiary VARCHAR(7) DEFAULT '#64748B',

-- Bordes Dark
ADD COLUMN IF NOT EXISTS dark_border VARCHAR(7) DEFAULT '#334155',
ADD COLUMN IF NOT EXISTS dark_border_hover VARCHAR(7) DEFAULT '#475569';

-- Actualizar el registro único con los valores por defecto si ya existía
UPDATE configuracion_global
SET 
  dark_bg_primary = COALESCE(dark_bg_primary, '#0F172A'),
  dark_bg_secondary = COALESCE(dark_bg_secondary, '#1E293B'),
  dark_bg_tertiary = COALESCE(dark_bg_tertiary, '#334155'),
  dark_card_bg = COALESCE(dark_card_bg, '#1E293B'),
  dark_text_primary = COALESCE(dark_text_primary, '#F1F5F9'),
  dark_text_secondary = COALESCE(dark_text_secondary, '#94A3B8'),
  dark_text_tertiary = COALESCE(dark_text_tertiary, '#64748B'),
  dark_border = COALESCE(dark_border, '#334155'),
  dark_border_hover = COALESCE(dark_border_hover, '#475569')
WHERE id = '00000000-0000-0000-0000-000000000001';
