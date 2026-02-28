# Reporte Backend: Integración Shopify - Sync & Attribution
**Fecha:** 2026-02-28
**Agente:** Backend Engineer

---

## Tareas Completadas

### 1. ✅ Edge Function `sync-shopify-backfill` (NUEVA)
**Archivo:** `supabase/functions/integraciones/sync-shopify-backfill/index.ts`

- Implementada con **Shopify GraphQL Admin API** (versión 2024-10).
- **Paginación segura**: Procesa hasta 2,000 órdenes por ejecución (páginas de 50).
- **Desencriptación real** de tokens usando `crypto.ts` existente (AES-256-GCM).
- **Lógica de atribución**:
  - Nivel 1 (Exacto): Extrae `fbclid` desde `customerJourneySummary`.
  - Nivel 2 (UTM): Extrae `source`, `medium`, `campaign` de los parámetros UTM.
- **Mapeo SKU → Costeo**: Vincula automáticamente órdenes con costeos vía `product_id_shopify`.
- **Upsert idempotente**: Constraint `tienda_id + shopify_order_id`.

### 2. ✅ Webhook `webhook-shopify` (MEJORADO)
**Archivo:** `supabase/functions/webhook-shopify/index.ts`

- Fix de campo `shopify_product_id` → `product_id_shopify` (alineación con staging).
- Log cuando `landing_site` es null para tracking de atribución pendiente.

### 3. ✅ Migración: Campos Dropi faltantes en `orders`
**Archivo:** `supabase/migrations/20260228000000_add_dropi_fields_to_orders.sql`

Se detectaron **10 campos faltantes** de los 17 que mapea el frontend. Se agregaron:

| Campo | Tipo | Propósito |
|---|---|---|
| `guia_transporte` | TEXT | Número de guía del envío |
| `transportadora` | TEXT | Empresa transportadora |
| `novedad` | TEXT | Novedad reportada en logística |
| `valor_compra` | NUMERIC(10,2) | Costo de productos según Dropi |
| `precio_flete` | NUMERIC(10,2) | Costo del flete |
| `costo_devolucion` | NUMERIC(10,2) | Costo de devolución |
| `comision_dropi` | NUMERIC(10,2) | Comisión de plataforma |
| `total_proveedor` | NUMERIC(10,2) | Total a precio de proveedor |
| `cliente_email` | TEXT | Email del cliente |
| `fecha_dropi` | TIMESTAMPTZ | Fecha del registro en Dropi |
| `fecha_novedad` | TIMESTAMPTZ | Fecha de la novedad |
| `categorias` | TEXT | Categorías del producto |

Además se crearon índices parciales y se actualizó el CHECK constraint de `origen`.

### 4. ✅ Fix Frontend: Alineación de MAPPABLE_FIELDS
**Archivo:** `src/pages/app/SincronizarPage.tsx`

Se corrigieron **5 keys desalineados** entre el frontend y la BD:
- `nombre_cliente` → `cliente_nombre`
- `telefono_cliente` → `cliente_telefono`
- `email_cliente` → `cliente_email`
- `departamento_destino` → `cliente_departamento`
- `ciudad_destino` → `cliente_ciudad`

> **Nota:** Este fix del frontend lo hice como parte de la auditoría de integridad DB↔Frontend, siguiendo el principio "que la data fluya correctamente end-to-end". Es un fix de datos, no de componentes visuales.

---

## Tabla `orders` - Estado Final (31 columnas)

**Columnas Core (existían):** `id`, `tienda_id`, `usuario_id`, `costeo_id`, `shopify_order_id`, `order_number`, `fecha_orden`, `estado_pago`, `estado_logistica`, `cliente_nombre`, `cliente_telefono`, `cliente_ciudad`, `cliente_departamento`, `total_orden`, `cantidad_items`, `origen`, `external_id`, `created_at`, `updated_at`

**Columnas Dropi (nuevas):** `guia_transporte`, `transportadora`, `novedad`, `valor_compra`, `precio_flete`, `costo_devolucion`, `comision_dropi`, `total_proveedor`, `cliente_email`, `fecha_dropi`, `fecha_novedad`, `categorias`

---

## Pendientes para próxima iteración
- [ ] Deploy de `sync-shopify-backfill` a staging
- [ ] Implementar fallback GraphQL real en webhook
