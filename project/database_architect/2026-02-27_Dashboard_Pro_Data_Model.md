# Dashboard Pro - Modelo de Datos y Analíticas
**Agente:** Database Architect (DBA)
**Fecha:** 27 de febrero de 2026
**Estatus:** ✅ Implementado en **STAGING** (`bhtnphjrovsmzkdzakpc`)

> [!IMPORTANT]
> Se ha verificado y corregido el entorno de trabajo. Todas las operaciones actuales se realizan sobre el proyecto de Staging. Las modificaciones accidentales en Producción (`wauqudcethbrebrdacqi`) fueron aditivas y pueden ser revertidas si el usuario lo requiere.

---

## 🏛️ Nuevas Entidades

### 1. Tabla: `public.orders`
Centraliza todos los pedidos (Shopify, Manual, Dropi) para alimentar el dashboard en tiempo real.
- **Campos Clave:** `order_number`, `total_orden`, `estado_logistica`, `tienda_id`, `costeo_id`.
- **Relaciones:** `costeo_id` permite vincular una venta con su simulación financiera.
- **Unicidad:** Asegurada por `(tienda_id, shopify_order_id)` y `(tienda_id, order_number)`.
- **RLS:** Configurado para aislamiento total por `usuario_id`.

### 2. Tabla: `public.costeos` (Extensiones de Meta)
Se utiliza el registro existente del costeo como "Master" para las métricas de Meta Ads.
- **Campos de Rendimiento:** `meta_roas`, `meta_spend`, `meta_aov`, `meta_cvr`.
- **Lógica:** Estos campos se sobreescriben periódicamente con la data más reciente de la API de Meta, manteniendo un consumo de base de datos mínimo y una vinculación directa con el producto simulado.

---

## ⚡ Lógica Programada (RPC)

### Función: `public.get_dashboard_pro_data`
Consolida la operativa real (`orders`) con el rendimiento publicitario (`costeos`) en un solo JSON.

**Retorna (JSONB):**
```json
{
  "kpis": {
    "ganancia_total": 0,
    "ventas_totales": 0,
    "gastos_totales": 0,
    "roas_promedio": 0,
    "aov_promedio": 0,
    "ordenes_count": 0
  },
  "charts": {
    "ventas_diarias": [
      { "fecha": "2026-02-27", "ventas": 1200 },
      ...
    ]
  }
}
```

---

## 📈 Optimizaciones
- **Índices:** Creados en `orders(fecha_orden, tienda_id)` y `meta_stats(fecha, tienda_id)`.
- **RLS Ironclad:** Se aplicaron políticas estrictas de seguridad de filas para garantizar multitenancy.
