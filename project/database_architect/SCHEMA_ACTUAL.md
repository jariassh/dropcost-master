# Schema Actual - Base de Datos DropCost
**Agente:** Antigravity DBA
**Fecha:** 2026-02-26

## Tabla: public.users
**Propósito:** Almacena la información de perfil de los usuarios, extendiendo auth.users.
**Columnas Clave:** `id`, `email`, `rol`, `plan_id`, `wallet_saldo`, `codigo_referido_personal`.

## Tabla: public.tiendas
**Propósito:** Entidad central para multi-tenancy.
**Columnas:** `id`, `usuario_id`, `nombre`, `pais`, `moneda`, `active`.
**RLS:** `usuario_id = auth.uid()`.

## Tabla: public.costeos
**Propósito:** Simulador financiero de productos.
**Columnas Clave:** `id`, `tienda_id`, `usuario_id`, `nombre_producto`, `costo_producto`, `cpa`, `precio_final`, `utilidad_neta`.
**RLS:** Basado en `tienda_id` vinculado al usuario.

## Tabla: public.integraciones
**Propósito:** Registro de conexiones con servicios externos.
**Tipos:** `meta_ads`, `dropi`, `shopify`, `acortador`.
**Nota:** Será complementada con tablas específicas para el dashboard.

---
*Para más detalles, ver migraciones en `/supabase/migrations/`.*
