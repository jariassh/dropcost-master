# Actualización de Schema: Tipografía Global
**Fecha:** 2026-03-04
**Agente:** Database Architect

## Tabla: public.configuracion_global
Se han añadido 18 columnas nuevas para soportar la personalización profunda de la identidad visual de la plataforma sin requerir cambios de código.

### Columnas de Familia (TEXT)
- `font_family_primary`: Fuente base para cuerpo y lectura.
- `font_family_secondary`: Fuente para encabezados y UI.
- `font_family_accent`: Fuente para elementos de diseño y citas.
- `font_family_mono`: Fuente para datos técnicos y código.

### Columnas de Escala (TEXT)
- `font_size_base`: Tamaño base (ej: '14px').
- `font_size_h1` a `font_size_h4`: Escala de encabezados.
- `font_size_small`, `font_size_tiny`: Tamaños para etiquetas y leyendas.

### Columnas de Espaciado e Interlineado (TEXT)
- `font_line_height_base`: Interlineado del cuerpo (ej: '1.6').
- `font_line_height_headings`: Interlineado de títulos (ej: '1.25').
- `font_line_height_small`: Interlineado para textos compactos.
- `font_line_height_mono`: Interlineado para bloques de código.
- `font_letter_spacing_h`: Spacing de encabezados.
- `font_letter_spacing_labels`: Spacing de etiquetas (0.5px por defecto).

## 🛡️ RLS & Seguridad
- La tabla sigue protegida por políticas que solo permiten lectura pública para inyección de estilos y edición restringida a usuarios con rol `admin`.
