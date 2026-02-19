-- Add Card Border Variables
ALTER TABLE configuracion_global
ADD COLUMN IF NOT EXISTS color_card_border VARCHAR(7) DEFAULT '#E5E7EB',
ADD COLUMN IF NOT EXISTS dark_card_border VARCHAR(7) DEFAULT '#334155';

UPDATE configuracion_global
SET 
  color_card_border = COALESCE(color_card_border, '#E5E7EB'),
  dark_card_border = COALESCE(dark_card_border, '#334155')
WHERE id = '00000000-0000-0000-0000-000000000001';
