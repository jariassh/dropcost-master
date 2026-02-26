# Plan de Implementación - Frontend Dashboard Operacional

**Versión:** 1.0
**Estado:** Diagnóstico Inicial
**Agente:** Antigravity Frontend

## 1. Visión General
El objetivo es transformar el placeholder actual del Dashboard en una interfaz funcional y dinámica que consolide métricas de Shopify y Meta Ads, proporcionando una vista clara de Ganancia/Pérdida, CPA y rendimiento de campañas.

## 2. Diagnóstico Inicial

### Componentes Existentes (Reutilizables)
- `Card`: Para contenedores de métricas y gráficos.
- `StatsCard`: Para mostrar KPIs (posible reemplazo o base para los nuevos).
- `Badge`: Para estados de alerta.
- `Button`: Navegación y acciones.
- `Alert`: Mensajes de estado/error.

### Componentes Nuevos a Implementar (Basados en Stitch)
- `DashboardKPIs`: Grid de métricas superiores (Ganancia, Ventas, Gastos).
- `MainPerformanceChart`: Gráfico de línea para Ganancia/Pérdida histórica.
- `AdsBreakdownChart`: Gráfico de barras o pie para distribución por campaña.
- `OrdersMiniTable`: Tabla resumida de últimas órdenes.
- `CPAAlertCard`: Card específica para alertas de CPA excedido.
- `NotificationFlyout`: Panel lateral/flotante para notificaciones.

### Servicios Requeridos
- `dashboardService.ts`: Integración con la API para obtener métricas consolidadas.
- `notificationService.ts`: (Ya existe) Ampliar para manejar alertas de CPA.

## 3. Fases de Trabajo (Frontend)

### Fase 1: Estructura y Mocking (Semana 1)
- [ ] Definir interfaces TypeScript para métricas del dashboard.
- [ ] Crear `dashboardService.ts` con datos mock iniciales.
- [ ] Implementar layout base del Dashboard (responsivo 320px-1440px).
- [ ] Implementar componentes visuales con `inline styles`.
- [ ] Validar Dark Mode en todos los nuevos componentes.

### Fase 2: Integración Real (Semana 2)
- [ ] Conectar con Endpoints de Supabase Edge Functions.
- [ ] Implementar manejo de estados de carga (Loading) y error.
- [ ] Integrar filtros de fecha y tienda.
- [ ] Sincronización manual de datos desde el UI.

### Fase 3: Pulido y UX (Semana 3)
- [ ] Implementar animaciones de entrada (fadeIn, transiciones).
- [ ] Micro-interacciones en los gráficos.
- [ ] Validación final de 6 resoluciones.
- [ ] Documentación técnica final.

## 4. Dependencias del Backend
- El backend debe proveer el endpoint `GET /api/dashboard/:tienda_id`.
- Sincronizadores de Shopify y Meta deben estar operativos en Staging.

## 5. Próximos Pasos Inmediatos
1. Solicitar código exportado de Stitch al Designer.
2. Implementar `DashboardKPIs` con datos estáticos iniciales.
3. Configurar interfaces de datos en `/src/types/dashboard.ts`.
