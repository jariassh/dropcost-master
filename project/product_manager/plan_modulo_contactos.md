# Plan de Implementación: Módulo de Contactos

**Agente:** Product Manager (PM)
**Fecha:** 4 de marzo de 2026
**Estado:** En revisión técnica

## Resumen del RF
El requerimiento funcional `RF_MODULO_CONTACTOS_CON_DESCARGO.md` detalla la creación de un directorio de clientes basado en las órdenes de Shopify, protegido por un descargo de responsabilidad legal. DropCost actuará como intermediario y requerirá el consentimiento explícito del usuario antes de guardar Información de Identificación Personal (PII).

## Decisiones Estratégicas y Riesgos Identificados
1. **Webhook de Shopify (`webhook-shopify`)**:
   - Se ha diseñado una lógica de "scrubbing" (limpieza) que eliminará los datos personales del payload entrante (`cliente_nombre`, `cliente_email`, `cliente_telefono`) antes de guardarlo en la tabla `orders` *si el módulo de Contactos no está explícitamente habilitado*.
   - Se conservarán datos geográficos generales (`cliente_ciudad`, `cliente_departamento`) por ser útiles para estadísticas del Dashboard sin violar privacidad individual.

2. **Sincronización Excel Dropi (`syncService.ts`)**:
   - Se validó el proceso de cruce de Excel y se definió que la misma regla de limpieza se debe aplicar al módulo importador. Si el usuario mapeó columnas asociadas a datos personales, el backend las ignorará si el módulo está inactivo.

3. **Dashboard e Historial**:
   - Las órdenes previas a la habilitación quedan marcadas permanentemente como anónimas. No se permitirá la visualización reactiva de sus datos (bloqueo UI en tarjeta de últimas órdenes).

## Fases de Desarrollo

- **Fase 1 (DBA & Seguridad)**: 
  - Creación de tablas (`contact_module_acceptance`, `shopify_clientes`, `contact_downloads`).
  - Configuración estricta de RLS (Filtrado por `tienda_id`).

- **Fase 2 (Backend)**: 
  - Creación de RPC para habilitar/revocar módulo.
  - Modificación del webhook de Shopify (Scrubbing + Upsert a `shopify_clientes`).
  - Lógica de exportación y auditoría de descargas.

- **Fase 3 (Frontend & Diseño)**: 
  - Integrar campos de revocación en Configuración.
  - Maquetar Modal de Aceptación obligatoria.
  - Construir vista de Contactos principal (DataTable).
  - Bloquear OnClick en Card de Últimas Órdenes del Dashboard.

- **Fase 4 (QA)**: 
  - Verificación de bloqueo de datos con Módulo OFF.
  - Verificación de ingreso de datos con Módulo ON.
  - Validación de inserción de logs de auditoría en la BD.

## Siguientes Pasos
A la espera de aprobación de Jonathan sobre la lógica del Dropi Sync propuesta y la confirmación para iniciar el pase a ejecución técnica.
