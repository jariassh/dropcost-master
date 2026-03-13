-- MIGRATION: Lógica de Roles Automáticos (Suscriptor, Usuario, Cliente)
-- v1.0 - Basado en verificación y plan

-- 1. Función Central de Lógica de Roles
CREATE OR REPLACE FUNCTION public.determine_user_role(
  p_email_verificado BOOLEAN,
  p_plan_id TEXT,
  p_current_rol TEXT
) RETURNS TEXT AS $$
BEGIN
  -- SEGURIDAD: Nunca automatizar cambios sobre roles administrativos o lideres
  IF p_current_rol IN ('admin', 'superadmin', 'lider') THEN
    RETURN p_current_rol;
  END IF;

  -- 1. Suscriptor = Sin verificar
  IF p_email_verificado IS NOT TRUE THEN
    RETURN 'suscriptor';
  END IF;

  -- 2. Usuario = Verificado pero con Plan Gratuito
  -- Asumimos que si no hay plan_id, es el plan base.
  IF p_plan_id IS NULL OR p_plan_id = 'plan_free' OR p_plan_id = '' THEN
    RETURN 'usuario';
  END IF;

  -- 3. Cliente = Con plan activo (cualquier plan diferente al gratuito)
  RETURN 'cliente';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Actualizar handle_new_user (Trigger on auth.users INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    nombres, 
    apellidos, 
    rol, 
    telefono,
    pais,
    plan_id,
    email_verificado,
    estado_suscripcion
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombres', ''), 
    COALESCE(new.raw_user_meta_data->>'apellidos', ''), 
    public.determine_user_role(
      (new.email_confirmed_at IS NOT NULL),
      COALESCE(new.raw_user_meta_data->>'plan_id', 'plan_free'),
      COALESCE(new.raw_user_meta_data->>'rol', 'suscriptor')
    ),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'pais',
    COALESCE(new.raw_user_meta_data->>'plan_id', 'plan_free'),
    (new.email_confirmed_at IS NOT NULL),
    'pendiente'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 3. Función unificada para sincronizar cambios en Auth (Verificación)
CREATE OR REPLACE FUNCTION public.sync_auth_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET 
    email_verificado = (new.email_confirmed_at IS NOT NULL),
    rol = public.determine_user_role(
      (new.email_confirmed_at IS NOT NULL),
      plan_id,
      rol
    ),
    updated_at = now()
  WHERE id = new.id;
  
  RETURN new;
END;
$$;

-- 4. Asegurar que los triggers de Auth usen esta función (Prod y Staging)
DROP TRIGGER IF EXISTS on_auth_user_updated_sync ON auth.users;
CREATE TRIGGER on_auth_user_updated_sync
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_changes();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_sync ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_sync
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_changes();

-- 5. Trigger en public.users para cambios de plan_id
CREATE OR REPLACE FUNCTION public.handle_public_user_role_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo recalculamos si hay cambio en plan_id o email_verificado
  IF (OLD.plan_id IS DISTINCT FROM NEW.plan_id) OR (OLD.email_verificado IS DISTINCT FROM NEW.email_verificado) THEN
    NEW.rol := public.determine_user_role(
      NEW.email_verificado,
      NEW.plan_id,
      NEW.rol
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_public_user_updated_role ON public.users;
CREATE TRIGGER on_public_user_updated_role
  BEFORE UPDATE OF plan_id, email_verificado ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_public_user_role_sync();

-- 6. EJECUTAR REPARACIÓN (BACKFILL)
-- Actualizar todos los usuarios actuales según la nueva lógica
UPDATE public.users
SET rol = public.determine_user_role(email_verificado, plan_id, rol);
