-- 0. Crear Bucket de Almacenamiento (opcional, requiere permisos de superuser en Supabase para storage.buckets)
-- Si falla, el administrador debe crearlo manualmente desde el dashboard de Supabase -> Storage -> New Bucket (branding, public=true)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Tabla de Configuración Global
CREATE TABLE IF NOT EXISTS configuracion_global (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- SEO
  meta_title VARCHAR(60) DEFAULT 'DropCost Master - Calculadora de Costos para Dropshipping',
  meta_description VARCHAR(160) DEFAULT 'Calcula costos, márgenes y CPA en tiempo real. La herramienta #1 para optimizar tu dropshipping en LATAM',
  meta_keywords TEXT DEFAULT 'dropshipping, calculadora costos, CPA, margen, ecommerce',
  og_image_url VARCHAR DEFAULT '',
  
  -- Robots
  permitir_indexacion BOOLEAN DEFAULT true,
  permitir_seguimiento BOOLEAN DEFAULT true,
  robots_txt_custom TEXT DEFAULT 'User-agent: *\nAllow: /\nDisallow: /admin',
  
  -- Branding
  favicon_url VARCHAR DEFAULT '',
  logo_principal_url VARCHAR DEFAULT '',
  logo_footer_url VARCHAR DEFAULT '',
  
  -- Colores (CSS Variables)
  color_primary VARCHAR(7) DEFAULT '#0066FF',
  color_primary_dark VARCHAR(7) DEFAULT '#003D99',
  color_primary_light VARCHAR(7) DEFAULT '#E6F0FF',
  
  color_success VARCHAR(7) DEFAULT '#10B981',
  color_warning VARCHAR(7) DEFAULT '#F59E0B',
  color_error VARCHAR(7) DEFAULT '#EF4444',
  
  color_bg_primary VARCHAR(7) DEFAULT '#FFFFFF',
  color_bg_secondary VARCHAR(7) DEFAULT '#F3F4F6',
  color_text_primary VARCHAR(7) DEFAULT '#1F2937',
  color_text_secondary VARCHAR(7) DEFAULT '#6B7280',
  
  -- Sidebar (específicos)
  color_sidebar_bg VARCHAR(7) DEFAULT '#0F172A',
  color_sidebar_text VARCHAR(7) DEFAULT '#94A3B8',
  
  -- Tracking
  codigo_head TEXT DEFAULT '',
  codigo_footer TEXT DEFAULT '',
  
  -- Información
  nombre_empresa VARCHAR DEFAULT 'DropCost Master',
  descripcion_empresa TEXT DEFAULT 'Plataforma SaaS de costeo para dropshippers enfocada en el mercado de Pago Contra Entrega (COD) en Latinoamérica.',
  sitio_web VARCHAR DEFAULT 'https://dropcostmaster.com',
  email_contacto VARCHAR DEFAULT 'contacto@dropcostmaster.com',
  telefono VARCHAR DEFAULT '',
  pais_operacion VARCHAR(2) DEFAULT 'CO',
  
  -- Redes sociales
  instagram_url VARCHAR DEFAULT '',
  linkedin_url VARCHAR DEFAULT '',
  twitter_url VARCHAR DEFAULT '',
  youtube_url VARCHAR DEFAULT '',
  
  -- Políticas
  terminos_condiciones_url VARCHAR DEFAULT '',
  politica_privacidad_url VARCHAR DEFAULT '',
  
  -- Auditoría
  actualizado_por UUID REFERENCES auth.users(id),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar registro inicial si no existe
INSERT INTO configuracion_global (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Historial de Cambios
CREATE TABLE IF NOT EXISTS configuracion_global_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_modificado VARCHAR NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_admin UUID NOT NULL REFERENCES auth.users(id),
  fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Políticas de RLS (Row Level Security)
ALTER TABLE configuracion_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_global_historial ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen para evitar errores de duplicado
DROP POLICY IF EXISTS "Lectura pública para autenticados" ON configuracion_global;
DROP POLICY IF EXISTS "Edición solo para administradores" ON configuracion_global;
DROP POLICY IF EXISTS "Lectura de historial para administradores" ON configuracion_global_historial;
DROP POLICY IF EXISTS "Inserción de historial para administradores" ON configuracion_global_historial;

-- Recrear políticas
CREATE POLICY "Lectura pública para autenticados"
ON configuracion_global FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Edición solo para administradores"
ON configuracion_global FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'rol') = 'superadmin'
);

CREATE POLICY "Lectura de historial para administradores"
ON configuracion_global_historial FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'rol') = 'superadmin'
);

CREATE POLICY "Inserción de historial para administradores"
ON configuracion_global_historial FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'rol') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'rol') = 'superadmin'
);
