# Refactor del Sistema de Tipografía y Branding
**Fecha:** 2026-03-04
**Agente:** Frontend Engineer

## 🚀 Cambios Técnicos
Se ha refactorizado la forma en que la aplicación maneja e inyecta la tipografía para cumplir con los requerimientos de diseño premium.

### 1. Sistema de Variables (CSS Custom Properties)
Se actualizaron las variables en `index.css` para soportar roles específicos:
- `--font-body`, `--font-headings`, `--font-accent`, `--font-mono`.
- Escala de tamaños y line-heights refinada: `--fs-base`, `--fs-h1-h4`, `--lh-base`, etc.

### 2. Nuevo Componente: `UnitInput`
Se desarrolló un componente especializado para la manipulación de valores numéricos con unidades (`px`, `rem`, `em`):
- Soporte para navegación con teclado (flechas Up/Down).
- Precisión dinámica: pasos de `0.1` para `rem` y `0.005` para `em` (interletrado).
- Sanitización automática de valores sin unidad (ej: `line-height`).

### 3. Hook `useGlobalConfig` & `configService`
- **Carga Dinámica:** El hook ahora inyecta hasta 4 familias de Google Fonts simultáneamente.
- **Sincronización:** Se mejoró la lógica de sincronización para evitar "cajas vacías" cuando la base de datos tiene campos nulos, utilizando fallbacks del RF.
- **Persistencia:** Se añadieron 6 nuevos campos a la tabla `configuracion_global`.

### 4. Integración en Componentes Core
- Se actualizó el componente `Card` para usar las nuevas variables.
- Se refinaron estilos globales de encabezados (`h1`-`h4`) con pesos específicos y espaciado de letras.

## 📦 Build & Deploy
- Se ejecutó `npm run build` para generar el bundle optimizado.
- Se validaron los pesos de las fuentes cargadas para no penalizar el LCP.
