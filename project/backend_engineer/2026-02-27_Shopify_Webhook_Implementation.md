---
date: "2026-02-27"
author: "Backend Engineer"
task: "Shopify Webhook Edge Function Implementation"
---

# Implementación de Webhook de Shopify para Órdenes

## 📌 Contexto
Como parte de la Fase 1 en la orquestación del Product Manager, he desarrollado la Edge Function que permite la ingesta asíncrona de webhooks disparados por Shopify cuando se crea un pedido (Topic: `orders/create`). Esta función actúa como nuestra puerta de enlace para que las tiendas conectadas reporten ventas en tiempo real al dashboard, las cuales luego serán enriquecidas con información de logística procedente de Dropi.

## 🛠 Cambios Implementados

### 1. Edge Function `webhook-shopify`
Ruta: `/supabase/functions/webhook-shopify/index.ts`

He creado el microservicio usando Deno y `@supabase/supabase-js`. 
Características principales de la implementación:
- **Parseo de URL para Aislamiento**: Al escuchar una petición POST, la función busca el parámetro `store_id` (Ej: `?store_id=UUID`). Este mecanismo simplifica la conexión (el usuario no tiene que buscar un "webhook secret" ni manejar llaves, y simplemente copiará esta URL pre-firmada desde nuestro frontend).
- **Control de Privilegios**: Se inicializa el cliente Supabase utilizando el entorno `SUPABASE_SERVICE_ROLE_KEY`, garantizando que la inserción de órdenes no requiera un token de usuario autenticado en la cabecera HTTP, lo cual es vital ya que los webhooks proceden de un tercero (Shopify).
- **Validación RLS (Indirecta)**: Antes de insertar, el servicio consulta la tabla `tiendas` para asegurar que el `store_id` pasado en la URL existe y extrae el `usuario_id` del propietario. Todo registro se inserta garantizando su asociación correcta al dueño del negocio.

### 2. Extracción y Normalización de Datos
El Payload JSON despachado por Shopify fue analizado y mapeado hacia nuestra nueva tabla `orders` construida por el DBA:
- `shopify_order_id`: Extraído del primer nivel del payload interaccional (`String(payload.id)`). Crucial para el futuro *match* con Dropi.
- `order_number`: Tomado de `payload.name` (usualmente contiene el # como #1017) o el fallback `payload.order_number`.
- `total_orden`: Parseo numérico estricto de `payload.total_price`.
- `cantidad_items`: Extraído sumando iterativamente el atributo `quantity` de todos los elementos dentro de `payload.line_items`.
- `estado_pago`: Extraído directamente de `financial_status`.
- `estado_logistica`: Extraído de `fulfillment_status`, o con fallback a 'pending' en su ausencia.
- Información del comprador consolidada verificando ambas direcciones del pedido (`shipping_address` preferencial sobre `billing_address`) para rellenar variables espaciales futuras (Ciudad, Departamento).

### 3. Product Match Automation (CRÍTICO)
Puesto que nuestro Dashboard es analógico/financiero y vive en la abstracción de "costeos", la integración resuelve la equivalencia:
- Analiza `payload.line_items`.
- Extrae el `product_id` interno de Shopify del primer producto.
- Ejecuta una query hacia la tabla de `costeos` buscando un "Match" de `tienda_id` + `shopify_product_id`.
- Si existe coincidencia, la orden recién generada se inserta acoplando directamente el `costeo_id`, lo que permitirá analizar la rentabilidad inmediatamente en el frontend.

### 4. Idempotencia y Manejo del Upsert
Los sistemas de Webhooks a veces tienen resiliencia a fallos y re-disparan la misma petición. Para prevenir ingresos dobles, la inserción se realiza utilizando el comando `upsert` bloqueando conflictos de `ON CONFLICT (tienda_id, shopify_order_id)`.

**Estatus de la entrega:** COMPLETADA Y LISTA PARA SERVICIOS FRONTEND.
