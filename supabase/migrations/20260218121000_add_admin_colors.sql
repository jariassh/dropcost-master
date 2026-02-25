-- Add Admin Brand Color Variables
ALTER TABLE configuracion_global
ADD COLUMN IF NOT EXISTS color_admin_panel_link VARCHAR(7) DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS color_admin_sidebar_active VARCHAR(7) DEFAULT '#EF4444',
ADD COLUMN IF NOT EXISTS color_admin_sidebar_return VARCHAR(7) DEFAULT '#1F2937';

UPDATE configuracion_global
SET 
  color_admin_panel_link = COALESCE(color_admin_panel_link, '#EF4444'),
  color_admin_sidebar_active = COALESCE(color_admin_sidebar_active, '#EF4444'),
  color_admin_sidebar_return = COALESCE(color_admin_sidebar_return, '#1F2937')
WHERE id = '00000000-0000-0000-0000-000000000001';
