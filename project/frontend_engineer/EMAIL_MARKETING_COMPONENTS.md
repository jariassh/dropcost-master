# DOCUMENTACIÓN: COMPONENTES DE EMAIL MARKETING
**Estatus:** ✅ Implementado

## Componentes Principales

### 1. `EmailTriggersManager.tsx`
**Ubicación:** `src/components/marketing/`
**Propósito:** Gestionar la automatización de correos electrónicos basada en eventos (triggers).
**Características:**
- Listado de triggers categorizados (Auth, Suscripción, Financiero, etc).
- Panel de historial de envíos integrado con filtros de búsqueda.
- Modal de detalle para inspeccionar el payload JSON y estado de cada envío.
- Responsive: Oculta columnas secundarias en móviles para legibilidad.

### 2. `EmailTemplatesManager.tsx`
**Ubicación:** `src/components/marketing/`
**Propósito:** Editor centralizado de plantillas de correo.
**Características:**
- Soporte para MJML y HTML plano.
- Sistema de navegación por carpetas para organización de plantillas.
- Integración con variables dinámicas de usuario, suscripción y tienda.
- Selector de remitente (Sender Selector) integrado.

### 3. `MJMLAttributeModal.tsx`
**Ubicación:** `src/components/marketing/components/`
**Propósito:** Interfaz visual para configurar atributos de etiquetas MJML.
**Características:**
- Generador de código visual con vista previa en tiempo real.
- Soporte para componentes complejos (`mj-text`, `mj-button`, etc).

## Integración en Dashboard
- El dashboard de marketing ahora actúa como un `Shell` que orquesta estos gestores mediante una interfaz de pestañas (`Tabs`).
- Se optimizó el espacio eliminando paddings externos duplicados y contenedores `maxWidth` fijos dentro de los componentes internos.

---
**Nota Técnica:** Se utiliza `React.Suspense` en el router para cargar el dashboard de marketing, el cual ahora incluye dinámicamente estos gestores.
