# 📊 DropCost Master

**DropCost Master** es la plataforma definitiva diseñada para dropshippers de la modalidad **Pago Contra Entrega (COD)** en Latinoamérica. Optimiza tu rentabilidad con un control financiero preciso, métricas en tiempo real y una gestión inteligente de tus costos de operación.

---

## 🚀 Propósito del Proyecto

En el ecosistema del dropshipping COD, la rentabilidad se pierde en los detalles: fletes, porcentajes de devolución y costos de publicidad (CPA). **DropCost Master** resuelve esto mediante un motor de costeo avanzado que permite a los emprendedores saber *exactamente* cuánto están ganando por cada venta antes de que ocurra.

### 🌟 Características Principales

-   **🎯 Simulador de Costeo de Alta Precisión:** Calcula el precio ideal de venta considerando margen deseado, fletes por región, CPA proyectado y, lo más importante, el impacto del % de devoluciones.
-   **📈 Dashboard en Tiempo Real:** Visualiza tus KPIs más importantes: ROAS real, utilidad neta por tienda y rendimiento de campañas.
-   **🏢 Arquitectura Multi-Tenant:** Gestiona múltiples tiendas de forma totalmente independiente y segura desde una sola cuenta.
-   **🔗 Integraciones Estratégicas:** Sincronización automática con Meta Ads, plataformas de logística como Dropi y tiendas Shopify (en desarrollo).
-   **🔒 Seguridad de Grado Empresarial:** Autenticación robusta via Supabase, Row Level Security (RLS) para aislamiento de datos y 2FA opcional.

---

## 🛠️ Stack Tecnológico

El proyecto está construido con las tecnologías más modernas para garantizar velocidad, escalabilidad y una experiencia de usuario excepcional:

-   **Frontend:** [React 19](https://react.dev/) + [Vite 7](https://vite.dev/) (HMR ultra rápido)
-   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) para un código robusto y tipado.
-   **Backend & DB:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions).
-   **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) (Diseño atómico y responsivo).
-   **Estado:** [Zustand](https://zustand-demo.pmnd.rs/) para una gestión de estado ligera y predecible.
-   **Iconografía:** [Lucide React](https://lucide.dev/).

---

## ⚙️ Instalación y Configuración

Para ejecutar este proyecto localmente, sigue estos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/jariassh/dropcost-master.git
    cd dropcost-master
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_anon_key
    ```

4.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```

---

## 📅 Últimas Actualizaciones (Milestones)

### [v1.1.0] - Febrero 2026
- **🔥 Integración Simulador & Ofertas:** Creación automática de "Ofertas Irresistibles" tipo Bundle al guardar un costeo con estrategia de volumen activa.
- **🛡️ Integridad de Datos:** Implementación de restricciones de borrado cruzado; no se pueden eliminar costeos vinculados a ofertas activas sin gestión previa.
- **✨ UX/UI Refinada:** Rediseño de la tabla de "Mis Costeos" con indicadores visuales de precios manuales vs sugeridos por sistema.
- **🎯 Exactitud Financiera:** Mejora en la persistencia de precios modificados manualmente y redondeos inteligentes en el simulador.
- **🏬 Gestión de Tiendas Avanzada:** Módulo completo de creación, edición y borrado de tiendas integrado en Configuración, con sistema de protección de integridad de datos vinculado a costeos operativos.
- **👁️ Auditoría y Seguridad:** Implementación de historial de actividad completo. Registro inmutable de acciones críticas (Login, Creación/Borrado de Tiendas, Cambios de Configuración) con detalles de IP y Agente de Usuario, visible tanto para administradores como para el propio usuario.
- **🔒 Control de Acceso por Plan (Paywall):** Implementación de restricciones estrictas basadas en el plan de suscripción del usuario. Rutas premium como "Sistema de Referidos" y "Billetera" ahora están protegidas. Validación de límites de creación de tiendas en tiempo real (UI y Lógica de Negocio) para asegurar el cumplimiento de las cuotas del plan.

---

## 📐 Estructura del Proyecto

```text
src/
├── components/     # Componentes UI reutilizables y atómicos
├── hooks/          # Hooks personalizados de lógica compartida
├── layouts/        # Estructuras de página (AuthLayout, AppLayout)
├── lib/            # Utilidades y configuraciones (Supabase, axios)
├── pages/          # Vistas principales de la aplicación
├── services/       # Capa de API e interacción con Supabase
├── store/          # Gestión de estado global (Zustand)
└── types/          # Definiciones de tipos de TypeScript
```

---

## 🛡️ Seguridad y Buenas Prácticas

DropCost Master sigue los más altos estándares de desarrollo:
-   **Chesterton's Fence:** Respeto estricto por la lógica arquitectónica previa.
-   **Clean Code (SOLID):** Funciones de responsabilidad única y código auto-documentado.
-   **Aislamiento RLS:** Ningún usuario puede ver datos de otra tienda sin autorización explícita a nivel de base de datos.
-   **Performance Nativ:** Lazy loading de módulos y optimización de bundles (<500KB gzip).

---

## 📄 Licencia

Este proyecto es de propiedad privada para **DropCost Master**. Todos los derechos reservados.

---
*Impulsando la logística inteligente en Latinoamérica.*
