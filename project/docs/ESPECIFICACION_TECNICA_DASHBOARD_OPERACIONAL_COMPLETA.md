# ESPECIFICACIÓN TÉCNICA COMPLETA
## Dashboard Operacional DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Estado:** Listo para desarrollo  
**Responsable:** Antigravity (agente IA)  
**Objetivo:** Crear notebook automático de operaciones diarias para dropshippers

---

## 1. VISIÓN GENERAL

### Propósito
Crear un **Dashboard Operacional** que automatice el notebook manual de Iván Caicedo, consolidando datos de Shopify + Meta Ads en una sola vista por tienda. Este es el **diferenciador clave** para justificar la suscripción PRO ($25/mes) vs Excel gratis.

### Valor Proposición
```
ANTES (Excel):
├─ 30 minutos/día manualmente
├─ Riesgo de errores humanos
├─ Sin sincronización automática
└─ No es atractivo como feature de pago

DESPUÉS (Dashboard DropCost):
├─ 0 minutos (completamente automático)
├─ Cero errores, datos consolidados
├─ Sincronización 2x/día automática
└─ Diferenciador real, justifica $25/mes ✅
```

### Diferenciador Competitivo
- **Único en el mercado Latam** para dropshippers COD
- Integra Shopify + Meta Ads en notebook diario
- Cálculos automáticos con datos costeo (simulador)
- Alertas CPA inteligentes
- Sistema de notificaciones integrado

---

## 2. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React 19 + Vite)                │
│                                                             │
│  ┌─ Dashboard Operacional                                 │
│  │  ├─ Vista por Tienda                                   │
│  │  ├─ Números grandes (Ganancia/Pérdida)                │
│  │  ├─ Gráficos (Línea, Barras, Donut)                   │
│  │  ├─ Tabla de órdenes                                  │
│  │  ├─ Alertas CPA (badges)                              │
│  │  └─ Filtros (fechas, campaña, producto)              │
│  │                                                        │
│  └─ Panel de Notificaciones                              │
│     ├─ Alertas CPA Alto                                  │
│     ├─ Integraciones disponibles                         │
│     └─ Info/Bienvenida                                   │
│                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Supabase Edge Functions)              │
│                                                             │
│  ┌─ Cron Jobs (cada 12 horas)                             │
│  │  ├─ Sync Shopify API → BD                             │
│  │  ├─ Sync Meta Ads API → BD                            │
│  │  ├─ Calcular métricas                                 │
│  │  ├─ Detectar alertas CPA                              │
│  │  └─ Crear notificaciones                              │
│  │                                                        │
│  ├─ API Endpoints                                         │
│  │  ├─ GET /dashboard/:tienda_id                         │
│  │  ├─ GET /notifications                                │
│  │  ├─ POST /integrations/shopify/connect                │
│  │  ├─ POST /integrations/meta/connect                   │
│  │  └─ POST /integrations/shopify/sync (manual)          │
│  │                                                        │
│  └─ Row Level Security (RLS)                             │
│     └─ Cada usuario solo ve sus tiendas                  │
│                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         DATABASE (Supabase PostgreSQL + Realtime)          │
│                                                             │
│  ┌─ dashboard_metrics                                     │
│  │  └─ Datos diarios consolidados (Shopify + Meta)       │
│  │                                                        │
│  ├─ shopify_integrations                                  │
│  │  └─ Tokens y config por tienda                        │
│  │                                                        │
│  ├─ meta_integrations                                     │
│  │  └─ Tokens y config por usuario                       │
│  │                                                        │
│  ├─ campaign_mappings                                     │
│  │  └─ Relaciona campaign_id ↔ product_id ↔ tienda      │
│  │                                                        │
│  ├─ user_notifications                                    │
│  │  └─ Historial de notificaciones por usuario           │
│  │                                                        │
│  └─ Índices optimizados para queries rápidas             │
│                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              INTEGRACIONES EXTERNAS                         │
│                                                             │
│  ├─ Shopify API (OAuth + REST)                            │
│  │  ├─ Trae: órdenes, cancelaciones, devoluciones       │
│  │  └─ Frecuencia: 2x/día (cron)                         │
│  │                                                        │
│  └─ Meta Ads API (Graph API)                              │
│     ├─ Trae: campañas, gastos, conversiones             │
│     └─ Frecuencia: 2x/día (cron)                        │
│                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. FASES DE DESARROLLO

### FASE 1: DISEÑO FRONTEND + ESTRUCTURA BD

**Objetivo:** Definir interfaz exacta y preparar base de datos.

**Entregables:**
1. Wireframes/Mockups del Dashboard (Figma o similar)
2. Mockups del Panel de Notificaciones
3. Esquema BD completo (tablas, relaciones, índices)
4. Definición de campos y tipos de datos
5. Definición de cálculos que necesita

**Mockup Dashboard (lo que debe mostrar):**

```
┌────────────────────────────────────────────────────┐
│  Dashboard Operacional - [Tienda X - País Y]      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Hoy (Fecha: 25 Feb 2026)                         │
│  ┌─────────────────┬──────────────┬────────────┐  │
│  │ Ganancia: $450  │ Ventas: $800 │ Gastos: $150
│  │ [Verde]         │              │ [Meta Ads]  │
│  └─────────────────┴──────────────┴────────────┘  │
│                                                    │
│  Esta Semana (7 días)                             │
│  ┌─────────────────┬──────────────┬────────────┐  │
│  │ Ganancia: $2,100│ Ventas: $4,200│ Gastos: $800
│  │ [Verde]         │               │ [Meta Ads] │
│  └─────────────────┴───────────────┴────────────┘  │
│                                                    │
│  Este Mes (30 días)                               │
│  ┌─────────────────┬──────────────┬────────────┐  │
│  │ Ganancia: $8,500│ Ventas: $15,000│ Gastos: $3,000
│  │ [Verde]         │                │[Meta Ads]  │
│  └─────────────────┴────────────────┴────────────┘  │
│                                                    │
│  Gráfico: Ganancia/Pérdida (Últimos 30 días)     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Línea verde (ganancia) con datos reales     │  │
│  │  Eje Y: $ | Eje X: Días                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Gráfico: Ventas vs Gastos (Últimos 30 días)    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Barras: azul (ventas) vs naranja (gastos)  │  │
│  │  Eje Y: $ | Eje X: Semanas                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  KPI - Promedio CPA por Tienda                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ CPA Actual: $12.50                           │  │
│  │ CPA Costado (promedio): $10.00               │  │
│  │ Diferencia: +$2.50 (Alerta ⚠️)              │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Últimas Órdenes (filtrable por campaña)         │
│  ┌────────┬──────────┬────────────┬──────────┐     │
│  │Fecha   │Orden ID  │Estado      │Monto     │     │
│  ├────────┼──────────┼────────────┼──────────┤     │
│  │Feb 25  │#12345    │Enviado     │$45.00   │     │
│  │Feb 25  │#12344    │Cancelado   │$50.00   │     │
│  │Feb 24  │#12343    │Entregado   │$40.00   │     │
│  └────────┴──────────┴────────────┴──────────┘     │
│                                                    │
│  Filtros:                                         │
│  [Rango fechas] [Por campaña] [Por producto]      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Salidas de Fase 1:**
- Archivo Figma/mockup con dashboard completo
- Schema SQL con todas las tablas
- Documento de campos y cálculos
- Definición de API endpoints

---

### FASE 2: INTEGRACIÓN SHOPIFY

**Objetivo:** Conectar Shopify y traer datos de órdenes automáticamente.

**Entregables:**

1. **Auth Flow:**
   - Endpoint: `POST /api/integrations/shopify/auth-start`
   - Redirige a Shopify OAuth
   - User crea access token en Shopify
   - Callback: `GET /api/integrations/shopify/callback`
   - Guarda token encriptado en `shopify_integrations`

2. **Validación de Token:**
   - Endpoint: `POST /api/integrations/shopify/validate`
   - Intenta GET /admin/api/2024-01/shop.json
   - Si válido: muestra nombre tienda
   - Si inválido: error claro

3. **Sync de Órdenes:**
   - Edge Function: `sync_shopify_orders.ts`
   - Ejecuta cada 12 horas (cron)
   - GET `/admin/api/2024-01/orders.json?status=any`
   - Campos a traer:
     ```
     - order_id
     - created_at
     - total_price
     - financial_status (paid, pending, refunded)
     - fulfillment_status (fulfilled, pending, cancelled)
     - line_items (products)
     - customer
     - cancelled_at (si fue cancelada)
     ```
   - INSERT/UPDATE en tabla `shopify_orders`

4. **Devoluciones:**
   - Detectar: `fulfillment_status = cancelled` O `financial_status = refunded`
   - Calcular % devoluciones por día
   - Guardar en `shopify_orders.return_status`

5. **Mapeo Tienda:**
   - Campo `tienda_id` en `shopify_integrations`
   - Relaciona `shopify_store_id` ↔ `tienda_id` (N:1)
   - RLS: Usuario solo ve sus propias tiendas

**Tabla: shopify_integrations**
```sql
CREATE TABLE shopify_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tienda_id UUID NOT NULL REFERENCES tiendas(id),
  shopify_store_name VARCHAR(255) NOT NULL,
  shopify_store_id VARCHAR(255) UNIQUE NOT NULL,
  access_token_encrypted TEXT NOT NULL, -- AES-256
  scope TEXT, -- permisos otorgados
  api_version VARCHAR(20) DEFAULT '2024-01',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT shopify_unique_per_user 
    UNIQUE(user_id, shopify_store_id)
);

CREATE INDEX idx_shopify_user ON shopify_integrations(user_id);
CREATE INDEX idx_shopify_tienda ON shopify_integrations(tienda_id);
```

**Tabla: shopify_orders**
```sql
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id),
  shopify_order_id VARCHAR(255) NOT NULL,
  shopify_integration_id UUID NOT NULL REFERENCES shopify_integrations(id),
  
  order_number VARCHAR(100),
  created_at TIMESTAMP,
  total_price DECIMAL(12,2),
  financial_status VARCHAR(50), -- paid, pending, refunded, voided
  fulfillment_status VARCHAR(50), -- fulfilled, partial, unshipped, cancelled
  is_cancelled BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP,
  is_returned BOOLEAN DEFAULT false,
  
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  
  products_count INT,
  line_items JSONB, -- Array de productos
  
  synced_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT shopify_unique_order 
    UNIQUE(tienda_id, shopify_order_id)
);

CREATE INDEX idx_shopify_orders_tienda ON shopify_orders(tienda_id);
CREATE INDEX idx_shopify_orders_created ON shopify_orders(created_at);
CREATE INDEX idx_shopify_orders_status ON shopify_orders(financial_status);
```

**Edge Function: sync_shopify_orders.ts**
```typescript
// Pseudocódigo
export const syncShopifyOrders = async (req: Request) => {
  // 1. Obtener todas las integraciones Shopify activas
  const integrations = await supabase
    .from('shopify_integrations')
    .select('*')
    .eq('is_active', true);

  // 2. Para cada integración:
  for (const integration of integrations) {
    // 3. GET órdenes de Shopify (últimas 48 horas)
    const orders = await fetchShopifyOrders(
      integration.shopify_store_id,
      integration.access_token_encrypted,
      '2024-01-01' // 180 días atrás para histórico
    );

    // 4. Para cada orden:
    for (const order of orders) {
      // 5. Detectar si fue cancelada/devuelta
      const isCancelled = order.cancelled_at != null;
      const isReturned = order.financial_status === 'refunded';

      // 6. INSERT/UPDATE en shopify_orders
      await supabase
        .from('shopify_orders')
        .upsert({
          tienda_id: integration.tienda_id,
          shopify_order_id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total_price: order.total_price,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          is_cancelled: isCancelled,
          is_returned: isReturned,
          // ... otros campos
        });
    }
  }
};
```

**Testing:**
- Verificar que órdenes se traen correctamente
- Verificar cancelaciones se detectan
- Verificar devoluciones se detectan
- Verificar sincronización cada 12 horas

---

### FASE 3: INTEGRACIÓN META ADS

**Objetivo:** Conectar Meta Business Account y traer datos de campañas/gastos.

**Entregables:**

1. **Auth Flow:**
   - Endpoint: `POST /api/integrations/meta/auth-start`
   - Redirige a Meta Login Dialog
   - Scope: `ads_management`, `ads_read`
   - Callback: `GET /api/integrations/meta/callback`
   - Guarda access token en `meta_integrations`

2. **Validación:**
   - Endpoint: `POST /api/integrations/meta/validate`
   - GET `https://graph.instagram.com/me?fields=id,name`
   - Si válido: obtiene account_id del usuario

3. **Sync de Campañas:**
   - Edge Function: `sync_meta_campaigns.ts`
   - Ejecuta cada 12 horas (cron)
   - GET `/{ad_account_id}/campaigns?fields=id,name,status,created_time`
   - Campos a traer:
     ```
     - campaign_id
     - campaign_name
     - status (ACTIVE, PAUSED, ARCHIVED)
     - created_time
     - updated_time
     ```
   - INSERT en tabla `meta_campaigns`

4. **Sync de Gastos/Conversiones:**
   - GET `/{ad_account_id}/insights?fields=spend,purchase_roas,actions`
   - Por rango de fechas (últimos 180 días)
   - Campos a traer:
     ```
     - date_start
     - date_stop
     - spend ($ gastado)
     - actions (conversiones)
     - action_values (ingresos)
     - purchase_roas (ROAS)
     ```
   - Granularidad: diaria
   - INSERT en tabla `meta_campaign_metrics`

5. **Mapeo Campaña:**
   - Dropshipper debe indicar: `campaign_id_meta` en el costeo
   - Esto relaciona: campaña → producto → tienda

**Tabla: meta_integrations**
```sql
CREATE TABLE meta_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  meta_user_id VARCHAR(255) NOT NULL,
  meta_account_id VARCHAR(255) NOT NULL, -- ad_account_id
  access_token_encrypted TEXT NOT NULL, -- AES-256
  token_expiry TIMESTAMP,
  scope TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT meta_unique_per_user 
    UNIQUE(user_id, meta_account_id)
);

CREATE INDEX idx_meta_user ON meta_integrations(user_id);
```

**Tabla: meta_campaigns**
```sql
CREATE TABLE meta_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  meta_integration_id UUID NOT NULL REFERENCES meta_integrations(id),
  
  campaign_id VARCHAR(255) NOT NULL,
  campaign_name VARCHAR(500),
  status VARCHAR(50), -- ACTIVE, PAUSED, ARCHIVED
  created_time TIMESTAMP,
  updated_time TIMESTAMP,
  
  synced_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT meta_unique_campaign 
    UNIQUE(user_id, campaign_id)
);

CREATE INDEX idx_meta_campaigns_user ON meta_campaigns(user_id);
CREATE INDEX idx_meta_campaigns_status ON meta_campaigns(status);
```

**Tabla: meta_campaign_metrics**
```sql
CREATE TABLE meta_campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  campaign_id VARCHAR(255) NOT NULL,
  
  date DATE NOT NULL,
  spend DECIMAL(12,2), -- $ gastado
  conversions INT DEFAULT 0, -- actions count
  revenue DECIMAL(12,2) DEFAULT 0, -- action_values
  roas DECIMAL(5,2), -- Return on Ad Spend
  
  synced_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT meta_unique_metric 
    UNIQUE(user_id, campaign_id, date)
);

CREATE INDEX idx_meta_metrics_user_date ON meta_campaign_metrics(user_id, date);
CREATE INDEX idx_meta_metrics_campaign ON meta_campaign_metrics(campaign_id);
```

**Edge Function: sync_meta_campaigns.ts**
```typescript
// Pseudocódigo
export const syncMetaCampaigns = async (req: Request) => {
  // 1. Obtener todas las integraciones Meta activas
  const integrations = await supabase
    .from('meta_integrations')
    .select('*')
    .eq('is_active', true);

  // 2. Para cada integración:
  for (const integration of integrations) {
    // 3. GET campañas
    const campaigns = await fetchMetaCampaigns(
      integration.meta_account_id,
      integration.access_token_encrypted
    );

    // 4. INSERT campañas
    for (const campaign of campaigns) {
      await supabase
        .from('meta_campaigns')
        .upsert({
          user_id: integration.user_id,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          // ... otros campos
        });
    }

    // 5. GET métricas (últimos 180 días)
    const metrics = await fetchMetaMetrics(
      integration.meta_account_id,
      integration.access_token_encrypted,
      180 // días atrás
    );

    // 6. INSERT métricas
    for (const metric of metrics) {
      await supabase
        .from('meta_campaign_metrics')
        .upsert({
          user_id: integration.user_id,
          campaign_id: metric.campaign_id,
          date: metric.date,
          spend: metric.spend,
          conversions: metric.conversions,
          // ... otros campos
        });
    }
  }
};
```

**Testing:**
- Verificar que campañas se traen
- Verificar métricas diarias se traen
- Verificar sincronización cada 12 horas
- Verificar datos exactos (no duplicados, valores correctos)

---

### FASE 4: CÁLCULOS AUTOMÁTICOS

**Objetivo:** Procesar datos de Shopify + Meta + Costeo y generar métricas diarias.

**Entregables:**

1. **Edge Function: calculate_daily_metrics.ts**
   - Ejecuta cada 12 horas (después de sync de Shopify + Meta)
   - Para cada tienda + cada día (últimos 180 días):
     ```
     a. Obtener: Órdenes de Shopify para esa tienda ese día
     b. Obtener: Gastos de Meta para esa campaña ese día
     c. Obtener: COGS del costeo (del simulador)
     d. Calcular:
        - Total Ventas = SUM(shopify_orders.total_price)
        - Cancelaciones = COUNT(is_cancelled = true)
        - Devoluciones = COUNT(is_returned = true)
        - Efectivas = Total - Cancelaciones - Devoluciones
        - Gasto Ads = SUM(meta_campaign_metrics.spend)
        - COGS = Dari costeo
        - Ganancia = (Efectivas - Gasto Ads - COGS)
        - CPA Real = Gasto Ads / Conversiones
        - Estado = IF(Ganancia > 0) 'ganancia' 
                   ELSE IF(Ganancia ≈ 0) 'break_even' 
                   ELSE 'pérdida'
     e. INSERT en dashboard_metrics
     ```

2. **Tabla: dashboard_metrics**
   ```sql
   CREATE TABLE dashboard_metrics (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tienda_id UUID NOT NULL REFERENCES tiendas(id),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     campaign_id_meta VARCHAR(255),
     product_id VARCHAR(255), -- de costeo
     
     fecha DATE NOT NULL,
     
     -- Shopify
     ordenes_totales INT DEFAULT 0,
     ordenes_canceladas INT DEFAULT 0,
     ordenes_devueltas INT DEFAULT 0,
     ordenes_efectivas INT DEFAULT 0,
     
     ventas_totales DECIMAL(12,2) DEFAULT 0,
     ventas_canceladas DECIMAL(12,2) DEFAULT 0,
     ventas_devueltas DECIMAL(12,2) DEFAULT 0,
     ventas_efectivas DECIMAL(12,2) DEFAULT 0,
     
     -- Meta Ads
     gastos_ads DECIMAL(12,2) DEFAULT 0,
     conversiones INT DEFAULT 0,
     roas DECIMAL(5,2) DEFAULT 0,
     cpa_real DECIMAL(10,2) DEFAULT 0,
     
     -- Costeo (del simulador)
     cogs_total DECIMAL(12,2) DEFAULT 0,
     cpa_costado DECIMAL(10,2),
     flete_promedio DECIMAL(10,2),
     devoluciones_pct DECIMAL(5,2),
     
     -- Cálculos
     ganancia_neta DECIMAL(12,2), -- ventas_efectivas - gastos_ads - cogs
     margen_pct DECIMAL(5,2), -- (ganancia_neta / ventas_efectivas) * 100
     estado VARCHAR(50), -- 'ganancia', 'break_even', 'pérdida'
     
     -- Alertas
     alerta_cpa_alto BOOLEAN DEFAULT false,
     cpa_exceso DECIMAL(10,2), -- cpa_real - cpa_costado
     
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     
     CONSTRAINT dashboard_unique 
       UNIQUE(tienda_id, fecha, campaign_id_meta)
   );

   CREATE INDEX idx_dashboard_tienda_fecha 
     ON dashboard_metrics(tienda_id, fecha);
   CREATE INDEX idx_dashboard_campaign 
     ON dashboard_metrics(campaign_id_meta);
   CREATE INDEX idx_dashboard_alerta 
     ON dashboard_metrics(alerta_cpa_alto);
   ```

3. **Lógica de Alertas CPA:**
   ```typescript
   // Si CPA Real > CPA Costado
   if (cpa_real > cpa_costado) {
     // Crear alerta
     await createNotification({
       user_id,
       type: 'alert_cpa_high',
       title: 'Alerta de CPA Alto',
       description: `Tu campaña "${campaign_name}" está superando el CPA ideal calculado en el simulador.`,
       metadata: {
         tienda_id,
         campaign_id,
         cpa_real,
         cpa_costado,
         fecha
       }
     });
   }
   ```

4. **Agregación de Datos (Semanal/Mensual):**
   ```sql
   -- El dashboard calculará:
   - Últimas 24h (Hoy)
   - Últimos 7 días (Semana)
   - Últimos 30 días (Mes)
   - Últimos 180 días (Histórico)
   
   Mediante queries que agregan dashboard_metrics
   ```

**Testing:**
- Verificar cálculos exactos (sumatorias, promedios)
- Verificar alertas se generan cuando CPA > costado
- Verificar estados correctos (ganancia/break-even/pérdida)
- Verificar datos históricos (180 días)

---

### FASE 5: RECONCILIACIÓN Y MAPEO DE DATOS

**Objetivo:** Relacionar campaign_id Meta ↔ product_id Shopify ↔ tienda.

**Entregables:**

1. **Ampliación de tabla costeos:**
   ```sql
   ALTER TABLE costeos ADD COLUMN (
     campaign_id_meta VARCHAR(255), -- Ingresa usuario manualmente
     product_id_dropi VARCHAR(255), -- Para futura integración
     product_id_shopify VARCHAR(255), -- Ingresa usuario o busca
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_costeos_campaign ON costeos(campaign_id_meta);
   CREATE INDEX idx_costeos_product_shopify ON costeos(product_id_shopify);
   ```

2. **Tabla: campaign_mappings**
   ```sql
   CREATE TABLE campaign_mappings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     tienda_id UUID NOT NULL REFERENCES tiendas(id),
     
     campaign_id_meta VARCHAR(255) NOT NULL,
     product_id VARCHAR(255), -- Identificador del producto
     product_name VARCHAR(500),
     
     -- Relación con costeo
     costeo_id UUID REFERENCES costeos(id),
     
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     
     CONSTRAINT campaign_mapping_unique 
       UNIQUE(user_id, campaign_id_meta)
   );

   CREATE INDEX idx_campaign_mappings_user ON campaign_mappings(user_id);
   CREATE INDEX idx_campaign_mappings_tienda ON campaign_mappings(tienda_id);
   ```

3. **Flujo de Mapeo (Manual inicialmente):**
   - Usuario crea costeo → selecciona product_id_shopify
   - Usuario ingresa campaign_id_meta manualmente (O busca en dropdown)
   - Sistema relaciona automáticamente
   - Próximo paso: integración Dropi permitirá búsqueda automática

4. **Validación:**
   - Endpoint: `POST /api/campaign-mappings/validate`
   - Verifica que campaign_id existe en Meta Ads
   - Verifica que product_id existe en Shopify
   - Retorna confirmación

**Testing:**
- Verificar relaciones se crean correctamente
- Verificar validación funciona
- Verificar dashboard consolida datos correctamente

---

### FASE 6: FRONTEND + DASHBOARD FUNCIONAL

**Objetivo:** Implementar interfaz del dashboard con datos reales.

**Entregables:**

1. **Componentes React (reutilizar existentes):**
   - `DashboardCard.tsx` (números grandes)
   - `LineChart.tsx` (gráfico ganancia/pérdida)
   - `BarChart.tsx` (gráfico ventas vs gastos)
   - `DonutChart.tsx` (distribución campañas)
   - `OrdersTable.tsx` (tabla órdenes)
   - `AlertBadge.tsx` (alertas CPA)
   - `NotificationPanel.tsx` (panel flotante)

2. **Página: /app/dashboard/:tienda_id**
   ```typescript
   // Estructura
   <Layout>
     <DashboardHeader tienda={selectedTienda} />
     
     <div className="grid grid-cols-3 gap-4">
       {/* Números grandes - Hoy */}
       <DashboardCard label="Ganancia" value={metrics.today.ganancia} />
       <DashboardCard label="Ventas" value={metrics.today.ventas} />
       <DashboardCard label="Gastos" value={metrics.today.gastos} />
     </div>

     {/* Gráficos */}
     <LineChart data={metrics.ganancia_historico} />
     <BarChart data={metrics.ventas_vs_gastos} />
     <DonutChart data={metrics.por_campana} />

     {/* KPI CPA */}
     <CPAMetrics cpa_actual={metrics.cpa_actual} />

     {/* Tabla órdenes */}
     <OrdersTable orders={metrics.orders} />

     {/* Filtros */}
     <Filters onChange={handleFilterChange} />
   </Layout>
   ```

3. **Panel de Notificaciones:**
   ```typescript
   // Componente flotante (top-right)
   <NotificationPanel
     notifications={userNotifications}
     count={unreadCount}
     onNotificationClick={handleNotificationClick}
   />
   ```

4. **API Endpoints del Frontend:**

   **GET /api/dashboard/:tienda_id**
   ```json
   {
     "tienda_id": "uuid",
     "tienda_nombre": "Mi Tienda",
     "pais": "Colombia",
     "metrics": {
       "today": {
         "ganancia": 450.00,
         "ventas": 800.00,
         "gastos": 150.00
       },
       "semana": {...},
       "mes": {...},
       "cpa_actual": 12.50,
       "cpa_costado_promedio": 10.00
     },
     "graficos": {
       "ganancia_historico": [...],
       "ventas_vs_gastos": [...],
       "por_campana": [...]
     },
     "alertas": [
       {
         "id": "uuid",
         "tipo": "cpa_alto",
         "campaña": "Producto X",
         "cpa_real": 15.00,
         "cpa_costado": 10.00
       }
     ],
     "ordenes_recientes": [...]
   }
   ```

   **GET /api/notifications**
   ```json
   {
     "total": 3,
     "unread": 3,
     "notifications": [
       {
         "id": "uuid",
         "type": "alert_cpa_high",
         "title": "Alerta de CPA Alto",
         "description": "Tu campaña 'Producto Estrella' está superando...",
         "read": false,
         "created_at": "2026-02-25T10:30:00Z"
       }
     ]
   }
   ```

   **POST /api/notifications/:id/mark-as-read**
   ```json
   {
     "success": true,
     "message": "Notificación marcada como leída"
   }
   ```

5. **Filtros Interactivos:**
   - Rango fechas (date picker)
   - Por campaña (dropdown)
   - Por producto (dropdown)
   - Por estado (ganancia/break-even/pérdida)

6. **Comportamientos:**
   - Auto-refresh cada 30 minutos (o manual)
   - Números con formato moneda (colores: verde ganancia, rojo pérdida)
   - Gráficos suave con animaciones
   - Tabla paginada (10 órdenes por página)
   - Responsive (mobile friendly)

**Testing:**
- Verificar datos se cargan correctamente
- Verificar cálculos se muestran bien
- Verificar filtros funcionan
- Verificar responsivo en mobile
- Verificar notificaciones aparecen
- Verificar performance (<2s load)

---

### FASE 7: SISTEMA DE NOTIFICACIONES

**Objetivo:** Panel de notificaciones con alertas CPA.

**Entregables:**

1. **Tabla: user_notifications**
   ```sql
   CREATE TABLE user_notifications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     
     type VARCHAR(50), -- 'alert_cpa_high', 'integration_available', 'info'
     title VARCHAR(255) NOT NULL,
     description TEXT,
     
     metadata JSONB, -- Contexto extra (campaign_id, tienda_id, etc)
     
     read BOOLEAN DEFAULT false,
     read_at TIMESTAMP,
     
     action_url VARCHAR(255), -- Dónde llevar si hace click
     
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_notifications_user_read 
     ON user_notifications(user_id, read);
   CREATE INDEX idx_notifications_created 
     ON user_notifications(user_id, created_at DESC);
   ```

2. **Tipos de Notificaciones:**
   ```
   ⚠️  alert_cpa_high
       "Tu campaña 'Producto X' está superando el CPA costado en $2.50"
       action_url: /app/dashboard/tienda_id
   
   ✅  integration_available
       "Ya puedes conectar tu cuenta de Shopify para sincronizar pedidos"
       action_url: /app/settings/integrations
   
   ℹ️  info_welcome
       "Bienvenido al sistema de notificaciones..."
       action_url: null
   ```

3. **Edge Function: create_notifications.ts**
   - Ejecuta después de `calculate_daily_metrics`
   - Detecta alertas CPA
   - Crea notificaciones
   - Limpia notificaciones antiguas (>30 días)

4. **Componente: NotificationPanel.tsx**
   ```typescript
   <div className="fixed top-16 right-4 w-96 bg-dark rounded-lg shadow-xl z-50">
     <div className="p-4 border-b border-gray-700">
       <h3 className="text-lg font-bold">Notificaciones</h3>
       <span className="badge">3 nuevas</span>
       <a href="/notifications" className="text-blue-500">Leer todas</a>
     </div>

     <div className="max-h-96 overflow-y-auto">
       {notifications.map(notif => (
         <NotificationItem 
           key={notif.id} 
           notification={notif}
           onRead={() => markAsRead(notif.id)}
         />
       ))}
     </div>

     <button onClick={closePanel}>Cerrar panel</button>
   </div>
   ```

5. **Página: /app/notifications**
   - Lista todas las notificaciones (últimos 30 días)
   - Filtrable por tipo
   - Marcar como leída
   - Eliminar

**Testing:**
- Verificar alertas CPA se crean
- Verificar panel aparece con badge
- Verificar click marca como leído
- Verificar limpieza de antiguas

---

### FASE 8: PULIDO + OPTIMIZACIONES + LAUNCH

**Objetivo:** Performance, error handling, documentación y deploy.

**Entregables:**

1. **Performance:**
   - Dashboard load < 2 segundos
   - Gráficos con datos optimizados (agregación)
   - Índices BD optimizados
   - Lazy loading de imágenes/componentes

2. **Error Handling:**
   - Try-catch en todas las Edge Functions
   - Error messages claros al usuario
   - Retry logic para APIs externas
   - Fallbacks si falla Shopify/Meta

3. **Logging & Monitoring:**
   - Logs en cada sincronización
   - Alert si falla integración
   - Dashboard de salud (opcional)

4. **Documentación:**
   - README con setup de integraciones
   - Video tutorial (5 min) cómo usar dashboard
   - FAQs comunes
   - Troubleshooting guide

5. **Testing Completo:**
   - E2E: Usuario conecta Shopify → ve datos
   - E2E: Usuario conecta Meta → ve gastos
   - E2E: Sync automática cada 12 horas
   - E2E: Alertas CPA se generan

6. **Beta Testing:**
   - 5-10 usuarios reales
   - Feedback loops
   - Fixes rápidos
   - Feature requests

7. **Launch:**
   - Deploy a producción
   - Anuncio a usuarios existentes
   - Monitor bugs
   - Plan de soporte

---

## 4. ESTRUCTURA DE TABLAS (RESUMEN)

```
┌─ AUTENTICACIÓN & USUARIOS (ya existe)
│  ├─ auth.users
│  └─ user_profiles
│
├─ TENANCY
│  ├─ tiendas
│  ├─ tienda_users
│  └─ tienda_config
│
├─ COSTEO (ya existe)
│  ├─ costeos
│  └─ [AMPLIACIÓN] campaign_id_meta, product_id_shopify
│
├─ INTEGRACIONES
│  ├─ shopify_integrations
│  ├─ shopify_orders
│  ├─ meta_integrations
│  ├─ meta_campaigns
│  └─ meta_campaign_metrics
│
├─ DASHBOARD
│  ├─ dashboard_metrics (datos consolidados)
│  └─ campaign_mappings (relaciones)
│
└─ NOTIFICACIONES
   └─ user_notifications
```

---

## 5. FLUJO END-TO-END

```
DÍA 1 - Usuario configura
├─ Login en DropCost
├─ Entra a /app/settings/integrations
├─ Click "Conectar Shopify"
│  └─ Autoriza en Shopify → Token guardado
├─ Click "Conectar Meta"
│  └─ Autoriza en Meta → Token guardado
├─ Ve en Dashboard "Integraciones conectadas ✅"
└─ Crea costeo (simulador)
   └─ Ingresa campaign_id_meta
   └─ Ingresa product_id_shopify (search)

DÍA 2+ - Automático
├─ CRON 12:00 AM:
│  ├─ Sync Shopify → órdenes últimas 12h
│  ├─ Sync Meta Ads → gastos últimas 12h
│  ├─ Calculate metrics diarios
│  ├─ Detecta alertas CPA
│  └─ Crea notificaciones
│
├─ Usuario abre dashboard:
│  ├─ Ve números grandes (ganancia/pérdida)
│  ├─ Ve gráficos (línea, barras)
│  ├─ Ve tabla de órdenes
│  ├─ Ve alertas CPA (badges rojos)
│  ├─ Ve notificaciones (panel flotante)
│  └─ Puede filtrar por fechas/campaña

CRON 12:00 PM:
└─ Sync repite (cada 12 horas)
```

---

## 6. CHECKLIST TÉCNICO

### Base de Datos
- [ ] Tablas creadas (shopify_integrations, meta_integrations, etc)
- [ ] Índices optimizados
- [ ] RLS configurado por tienda
- [ ] Constraints y relaciones OK
- [ ] Migrations documentadas

### Integraciones
- [ ] Shopify OAuth flow funcional
- [ ] Meta OAuth flow funcional
- [ ] Token encryption/decryption working
- [ ] Error handling para tokens inválidos
- [ ] Rate limiting implementado

### Edge Functions
- [ ] sync_shopify_orders.ts (cron 2x/día)
- [ ] sync_meta_campaigns.ts (cron 2x/día)
- [ ] calculate_daily_metrics.ts (cron después de sync)
- [ ] create_notifications.ts (automático)
- [ ] Logging en cada función

### Frontend
- [ ] Dashboard carga datos correctamente
- [ ] Gráficos se renderizan bien
- [ ] Notificaciones aparecen
- [ ] Filtros funcionan
- [ ] Responsive en mobile
- [ ] Performance < 2s

### Testing
- [ ] Unit tests (cálculos)
- [ ] Integration tests (Shopify ↔ BD)
- [ ] E2E tests (usuario completo flow)
- [ ] Load tests (múltiples users)
- [ ] Error scenarios

### Documentación
- [ ] README con setup
- [ ] Video tutorial
- [ ] API docs
- [ ] Troubleshooting guide
- [ ] Code comments

---

## 7. DEPENDENCIAS EXTERNAS

```
Shopify API:
├─ Base: https://shopify.dev/api/admin-rest/2024-01
├─ Endpoints: GET /orders, GET /shop
└─ Scopes: read_orders, read_products

Meta Ads API:
├─ Base: https://developers.facebook.com/docs/marketing-api
├─ Endpoints: GET /campaigns, GET /{ad_account_id}/insights
└─ Scopes: ads_management, ads_read

Supabase:
├─ PostgreSQL (base de datos)
├─ Auth (autenticación users)
├─ Edge Functions (cron + sincronizaciones)
├─ Realtime (opcional para futuro)
└─ Storage (opcional para archivos)
```

---

## 8. VARIABLES DE ENTORNO

```bash
# Shopify
VITE_SHOPIFY_API_VERSION=2024-01
VITE_SHOPIFY_SCOPES=read_orders,read_products

# Meta
VITE_META_APP_ID=tu_app_id
VITE_META_SCOPES=ads_management,ads_read

# Supabase (ya existe)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Encryption
ENCRYPTION_KEY=... (para AES-256 tokens)

# Cron Schedule
SYNC_SCHEDULE=0 */12 * * * (cada 12 horas)
```

---

## 9. ROADMAP POST-LAUNCH

```
FASE A (Dentro de 2 semanas):
├─ Feedback de beta testers
├─ Fixes críticos
└─ Documentación mejorada

FASE B (Próximo mes):
├─ Integración TikTok Ads
├─ Webhooks real-time (si escala)
└─ Más tipos de notificaciones

FASE C (Futuro):
├─ Integración Dropi (analizador regional)
├─ Predicciones con IA (forecasting)
├─ Automated recommendations
└─ Export datos (CSV, PDF)
```

---

## 10. ESTIMACIÓN ESFUERZO (CON ANTIGRAVITY)

```
Fase 1 (Diseño): 2-3 días
Fase 2 (Shopify): 3-4 días
Fase 3 (Meta): 3-4 días
Fase 4 (Cálculos): 2-3 días
Fase 5 (Mapeo): 1-2 días
Fase 6 (Frontend): 4-5 días
Fase 7 (Notificaciones): 2-3 días
Fase 8 (Pulido): 2-3 días

TOTAL: ~20-27 días calendario
(Con Antigravity paralizando fases: 10-14 días)
```

---

## LISTO PARA ANTIGRAVITY

Este documento tiene **TODA la especificación técnica** lista.

**Próximos pasos:**
1. Antigravity comienza con **Fase 1** (diseño + BD)
2. Valida wireframes contigo
3. Luego procede con Fases 2-8 en paralelo

**¿Algo que aclarar o cambiar antes de que Antigravity comience?**

