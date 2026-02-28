# Checklists de Validación - Dashboard Operacional

## Checklist: Diseño y Estética (Fase 1)
- [ ] ¿Los colores siguen la paleta de variables CSS?
- [ ] ¿El dark mode se aplica correctamente a todos los paneles?
- [ ] ¿La tipografía sigue los tamaños definidos (H1 32px, Body 14px)?
- [ ] ¿Los bordes redondeados son consistentes (Cards 12px, Inputs 10px)?
- [ ] ¿El logo del app es visible y está bien alineado?

## Checklist: Responsive (Fase 1)
- [ ] 320px (Mobile): No hay scroll horizontal.
- [ ] 375px (iPhone): Legible y botones > 48px.
- [ ] 768px (Tablet): El layout de cards es coherente.
- [ ] 1440px (Desktop): Aprovechamiento del espacio lateral.

## Checklist: Estructura de Datos (Fase 1)
- [ ] Tablas de integración (`shopify_integrations`, `meta_integrations`) creadas.
- [ ] Tabla `dashboard_metrics` tiene todos los campos de cálculos necesarios.
- [ ] Índices creados para `tienda_id` y `fecha`.
- [ ] RLS: Políticas activas y restringidas.
