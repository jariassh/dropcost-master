---
date: "2026-02-27"
author: "UX/UI Designer"
task: "UI Designs for Orders Integration (Shopify & Dropi)"
---

# Diseños de UI para Integraciones de Órdenes

## 📌 Contexto
Se han creado los diseños para las dos nuevas interfaces solicitadas por el PM: la configuración del Webhook de Shopify y el modal de importación de Excel para Dropi. Estos componentes son esenciales para la fase 1 y 2 de la integración de pedidos.

## 🎨 Diseños Completados

### 1. Configuración Webhook Shopify Dark
**Propósito:** Interfaz de configuración para que el usuario conecte su tienda Shopify.
**Descripción:** Un modal profesional que incluye:
- Campo de entrada editable para "Tu dominio de Shopify" con el sufijo estático `.myshopify.com` como guía visual.
- Botón principal de acción "Generar Webhook".
- Campo de sólo lectura que muestra la URL generada del Webhook, acompañado de un ícono para copiar al portapapeles.
- Una alerta informativa con instrucciones claras: "Pega este enlace en Shopify configurando el evento orders/create en formato JSON".
**Aspectos Destacados:** Mantiene la paleta de colores oscuros (`#111827`, `#1F2937`) y el estilo SaaS limpio de la plataforma.

### 2. Sincronizador Dropi Excel Dark
**Propósito:** Interfaz fluida para que el usuario importe los datos logísticos exportados desde Dropi.
**Descripción:** Un modal/panel que presenta:
- Amplia zona "Drag & Drop" con borde punteado (`#374151`) y un icono central representativo, con el texto "Haz click o arrastra tu archivo .xlsx aquí".
- Caja de información de alerta (`Alert Box`) dando instrucciones precisas sobre cómo exportar el Excel desde Dropi (Pestaña "Mis Pedidos", coincidencia de fechas).
- Botón principal "Subir e Importar Data", con diseño preparado para mostrar estado inactivo antes de seleccionar un archivo.
**Aspectos Destacados:** Interface basada puramente en tipografías y bordes que guían intuitivamente al usuario hacia la carga exitosa de sus hojas de cálculo.

## 📝 Próximos Pasos
Ambos diseños fueron originalmente solicitados y luego regenerados explícitamente con el formato `deviceType: DESKTOP` (2560px) dentro del proyecto de Stitch (`DropCost Master WebApp` - ID: `12671127596624713653`) para garantizar máxima compatibilidad panorámica con el panel web.

**Estado:** APROBADO. Listo para maquetación por el Frontend Engineer.
