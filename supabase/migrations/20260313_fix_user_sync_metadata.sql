-- FIX: Sincronización de teléfono y país en registro de usuario
-- Este script corrige la función handle_new_user para capturar metadatos adicionales de auth.users

-- 1. Actualizar la función del trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    nombres, 
    apellidos, 
    rol, 
    avatar_url,
    telefono,
    pais
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'nombres', 
    new.raw_user_meta_data->>'apellidos', 
    COALESCE(new.raw_user_meta_data->>'rol', 'cliente'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'pais'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 2. Corregir datos existentes (Backfill)
-- Sincronizar teléfono y país para usuarios que los tienen en metadata pero no en la tabla pública
UPDATE public.users u
SET 
  telefono = a.raw_user_meta_data->>'telefono',
  pais = a.raw_user_meta_data->>'pais'
FROM auth.users a
WHERE u.id = a.id
AND (u.telefono IS NULL OR u.pais IS NULL)
AND (a.raw_user_meta_data->>'telefono' IS NOT NULL OR a.raw_user_meta_data->>'pais' IS NOT NULL);
