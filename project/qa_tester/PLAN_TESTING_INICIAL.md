# Plan de Testing Inicial - Dashboard Operacional (Fase 1)

**Versión:** 1.0  
**Fecha:** 26 de febrero de 2026  
**Responsable:** Antigravity QA (QA Tester)

---

## 1. Objetivos de Testing - Fase 1
El objetivo principal en esta fase es asegurar que la base sobre la cual se construirá el dashboard sea sólida, estética y segura.

- **Diseño UI/UX:** Validar estética premium, dark mode y consistencia con `DISEÑO_UIUX.md`.
- **Estructura de BD:** Validar que el schema de Supabase sea correcto y eficiente.
- **Seguridad (RLS):** Asegurar el aislamiento total por `tienda_id` y `usuario_id`.
- **Responsive:** Validar adaptabilidad básica de los nuevos componentes.

---

## 2. Alcance (Features a probar)
1. **Mockups en Stitch/Figma**: Revisión de la fidelidad visual.
2. **Tablas de Integración**: `shopify_integrations`, `meta_integrations`, etc.
3. **Métricas Consolidadas**: Estructura de `dashboard_metrics`.
4. **Relaciones (Mappings)**: Tabla `campaign_mappings`.

---

## 3. Estrategia de Testing
- **Pruebas Estáticas**: Revisión de código (servicios) y archivos SQL.
- **Pruebas de UI (Manuales by Jonathan)**: Uso de checklists para validar el look & feel en diferentes resoluciones.
- **Pruebas de Lógica**: Scripts de Cypress (Happy Paths mockeados).

---

## 4. Criterios de Aceptación (Fase 1)
- [ ] El diseño WOW al usuario (Estética Premium).
- [ ] Dark mode funciona correctamente en todos los componentes del dashboard.
- [ ] El schema de BD sigue fielmente la especificación técnica.
- [ ] Las políticas RLS están definidas para todas las nuevas tablas.
- [ ] Los componentes son responsivos (320px a 1440px).

---

## 5. Próximos Pasos
- [ ] Detallar casos de prueba para el flujo de autenticación de Shopify.
- [ ] Detallar casos de prueba para el flujo de autenticación de Meta Ads.
- [ ] Preparar el script de Cypress para el "Happy Path" inicial.
