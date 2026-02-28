# Implementación: Tabla de Analítica Cruzada de Costeos

## Resumen
Se ha implementado una nueva sección en el dashboard que permite cruzar la información teórica de los costeos con los datos reales provenientes de Meta Ads y Shopify (vía base de datos).

## Componentes Añadidos/Modificados

### 1. `CostingsAnalyticsTable.tsx`
- **Funcionalidad:** Muestra una tabla detallada con cada producto/campaña.
- **Campos mostrados:**
    - **Producto / Campaña:** Nombre del costeo.
    - **Precio Venta:** El precio objetivo definido en el costeo.
    - **CPA Meta (vs Costeo):** El CPA real calculado (`spend / orders`) comparado con el CPA objetivo.
    - **Flete Costeado:** Valor base del flete.
    - **Órdenes:** Cantidad de órdenes estimadas a partir de ROAS/AOV.
    - **ROAS Real:** Valor actual de ROAS con indicadores de color.
- **Indicadores Visuales:**
    - Iconos de flechas (**ArrowUpRight** / **ArrowDownRight**) que indican si el CPA real está por encima (Rojo - Alerta) o por debajo (Verde - Éxito) del CPA costeado.

### 2. `dashboardService.ts`
- Se actualizó la lógica para recuperar todos los costeos de la tienda.
- Se implementó el cálculo de métricas derivadas (`real_orders`, `real_cpa`) basadas en el gasto y ROAS reportado por la integración de Meta.

### 3. `DashboardPage.tsx`
- Integración de la tabla al final del dashboard para una lectura integral de la operación.

## Próximos Pasos
- Integración real con la base de datos de fletes (Dropi/Logística) una vez se complete la Fase de Excel.
- Activación de filtros por fecha para la tabla comparativa.
