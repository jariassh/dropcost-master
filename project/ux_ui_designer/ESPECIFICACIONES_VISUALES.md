# Especificaciones Visuales - DropCost Master

## Estándares Generales (Basado en DISEÑO_UIUX.md)

### Colores
- **Primario:** `#0066FF` (Azul DropCost)
- **Éxito:** `#10B981` (Verde)
- **Error:** `#EF4444` (Rojo)
- **Advertencia:** `#F59E0B` (Naranja)

**Fondos (Light):**
- Bg Principal: `#FFFFFF`
- Bg Secundario: `#F9FAFB`

**Fondos (Dark):**
- Bg Principal: `#1F2937`
- Bg Secundario: `#111827`

### Tipografía
- **Font:** Inter
- **H1:** 32px, bold (700)
- **H2:** 28px, bold (700)
- **H3:** 24px, semibold (600)
- **Body:** 14px, regular (400)

### Espaciado (Escala 8px)
- **Padding Inputs:** 12px 16px
- **Padding Cards:** 16px
- **Padding Secciones:** 24px / 32px
- **Border Radius:** 10px (Inputs), 8px (Buttons), 12px (Cards)

---

## Screen: Dashboard KPIs (Administrativo)
**Ubicación Stitch:** DropCost Master WebApp > Dashboard KPIs

**Descripción:** 
Panel principal para escritorio que muestra métricas financieras, gráficos de tendencia y gestión de órdenes.

**Componentes:**
- Sidebar: Navegación fija (#0F172A).
- Header: Herramientas administrativas y usuario.
- KPI Cards: 4 tarjetas en fila con iconos pastel y valores bold.
- Spline Area Chart: Visualización de ganancias del periodo actual.
- Tabla de Órdenes: Listado con badges de estado (Completado, Pendiente, Cancelado).

**Variantes:**
- Light mode ✅ (ID: 2e02b7c39ab04a6f8c80541d4c01f38b)
- Dark mode ✅ (ID: 1d3a80adc52647128aac78c7847e4b87)

**Código exportado:**
- [dashboard_kpis_light.html](file:///c:/Users/user/Desktop/Dropshipping/Dev/DropCost%20Master/project/ux_ui_designer/CODIGO_EXPORTADO/dashboard_kpis_light.html)
- [dashboard_kpis_dark.html](file:///c:/Users/user/Desktop/Dropshipping/Dev/DropCost%20Master/project/ux_ui_designer/CODIGO_EXPORTADO/dashboard_kpis_dark.html)

---

## Screen: Dashboard Pro (Avanzado)
**Ubicación Stitch:** DropCost Master WebApp > Dashboard Pro

**Nuevos Componentes Operacionales:**
- **Segunda Fila de KPIs:**
  - **ROAS:** Badge dinámico (Verde > 3.0, Naranja 2.0-3.0, Rojo < 2.0).
  - **AOV (Ticket Promedio):** Formato moneda.
  - **CVR (Tasa de Conversión):** Formato porcentaje con indicador de tendencia (flecha arriba/abajo).
- **Gráficos Avanzados:**
  - **Ventas vs Gastos:** Gráfico de columnas agrupadas con tooltips detallados.
  - **ROAS Trend:** Gráfico de líneas suavizadas (Spline) con puntos de control semanales.

**Variantes:**
- Light mode ✅ (ID: 5bb7dbf2ae1f42589f7a8242feb5182a)
- Dark mode ✅ (ID: b772fa9cfa23411aa402488652920efe)
