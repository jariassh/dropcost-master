# Análisis Inicial - Arquitectura de Base de Datos
**Agente:** Antigravity DBA
**Fecha:** 2026-02-26
**Proyecto:** DropCost Master - Dashboard Operacional

## 1. Estado Actual vs Requerimientos
He revisado el esquema actual (`20260213_master_schema.sql` y `20260220104500_costeos_schema_update.sql`) y lo he comparado con la `ESPECIFICACION_TECNICA_DASHBOARD_OPERACIONAL_COMPLETA.md`.

### Hallazgos Clave:
- **Tabla `integraciones` existente:** Actualmente existe una tabla genérica para integraciones. Sin embargo, para el dashboard se requieren campos específicos de OAuth y tokens encriptados que justifican las tablas propuestas `shopify_integrations` y `meta_integrations`.
- **Tabla `costeos`:** Ya tiene `meta_campana_id`, pero la nueva especificación pide extenderla con más campos de mapeo (`product_id_shopify`, `product_id_dropi`, etc.).
- **Multi-tenancy:** El sistema ya utiliza `tienda_id` y `usuario_id` para aislamiento, lo cual es compatible con el diseño propuesto.
- **RLS "Nuclear":** Las políticas actuales son sólidas, pero deben aplicarse rigurosamente a las 7 tablas nuevas para evitar fugas de datos.

## 2. Plan de Migración Propuesto

### Fase 1: Extensión de Tablas Existentes
- **`costeos`**: Agregar `campaign_id_meta` (si es diferente a `meta_campana_id`), `product_id_dropi`, `product_id_shopify`. 
  - *Nota:* Validar si `meta_campana_id` existente se puede renombrar o usar como base.

### Fase 2: Nuevas Tablas de Integración
- `shopify_integrations`: Almacenamiento de tokens y configuración de Shopify.
- `meta_integrations`: Almacenamiento de tokens y configuración de Meta Business.

### Fase 3: Tablas de Datos Sincronizados
- `shopify_orders`: Cache de órdenes para evitar llamadas excesivas a la API y permitir reportes históricos.
- `meta_campaigns`: Listado de campañas sincronizadas.
- `meta_campaign_metrics`: Métricas diarias de Meta (spend, conversions, etc.).

### Fase 4: Consolidación y Mapeo
- `dashboard_metrics`: El "Corazón" del dashboard. Consolidación diaria precálculada.
- `campaign_mappings`: Relación explícita para casos donde el mapeo automático falle.

## 3. Estrategia de Performance
- **Índices Compuestos:** Se implementarán índices `(tienda_id, fecha)` en `dashboard_metrics` y `(tienda_id, created_at)` en `shopify_orders`.
- **Denormalización Controlada:** `dashboard_metrics` actuará como una tabla de hechos pre-calculada para asegurar que el dashboard cargue en < 100ms.

## 4. Próximos Pasos
1. Obtener aprobación de Jonathan para este análisis.
2. Coordinar con **Backend Engineer** los tipos de datos exactos que espera recibir de las APIs de Shopify y Meta.
3. Crear la primera migración `20260226_dashboard_core_tables.sql`.

---
*Documento generado automáticamente por Antigravity DBA.*
