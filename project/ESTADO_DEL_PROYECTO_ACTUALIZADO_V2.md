# ESTADO DEL PROYECTO: DropCost Master
**Fecha de auditoría:** 27 de febrero de 2026
**Auditor:** Antigravity (Senior Product Manager)
**Estado General:** Core robusto (Auth, Simulador, Referidos) adaptado a Multi-TimeZone. Dashboard Fase 1 al 40% (RPCs y Webhooks listos).

---

## 1. INFORMACIÓN DEL PROYECTO
- **Repositorio:** github.com/jariassh/dropcost-master
- **Rama principal:** `develop`
- **Rama Actual:** `feat/ciclo-marzo-dashboard`
- **Fecha de inicio:** 2026-02-11
- **Commits totales:** 188 (Tras limpieza PM)
- **Última actualización:** 2027-02-27 (Implementación de Timezone y Fixes de Referidos)

---

## 2. STACK TÉCNICO
### Frontend
- **React:** 19.2.0
- **Vite:** 7.3.1
- **TypeScript:** 5.9.3
- **Tailwind CSS:** 4.1.18 (Mantenido para layouts, Vanilla para componentes premium)
- **Estado:** Zustand / TanStack Query
- **Utilidades:** `dateUtils.ts` (Detección automática de Timezone)

### Backend/BD
- **Supabase:** PostgreSQL + Auth + Edge Functions
- **Edge Functions:** `mercadopago`, `webhook-shopify`, `email-trigger-dispatcher`, `sync-meta-campaigns` (alpha).
- **Timezone Support:** RPCs actualizadas en BD para soportar el parámetro `p_timezone`.

---

## 3. CARACTERÍSTICAS IMPLEMENTADAS ✅

### A. Soporte Global de Tiempo (NUEVO)
- [✅] **Timezone Detection:** Detección automática de zona horaria mediante `Intl.DateTimeFormat`.
- [✅] **UTC to Local Conversion:** Todas las tablas y modales muestran la hora local del usuario.
- [✅] **Header Clock:** Reloj en tiempo real integrado en la interfaz.
- [✅] **Admin Audit:** Tooltips que muestran el tiempo UTC exacto para auditoría administrativa.

### B. Sistema de Referidos v3.2
- [✅] **Cálculo de Ganancias (Fix):** Corregida discrepancia en el total acumulado; ahora se calcula dinámicamente sobre las transacciones (15% real).
- [✅] **Moneda Local:** Soporte para visualización en pesos (COP, MXN, etc.) según el país del perfil.
- [✅] **Historial de Comisiones:** Totalmente sincronizado con el balance mostrado.

### C. Simulador de Costeo
- [✅] **Motor Financiero:** Cálculo exacto de márgenes y ROAS.
- [✅] **Filtros por Fecha:** Corregidos para considerar el inicio/fin del día en la hora local del usuario.

### D. Integraciones
- [✅] **Shopify Webhook:** Estructura inicial para recibir órdenes en tiempo real.
- [🟡] **Meta Ads Sync:** Estructura de sincronización de campañas en fase de pruebas.

---

## 4. PRÓXIMOS PASOS
1. **Fase 1 Dashboard:** Conectar los gráficos del Dashboard Pro con los RPCs de zona horaria.
2. **Shopify Data Mapping:** Vincular SKUs de Shopify con los costeos internos.
3. **Wallet Improvements:** Optimizar el flujo de retiro con confirmaciones bancarias.

---
**Generado por:** Antigravity PM
**Confiabilidad:** Alta (Consistente con los últimos 6 commits de limpieza)
