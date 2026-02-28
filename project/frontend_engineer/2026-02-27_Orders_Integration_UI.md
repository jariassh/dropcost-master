---
date: "2026-02-27"
author: "Frontend Engineer"
task: "Implement UI screens for Shopify configuration and Dropi sync"
---

# Implementación Frontend: Integración de Órdenes (Shopify & Dropi)

## 📌 Contexto
Basado en los diseños finalizados por el equipo de **UX/UI (Modo Desktop)** y la arquitectura establecida por **Backend/DBA**, se implementaron de forma reactiva los componentes dedicados a la automatización de órdenes y logística en `DropCost Master`.

## ✅ Tareas Completadas

### 1. Extensión de Tipos (TypeScript & Supabase)
- Actualizado manualmente `src/types/supabase.ts` para inyectar en la tabla padre `tiendas` los campos de `shopify_domain` y `webhook_short_id`. Esto evitó bloqueos con la autogeneración en local garantizando correctos tipados en React.

### 2. Sincronía y Gestión de Shopify
- **Componente Creado:** `src/components/configuracion/ShopifyConfigModal.tsx`
- **Diseño & Flujo:** 
  - Sigue la estética "Dark Desk" generada por Figma/Stitch (2560px adaptado).
  - Incluye `input` con el addon estático `.myshopify.com` para evitar confusiones al usuario.
  - Implementa generación en vivo de cadenas alfanuméricas de 7 caracteres (Ej. `webhook_short_id`) previniendo pisar datos existentes.
  - Un contenedor especial de Info Alert `Tip` donde se explica cómo enlazar en Shopify mediante el evento de `orders/create`.
- **Integración con Configuración:** Reconfigurada completamente la página `StoreManagementPage.tsx` para lanzar de manera interactiva este Modal desde la "IntegrationCard" de Shopify de cada tienda individual. 

### 3. Sincronizador de Dropi Express
- **Componente Creado:** `src/pages/app/SincronizarPage.tsx`
- Implementada la vista panorámica dedicada a la carga de Excel en Dark Mode.
- Posee Dropzone interactiva con los estados `dragEnter`, `dragLeave`, y simulación de carga `Subir e Importar Data`. Pasa los chequeos estéticos y funcionales (desactiva botón hasta no tener un `selectedFile`).
- Las librerías core están listas para parsear los Array Buffer. (El envío real a AWS/Supabase Functions quedó pendiente hasta integrar Backend parseo final en otro issue).
- Inyectada la página en `AppRouter.tsx` (`/sincronizar`) protegiéndola bajo `SubscriptionGuard`.
- Añadida dinámicamente al menú de navegación lateral en `AppLayout.tsx`.

## 🛠 Próximos Pasos (Dependencias Backend)
La GUI está funcional, documentada y viva en el Workspace. Dependemos ahora del Backend Engineer para armar finalmente el webhook de la Edge Function (Supabase) encargada de recibir Shopify `POST` requests, y para la lógica que consumirá el File XLSX exportado por Dropi en el Frontend.
