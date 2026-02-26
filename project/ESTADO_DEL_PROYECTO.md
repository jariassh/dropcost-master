# ESTADO DEL PROYECTO: DropCost Master
**Fecha de actualización:** 26 de febrero de 2026
**Estado:** MVP Operativo / En Desarrollo de Dashboard Operacional

---

## 1. Visión General
DropCost Master es una plataforma integral diseñada para la optimización financiera de negocios de Dropshipping en LATAM. Permite a los usuarios calcular costos, márgenes y CPA en tiempo real, gestionar integraciones con Shopify y Meta Ads, y participar en un ecosistema de referidos.

## 2. Arquitectura Técnica (Ironclad)
Siguiendo las directrices del Arquitecto, el proyecto mantiene una separación estricta de capas:

- **Frontend:** React + Vite + TypeScript.
- **Backend/Base de Datos:** Supabase (PostgreSQL + Auth + Storage + Edge Functions).
- **Estilo:** CSS Vanilla con variables centralizadas (Variables CSS en `:root`).
- **Principios:** Inmutabilidad, Early Return, y Single Responsibility.

## 3. Capas del Sistema

### A. UI (Presentación)
- **Common Components:** Botones, Inputs (Currency/Formatted), Cards, Modals, Alerts, Badges. Todos con soporte nativo para **Dark Mode**.
- **Layouts:** `AppLayout` (Panel de usuario), `AdminLayout` (Panel administrativo), `MainLayout` (Landing/Páginas públicas).
- **Páginas Principales:**
    - `LandingPage`: Punto de entrada optimizado para conversión.
    - `SimuladorPage`: Motor de cálculo financiero.
    - `Dashboard`: (En desarrollo) Visualización de métricas en tiempo real.
    - `ConfiguracionPage`: Gestión de perfiles, tiendas e integraciones.
    - `ReferidosPage`: Gestión de red y comisiones.

### B. Services (Lógica de Negocio)
Ubicados en `src/services/`, orquestan la comunicación con Supabase:
- `authService`: Autenticación, 2FA, y control de sesión única.
- `costeoService`: Lógica de simulaciones y persistencia de costeos.
- `referralService`: Sistema de red de líderes y comisiones multinivel.
- `walletService`: Gestión de saldo y retiros.
- `configService`: Configuración dinámica de marca y branding (logos, favicons).

### C. Utils & Hooks (Helpers)
- `useSessionEnforcer`: Garantiza una única sesión activa por usuario.
- `useAuth`: Hook centralizado para el estado de autenticación.

---

## 4. Funcionalidades Implementadas

### ✅ Sistema de Costeo (Simulador)
- Cálculo dinámico de `Utilidad Neta`, `ROAS Objetivo` y `Viabilidad` (Semáforo).
- Soporte multimoneda con redondeo bancario a 2 decimales.

### ✅ Gestión de Referidos V3.1
- Enlaces de referido personalizados.
- Comisiones nivel 1 y nivel 2 (líderes).
- Wallet integrada para seguimiento de ganancias.

### ✅ Seguridad y Acceso
- Autenticación con JWT (30 días de expiración).
- **2FA obligatorio** mediante códigos de un solo uso.
- **Single Session Enforcement**: Cierre automático de sesiones previas al iniciar una nueva en otro navegador/dispositivo.

### ✅ Integraciones (Cimientos)
- Soporte estructural para Shopify y Meta Ads.

---

## 5. Diseño y Estética (Premium)
- **Paleta:** Basada en variables CSS (`--primary`, `--bg-primary`, etc.).
- **Escala de Espaciado:** 4, 8, 12, 16, 24, 32, 48, 64px (Estricto).
- **Tipografía:** H1 (32px), H2 (28px), Body (14px).
- **Dark Mode:** Implementado al 100% en todas las interfaces mediante atributos de datos.

---

## 6. Base de Datos y Seguridad (RLS)
- **Multi-tenancy:** Toda consulta incluye `tienda_id` y `usuario_id`.
- **Nuclear RLS:** Políticas robustas basadas en JWT para evitar recursividad y fugas de datos.
- **Auditoría:** `audit_logs` para registro de acciones críticas (Logins, cambios de plan).

---

## 7. Próximos Pasos (Roadmap)
1. **Fase 1 Dashboard:** Implementación de visualización de métricas reales Shopify/Meta.
2. **Sistema de Notificaciones:** Alertas proactivas de CPA alto y estados de integración.
3. **Optimización de Performance:** Mejora de tiempos de carga en dispositivos móviles.

---
> **Nota para el Agente:** Antes de realizar modificaciones críticas, consulte el [Plan de Implementación](file:///c:/Users/user/.gemini/antigravity/brain/d5ac2bbe-87ba-4c8e-9252-d04b34c64e4a/implementation_plan_dashboard.md) y siga el Protocolo de Seguridad de BD.
