# ESTADO DEL PROYECTO: DropCost Master
**Fecha de auditoría:** 26 de febrero de 2026
**Auditor:** Antigravity
**Estado General:** Proyecto funcional con Core (Auth, Simulador, Referidos) sólido; Integraciones y Dashboard en fase de especificación.

---

## 1. INFORMACIÓN DEL PROYECTO
- **Repositorio:** github.com/jariassh/dropcost-master
- **Rama principal:** `develop`
- **Fecha de inicio:** 2026-02-11
- **Commits totales:** 182
- **Última actualización:** 2026-02-26 (Configuración Staging y Rama Dashboard)

---

## 2. STACK TÉCNICO
### Frontend
- **React:** 19.2.0
- **Vite:** 7.3.1
- **TypeScript:** 5.9.3
- **Tailwind CSS:** 4.1.18 (Usando plugin oficial de Vite)
- **Estado/Query:** Zustand 5.0.11 / TanStack Query 5.90.21
- **Gráficos:** Recharts 3.7.0 (Instalado, no implementado en prod)

### Backend/BD
- **Supabase:** PostgreSQL (Managed)
- **Edge Functions:** Deno runtime (12 funciones activas)
- **Auth:** Supabase Auth + JWT + 2FA Custom
- **Storage:** Supabase Storage (Buckets: `avatars`, `branding`)

---

## 3. ESTRUCTURA DE RAMAS
### `main` (Producción)
- **Estado:** Sincronizada con el último ciclo estable (Febrero Semana 4).
- **Commits:** 182
- **Listo para:** Despliegue del MVP funcional (Simulador + Referidos).

### `develop` (Desarrollo integrado)
- **Estado:** Activo.
- **Commits últimos 7 días:** ~25 (Ciclo Febrero Semana 4).
- **Características:** Contiene el sistema de auditoría mejorado, fix de RLS nuclear y sistema de emails robusto.

### `feat/ciclo-marzo-dashboard`
- **Estado:** Rama Actual (En inicio).
- **Objetivo:** Implementación del Dashboard Operacional Fase 1.

---

## 4. CARACTERÍSTICAS IMPLEMENTADAS ✅
### A. Sistema de Autenticación
- [✅] **Login/Logout:** Con traducción de errores y auditoría.
- [✅] **2FA:** Implementado mediante Edge Function y códigos temporales.
- [✅] **Single Session:** Forzado vía `session_token` en tabla `users`.
- [✅] **JWT Management:** Políticas RLS basadas en metadatos de JWT.
- **Notas:** Sistema altamente robusto tras "Nuclear RLS Fix".

### B. Simulador de Costeo
- [✅] **Cálculo básico:** Motor financiero funcional con lógica de márgenes.
- [✅] **Multimoneda:** Soporte para COP, MXN, etc. con redondeo de 2 decimales.
- [✅] **Oferta de bundles:** Wizard de ofertas integrado.
- [✅] **Persistencia en BD:** Guardado de costeos por tienda y usuario.
- **Notas:** Pendiente integración automática con precios reales de Shopify.

### C. Sistema de Referidos
- [✅] **Enlaces personalizados:** Generación automática de códigos únicos.
- [✅] **Comisiones Nivel 1:** 15% (configurable).
- [✅] **Comisiones Nivel 2:** 5% para líderes (identificados por metadatos).
- [✅] **Wallet integrada:** Historial de transacciones y balance disponible.
- **Notas:** Sistema de retiros (`retiros_referidos`) implementado y funcional.

### D. Seguridad
- [✅] **RLS en BD:** Políticas de aislamiento total por `tienda_id` y `usuario_id`.
- [✅] **Encriptación de tokens:** Preparado para tokens de integración.
- [✅] **Auditoría de logs:** Tabla `audit_logs` registra cada acción crítica.
- **Notas:** Se eliminó la recursividad en RLS para mejorar performance.

### E. Landing Page
- [✅] **Hero section:** Diseño Premium con animaciones.
- [✅] **Features section:** Informativa y responsiva.
- [✅] **Pricing section:** Conmutador mensual/anual funcional.
- [✅] **Geolocalización:** Precios dinámicos basados en IP.
- **Notas:** 100% terminada y optimizada para SEO.

### F. Integraciones (Planeadas)
- [❌] **Shopify API:** No iniciado (especificación lista en `/docs`).
- [❌] **Meta Ads API:** No iniciado (especificación lista en `/docs`).
- [🟡] **Mapeo de Campañas:** Estructura de BD preparada en specs.
- **Notas:** El backend carece de los servicios de sincronización activa actualmente.

### G. Dashboard Operacional (En Inicio)
- [🟡] **Estructura BD:** Script `dropcost_staging_clone.sql` generado para staging.
- [❌] **Sync de datos:** Pendiente (Fase 1 Dashboard).
- [🟡] **Interfaz gráficos:** `DashboardPage.tsx` existe como placeholder con KPIs estáticos.
- [❌] **Panel notificaciones:** Especificado, no implementado.

---

## 5. ESPECIFICACIONES DOCUMENTADAS (En `/docs`)
- **INTEGRACION_META_ADS.md:** 26 RFs definidos [❌ No iniciado].
- **DASHBOARD_OPERACIONAL_COMPLETA.md:** Roadmap de 7 fases [🟡 Fase 1 en progreso].
- **TRIGGERS_EMAIL_FINAL.md:** 18 plantillas especificadas [✅ Implementadas al 90%].
- **SISTEMA_PAISES_GLOBAL.md:** Soporte multimoneda [✅ Implementado].

---

## 6. BUGS Y ISSUES CONOCIDOS 🔴
### Bloqueadores críticos
- **Terminal Integration:** El editor Antigravity abre ventanas externas de CMD/PowerShell en algunos entornos Windows. (En investigación/Workaround aplicado en `settings.json`).

### Bugs resueltos (últimos 7 días)
- `fix(auth)`: Garantizar envío de correo de bienvenida aunque falle generación de link.
- `fix(emails)`: Cálculo de `dias_restantes` movido a BD vía cron para consistencia.
- `fix(rls)`: Eliminación de recursividad infinita en políticas de usuario.

---

## 7. PROGRESO POR FASE

### FASE 1: Landing Page & Auth
- **Estado:** 100% Completado.
- **Commits:** ~40

### FASE 2: Simulador de Costeo
- **Estado:** 95% Completado (Falta integración automática).
- **Commits:** ~30

### FASE 3: Sistema de Referidos
- **Estado:** 100% Completado (v3.1 estable).
- **Commits:** ~50

### FASE 4: Seguridad & Pagos
- **Estado:** 90% Completado (Retiros funcionales, falta pasarela automática MP/Stripe).
- **Commits:** ~20

### FASE 5: Dashboard Operacional (PRÓXIMO)
- **Estado:** 🟡 5% (Setup de entorno y rama iniciado).
- **Documentación:** Sí (especificaciones completas).
- **Bloqueadores:** Estabilización de entorno Staging y vinculación de CLI.

---

## 8. ÁRBOL DE TAREAS

### Inmediato (Esta semana)
- [ ] Ejecutar `dropcost_staging_clone.sql` en proyecto de Staging.
- [ ] Configurar Storage Buckets (`avatars`, `branding`) en Staging.
- [ ] Implementar `dashboardService.ts` base.

### Corto plazo (Marzo)
- [ ] Implementar flujo OAuth2 Meta Ads (Edge Function).
- [ ] Crear sincronizador de órdenes Shopify (Webhooks).

### Mediano plazo
- [ ] Sistema de Alertas CPA Inteligente.
- [ ] UI de gráficos avanzada con Recharts.

---

## 9. DEPENDENCIAS Y BLOQUEADORES
- La fidelidad del Dashboard depende de la correcta vinculación de la **Campaña Meta** con el **Producto Shopify**. Este mapeo es manual en la primera fase.

---

## 10. NOTAS IMPORTANTES
- **RLS Nuclear:** Se ha pasado de una arquitectura de consultas cruzadas a una basada 100% en el JWT Claims del usuario. Esto es vital para la performance.
- **Deuda Técnica:** Se recomienda limpiar los archivos SQL sueltos en raíz una vez verificados en Staging.

---

## 11. PRÓXIMAS ACCIONES
1. **Actualizar `.env`**: Asegurar que las llaves de Staging son correctas (especialmente la `Service Role` para el CLI).
2. **Vinculación Supabase**: Correr `npx supabase link --project-ref [ID]` para unir el editor al ambiente de pruebas.
3. **Primer Dashboard Component**: Migrar los KPIs del placeholder a datos reales de la tabla `tiendas`.

---
**Generado por:** Antigravity Auditor Senior
**Confiabilidad:** Alta (Auditoría profunda de Git + Código + DB)
