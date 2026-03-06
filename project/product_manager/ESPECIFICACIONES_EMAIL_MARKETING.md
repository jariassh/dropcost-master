# Especificaciones Técnicas: Módulo Email Marketing y Campañas

## 1. Objetivo General
Implementar un sistema de marketing por correo electrónico en DropCost Master que permita crear listas/segmentos inteligentes, configurar campañas basadas en plantillas existentes, y enviar correos de manera orgánica (Drip Sending: 1 correo cada 10 segundos) mediante un motor en segundo plano.

## 2. Arquitectura de Base de Datos (DBA)
- **`email_segments`**: Listas inteligentes.
  - `id` UUID PRIMARY KEY.
  - `name` VARCHAR.
  - `description` TEXT.
  - `filters` JSONB (Guarda la configuración del filtro, ej. por fechas, etiquetas).
  - `created_at` TIMESTAMP.
- **`email_campaigns`**: Definición de la campaña.
  - `id` UUID PRIMARY KEY.
  - `name` VARCHAR.
  - `subject` VARCHAR.
  - `template_id` UUID REFERENCES email_templates.
  - `segment_id` UUID REFERENCES email_segments.
  - `status` VARCHAR (draft, scheduled, processing, completed, failed).
  - `scheduled_at` TIMESTAMP.
  - `created_by` UUID REFERENCES users.
- **`email_campaign_logs`**: Cola de envío unitario secuencial.
  - `id` UUID PRIMARY KEY.
  - `campaign_id` UUID REFERENCES email_campaigns.
  - `user_id` UUID REFERENCES users.
  - `email` VARCHAR.
  - `status` VARCHAR (pending, sent, failed).
  - `error_message` TEXT.
  - `sent_at` TIMESTAMP.
- **Políticas RLS**: Aislamiento estricto por `tienda_id` y `user_id` si aplica a nivel usuario, o permisos exclusivos de Admin para gestionar las campañas globales.

## 3. Backend (Edge Functions)
El envío debe emular comportamiento humano para evitar bloqueos por SPAM.
- `segment-builder`: Previsualiza la audiencia según el JSON de `filters`.
- `campaign-manager`: CRUD principal. Contiene flag `es_prueba` para envío inmediato solo al Admin. Al iniciar campaña ("Lanzar"), inserta N registros en `email_campaign_logs` en estado `pending`.
- `procesar-cola-campanas`: Se ejecutará iterando sobre los correos pendientes enviando **1 correo cada 10 segundos** de manera secuencial en su ciclo de vida.
- `campaign-metrics`: Retorna contadores para la UI (X enviados, Y pendientes).

## 4. Frontend (UI)
Rutas bajo `/admin/marketing/`:
- **Dashboard**: Vista principal con métricas.
- **Constructor Listas**: UI para configurar los filtros JSONB.
- **Creador Campaña**: Wizard simple para Nombre -> Asunto -> Seleccionar Plantilla -> Seleccionar Lista -> Previsualizar -> Lanzar.
- **Progreso en Vivo**: Barra de progreso conectada a `campaign-metrics`.

## Notas Críticas de Implementación (Reglas de DropCost)
- Cumplir Separación de Capas (UI -> Services -> Utils).
- Testing obligatorio de >70% de cobertura en la lógica de procesamiento y armado de correos.
- No mutar objetos de estado.
- NUNCA console.logs en código final.
- **Dark mode** y **Responsive** obligatorios en las nuevas vistas de Dashboard de Marketing.
