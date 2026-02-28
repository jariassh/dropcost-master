---
date: "2026-02-27"
author: "Database Architect"
task: "Orders Integration Database Setup (Shopify & Dropi)"
---

# Preparación de la BD para la integración de Órdenes (Shopify + Dropi)

## 📌 Contexto
Se requiere preparar el esquema de base de datos para habilitar un flujo asíncrono donde las órdenes se registrarán desde Shopify (vía webhooks) y se enriquecerán más adelante a través de archivos Excel de Dropi. 

Este enfoque requiere que generemos una nueva entidad central (`orders`) y modifiquemos las entidades satélite involucradas (`tiendas`, `costeos`) para permitir las conexiones de llaves extranjeras y los cruces de IDs unívocos exactos.

## 🛠 Cambios Implementados

### 1. Tabla: `tiendas`
Se enriquecieron los datos de la tienda para soportar los endpoints de webhooks:
- `shopify_domain` (TEXT): Para guardar el subdominio amigable que introduce el usuario, e.g. "kqhzg7-u6".
- `webhook_short_id` (TEXT, UNIQUE): Para guardar el "hashed string" de 6 a 7 caracteres que servirá para la URL acortada que entregaremos al usuario (Ej: "7ulMx").

### 2. Tabla: `costeos`
Se añadió un identificador directo con el inventario de la tienda:
- `shopify_product_id` (TEXT): Este campo permite enlazar las órdenes (haciendo match desde los `line_items`) directamente a un costeo financiero del dashboard.

### 3. Nueva Tabla: `orders`
Se creó la tabla transaccional para el almacenamiento unificado de las órdenes:
- **Keys y Relaciones**: `id` UUID PRIMARY KEY, `usuario_id` (RLS FK), `tienda_id` (RLS FK), `costeo_id` (vincula a rentabilidad).
- **Core de Cruce**: `shopify_order_id` (TEXT), este contiene el `ID EXACTO` que envía Shopify por el Payload y que hace match exacto ($1:1$) con la columna `ID DE ORDEN DE TIENDA` del archivo Excel de Dropi.
- **Identificación UX**: `order_number` (Ej: "#1017").
- **Costos/Cobros**: `estado_pago`, `total_orden`, `cantidad_items` (Entero, extraído sumando unidades o desde excel).
- **Logística**: `estado_logistica`, `transportadora`, `novedad`.
- **Datos Regionales (Ocultos inicialmente, para analítica)**: `cliente_ciudad`, `cliente_departamento`.
- **Multitenancy**: Se aplicaron check contstraints para la fila de usuarios (`uid()`).

### 4. Políticas RLS (Aislamiento Multitenant)
Se establecieron las 4 políticas (CRUD) sobre la tabla `orders` exigiéndoles que `auth.uid() = usuario_id`, lo que impide estrictamente que el *User A* interactúe, por cualquier vía, con los registros, logs u órdenes de la tienda del *User B*.

### 5. Índices de Rendimiento
Se definieron índices UNIQUE cruciales:
- `UNIQUE (tienda_id, shopify_order_id)`: Asegura que cada tienda no pueda disparar el mismo evento y registrar 1 orden dos veces (Idempotencia en webhooks).
- `UNIQUE (tienda_id, order_number)`: Complementa la visibilidad que el Seller visualiza en pantalla.
- Índices B-Tree sencillos para `cliente_ciudad` y `cliente_departamento` como bases técnicas para la próxima característica ("Analizador Regional").

## ✅ Conclusión del Check
La migración `20260227171456_create_orders_integration.sql` generada contiene todo el setup completo y está lista para que el backend integre su lógica sin temores a problemas relacionales. 

**Estatus de la entrega:** COMPLETADA.
