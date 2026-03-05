# DATA MODEL: Módulo de Contactos v1.0
**Fecha:** 5 de marzo de 2026
**Autor:** Database Architect

## 1. Definición de Tabla `contacts`

Se ha diseñado la tabla para almacenar la información de los contactos/clientes de cada tienda, manteniendo un estricto aislamiento multicapa.

```sql
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID NOT NULL REFERENCES public.tiendas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    ciudad TEXT,
    departamento TEXT,
    direccion TEXT,
    total_compras NUMERIC(15,2) DEFAULT 0,
    ultima_compra TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 2. Seguridad (Aislamiento Nuclear RLS)

Se han definido políticas que requieren que el `usuario_id` del registro coincida con el `auth.uid()` del usuario autenticado.

*   **SELECT**: `auth.uid() = usuario_id`
*   **INSERT**: `auth.uid() = usuario_id`
*   **UPDATE**: `auth.uid() = usuario_id`
*   **DELETE**: `auth.uid() = usuario_id`

## 3. Índices de Optimización

Para garantizar que el filtrado por tienda y usuario se mantenga bajo los 100ms:
*   `idx_contacts_tienda_id`
*   `idx_contacts_usuario_id`
*   `idx_contacts_email` (Para búsquedas rápidas)

---
**ESTADO:** Pendiente de ejecución manual en Supabase Dashboard.
