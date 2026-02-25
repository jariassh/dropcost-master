-- Eliminar columna sitemap_url si existe, ya que ahora será dinámico
ALTER TABLE configuracion_global 
DROP COLUMN IF EXISTS sitemap_url;
