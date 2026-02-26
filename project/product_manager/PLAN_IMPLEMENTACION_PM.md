# PLAN DE IMPLEMENTACIÓN MAESTRO - Dashboard Operacional
**Responsable:** Antigravity PM
**Fecha:** 26 de febrero de 2026
**Objetivo:** Desarrollar e integrar el Dashboard Operacional Fase 1.

---

## 1. DIAGNÓSTICO DE SITUACIÓN ACTUAL

### Lo que ya tenemos:
- [✅] Especificaciones completas en `/docs/ESPECIFICACION_TECNICA_DASHBOARD_OPERACIONAL_COMPLETA.md`.
- [✅] Sistema de componentes base (`Button`, `Card`, `Badge`, `StatsCard`) en `src/components/common`.
- [✅] Estructura de página `DashboardPage.tsx` inicial (placeholder).
- [✅] Entorno de base de datos preparado para staging.

### Lo que falta (Brechas):
- [❌] Lógica de negocio en frontend (`dashboardService.ts`).
- [❌] Edge Functions de sincronización (Shopify y Meta Ads).
- [❌] Mapeo manual de campañas en el simulador.
- [❌] Estabilización de CLI Supabase para despliegue de funciones.

---

## 2. PLAN DE ACCIÓN POR AGENTES

### FASE 1: Estructura y Backend (Esta Semana)
**Responsable:** Backend Agent / PM
1. **Tarea:** Implementar `dashboardService.ts` en `src/services/`.
   - Objetivo: Definir interfaces y métodos para obtener métricas y conectar integraciones.
2. **Tarea:** Crear estructura de Edge Functions.
   - `sync-shopify-orders`: Función base para traer órdenes.
   - `sync-meta-campaigns`: Función base para traer gastos.
3. **Tarea:** Ejecutar migraciones SQL en Staging.
   - Archivo: `project/dropcost_staging_clone.sql`.

### FASE 2: Diseño UI y Mockups (Siguiente)
**Responsable:** Designer Agent
1. **Tarea:** Crear wireframes detallados basados en la especificación técnica.
2. **Tarea:** Validar estética premium y dark mode.

### FASE 3: Desarrollo Frontend (En curso)
**Responsable:** Frontend Agent
1. **Tarea:** Migrar `DashboardPage.tsx` de estático a dinámico usando el nuevo servicio.
2. **Tarea:** Implementar gráficas básicas con Recharts (ya instalado).

---

## 3. BLOQUEADORES Y RIESGOS

| Bloqueador | Impacto | Mitigación |
| --- | --- | --- |
| Estabilización de Staging | Alto | PM debe validar credenciales y link de Supabase CLI. |
| Límites de API Meta/Shopify | Medio | Implementar Backoff y logs detallados en Edge Functions. |
| Mapeo Manual | Medio | Documentar flujo claro para el usuario en el costeo. |

---

## 4. PRÓXIMOS PASOS RECOMENDADOS

1. **Aprobación de Jonathan:** Validar este plan estratégico.
2. **Asignación a Designer:** Comenzar con los wireframes para asegurar visual premium.
3. **Backend Setup:** Iniciar con la creación de las tablas y el servicio base.

---
**Actualizado por:** Antigravity PM
