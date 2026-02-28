---
date: "2026-02-27"
author: "Backend Engineer"
task: "Global Timezone and Date Consistency Implementation"
---

# Reporte de Implementación: Gestión de Zonas Horarias y Consistencia de Fechas

## 📌 Contexto
Se identificó una discrepancia entre la hora de la base de datos (UTC) y la hora local de los usuarios (ej. Colombia UTC-5), lo que causaba que los filtros del dashboard (como "Hoy") mostraran datos incorrectos y que las fechas de registros históricos (Costeos, Billetera, Referidos) no coincidieran con la realidad del usuario.

## 🛠 Cambios Implementados

### 1. Soporte de Timezone en el Backend (SQL/RPC)
Se actualizaron las funciones RPC críticas para el Dashboard:
- `get_dashboard_pro_data`
- `calculate_kpis`

**Mejoras técnicas:**
- Se añadió el parámetro `p_timezone` (text) a ambas funciones.
- Uso de `AT TIME ZONE p_timezone` en agregaciones temporales (`DATE_TRUNC`) para asegurar que el "día" se defina según la zona del usuario.
- Ajuste en comparaciones de fecha (`CURRENT_DATE` vs `timezone(p_timezone, now())::date`) para garantizar que el filtro de "Hoy" sea exacto.

### 2. Utilidad de Frontend `dateUtils.ts`
Se creó un módulo centralizado en `src/utils/dateUtils.ts` que expone:
- `getUserTimezone()`: Detección automática mediante la API `Intl`.
- `formatDisplayDate()`: Formateo consistente en locale `es-CO` con la zona horaria del navegador.
- `getDateTimeAuditInfo()`: Generación de pares de valores (Local + UTC) para auditoría.

### 3. Refactorización de Páginas de Usuario
Se eliminaron los formateos ad-hoc (`toLocaleDateString`) y lógicas manuales de fechas en:
- **`MisCosteos.tsx`**: Los filtros de rango de fecha ahora inician en `00:00:00` y terminan en `23:59:59` del tiempo local del usuario antes de comparar con los registros UTC de la DB.
- **`WalletPage.tsx`**: Fechas de movimientos y retiros normalizadas.
- **`ReferidosPage.tsx`**: Fechas de registro y de historial de comisiones normalizadas.

### 4. Implementación de Auditoría en Paneles Admin
Para mantener la integridad técnica mientras se mejora la UX, se implementó **Visualización Dual** en:
- `AdminDashboard.tsx` (Usuarios recientes)
- `AdminWithdrawalsPage.tsx` (Fechas de solicitud y pago)
- `AdminReferralPage.tsx` (Configuración y registros)

**Lógica**: El administrador ve la fecha local por defecto, pero al pasar el cursor (Tooltip), puede ver el timestamp original en UTC, facilitando la resolución de disputas técnicas o logs.

### 5. Interfaz: System Clock
Se integró un componente `ClockDisplay` en el header global (`AppLayout.tsx`) que muestra la hora del sistema y la zona horaria detectada, brindando contexto inmediato al usuario sobre el tiempo bajo el cual se están procesando sus datos.

**Estatus de la entrega:** COMPLETADA Y VERIFICADA.
