# Especificaciones Técnicas - Backend DropCost

## Edge Function: sync_shopify_orders

**Objetivo:** Sincronizar órdenes de Shopify para todas las tiendas activas.

**Trigger:** Cron job (cada 1 hora)

**Lógica:**
1. Obtener todas las integraciones Shopify con estado 'conectada'.
2. Para cada tienda:
   - Consultar la API de Shopify (`/admin/api/2024-01/orders.json`).
   - Filtrar órdenes desde la fecha de la última sincronización.
   - Detectar estados: cancelada, pagada, devuelta.
   - Guardar/Actualizar en `data_shopify_orders`.
3. Actualizar `ultima_sincronizacion` en la tabla `integraciones`.

---

## Edge Function: sync_meta_campaigns

**Objetivo:** Sincronizar gasto y resultados de campañas de Meta Ads.

**Trigger:** Cron job (cada 1 hora)

**Lógica:**
1. Obtener integraciones `meta_ads`.
2. Para cada usuario:
   - Consultar `adaccounts` vinculadas.
   - Obtener `insights` de campañas (gasto, clics, impresiones, acciones).
   - Guardar en `data_meta_ads` con `upsert`.
3. Manejar renovación de token si es necesario.

---

## Cálculo: calculate_daily_metrics

**Objetivo:** Procesar datos crudos para generar KPIs del dashboard.

**Lógica:**
1. Sumar gasto de Meta Ads por tienda/día.
2. Contar ventas reales de Shopify.
3. Calcular:
   - CPA Real = Gasto Meta / Ventas Shopify.
   - ROAS Real = Ingresos / Gasto Meta.
   - % Devoluciones = Órdenes devueltas / Total órdenes.
4. Guardar resultados en `dashboard_metrics`.
