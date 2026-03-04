# Implementación de Estándar de Tipografía (RF-ESTANDAR-TIPOGRAFIA)
**Fecha:** 2026-03-04
**Agente:** UX/UI Designer / Frontend Engineer

## 🎯 Objetivo
Estandarizar la jerarquía visual y la legibilidad de la aplicación mediante un sistema de tipografía coherente y configurable.

## 🖋️ Tipografías Seleccionadas
- **Primaria (Lectura/Cuerpo):** `Poppins` (Moderna, geométrica y balanceada).
- **Secundaria (Encabezados/UI):** `Inter` (Optimizada para legibilidad en pantallas).
- **Accent (Destacados/Citas):** `Lora` (Serif elegante para contraste).
- **Mono (Código/Técnico):** `JetBrains Mono` (Máxima claridad para tokens y datos técnicos).

## 📏 Escala y Jerarquía
Se implementaron variables CSS dinámicas que permiten ajustes globales:
- `H1`: 36px (Desktop) / 28px (Mobile) - Bold (700).
- `H2`: 28px - SemiBold (600).
- `H3`: 20px - SemiBold (600).
- `H4`: 16px - Medium (500).
- `Body`: 14px - Regular (400) / Line Height 1.6.
- `Small/Label`: 12px - Letter Spacing 0.5px.
- `Tiny/Cap`: 11px - Letter Spacing 0.5px.

## 🛠️ Herramientas de Administración
Se añadió una sección de **Personalización de Diseño** en los ajustes administrativos:
- Selectores dinámicos de Google Fonts.
- Control de tamaños, interletrado y line-height mediante el nuevo componente `UnitInput`.
- Vista previa premium en tiempo real para validar el balance visual antes de guardar.

## 📱 Responsive
- Se ajustaron las escalas para pantallas móviles (<1024px) reduciendo proporcionalmente los tamaños de encabezados para evitar desbordamientos.
