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

### [v1.0.0] - Lanzamiento Oficial (Febrero 2026) 🚀
¡Versión lista para producción! Esta versión consolida todo el ecosistema de DropCost Master:
- **💰 Pagos Reales:** Integración completa con Mercado Pago Pro (Checkout Transparente) y manejo automatizado de suscripciones mediante Webhooks.
- **📈 Sistema de Referidos Profesional:** Atribución persistente mediante cookies de 90 días con modelo "Last Click Wins", red de 2 niveles y billetera de comisiones.
- **🎨 Branding & Personalización:** Gestión dinámica de logos, favicons y metadatos SEO (Open Graph, robots.txt, sitemap.xml) desde el panel administrativo.
- **🏢 Core Robusto:** Simulador de costeo avanzado con lógica de bundles, gestión multi-tienda y paywall por planes.
- **📧 Comunicaciones Automáticas:** Sistema de plantillas MJML/HTML para correos transaccionales y notificaciones de sistema.
- **🛡️ Seguridad & Auditoría:** Registros de actividad persistentes, 2FA y aislamiento total de datos (RLS).

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
