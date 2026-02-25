-- CONSOLIDADO: Setup Completo de Avatar para DropCost Master
-- Aplica TODAS las configuraciones necesarias para la subida de fotos de perfil.
-- Es seguro ejecutarlo múltiples veces (idempotente).

-- 1. Añadir columna avatar_url a la tabla users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Crear el bucket 'avatars' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Configurar políticas de Storage (eliminar viejas primero para evitar conflictos)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Avatars v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar v3" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar v3" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar v3" ON storage.objects;

-- Lectura pública (para mostrar avatars en la app)
CREATE POLICY "dc_avatars_public_read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Subida autenticada (solo a tu propia carpeta: {userId}/archivo)
CREATE POLICY "dc_avatars_user_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Actualización autenticada
CREATE POLICY "dc_avatars_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Eliminación autenticada
CREATE POLICY "dc_avatars_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
