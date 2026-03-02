# Diseño de Integración: Meta Ads (Facebook)
**Fecha:** 28 de febrero de 2026
**Estado:** 🟡 En Progreso (Diseño)

## I. Objetivo
Diseñar una interfaz intuitiva y premium para que los usuarios de DropCost Master vinculen su cuenta de Meta Ads, seleccionen su Business Manager (BM) y su Cuenta Publicitaria (Ad Account) de forma fluida.

## II. Flujo de Usuario (UX)
1. **Punto de Entrada:** Tarjeta "Meta Ads" en la pestaña de Integraciones (Configuración).
2. **Acción Inicial:** Click en "Conectar con Facebook".
3. **Autenticación:** Apertura de Popup oficial de Facebook/Meta.
4. **Post-Auth (Selección):**
   - La tarjeta se actualiza para mostrar un dropdown de **Business Managers**.
   - Tras seleccionar un BM, se habilita un segundo dropdown de **Cuentas Publicitarias**.
5. **Confirmación:** Click en "Guardar vinculación".
6. **Estado Final:** Tarjeta muestra "Conectado", el nombre de la cuenta y la opción de desvincular.

## III. Especificaciones Visuales

### 1. Tarjeta de Integración (Configuración)
- **Icono:** Logo oficial de Meta (SVG) en color de marca (#0668E1).
- **Título:** Meta Ads (Facebook)
- **Descripción:** "Sincroniza tus gastos de publicidad, CPA y ROAS directamente en tu dashboard."
- **Tentativa:** Icono o texto sutil "TikTok Ads (Próximamente)".
- **Nota:** No incluir Shopify en esta sección de integraciones publicitarias.
- **Botones:** 
  - Primario: Azul Meta (#0668E1) con gradiente suave.
  - Hover: Brillo sutil y elevación (Shadow L1).

### 2. Formulario de Selección (Post-Login)
- **Dropdowns:** Estilo "Glassmorphism" sutil.
- **Labels:** Inter 12px, Semibold, Gris neutro.
- **Micro-interacciones:** Skeleton loader mientras se cargan los BMs desde la API de Meta.

### 3. Estado Conectado
- **Badge:** "Conectado" en verde (#10B981).
- **Detalles:** Nombre de la Cuenta Publicitaria vinculada + Última sincronización.
- **Nota:** ELIMINAR métricas de "Costo sincronizado" y "Eventos recibidos" (no se requieren).
- **Acciones:** Botón secundario rojo "Desvincular" y link azul "Cambiar configuración".

### 3. Estados de Error / Alerta
- **Token Expirado:** Borde sutil rojo (#EF4444) y botón "Re-autenticar".
- **Sin cuentas encontradas:** Ilustración minimalista "Empty state".

## IV. Screens en Stitch (Próximamente)
- [ ] Tarjeta Integración - Estado Desconectado (Dark/Light)
- [ ] Tarjeta Integración - Flujo de Selección (Dark/Light)
- [ ] Tarjeta Integración - Estado Conectado (Dark/Light)

## V. Próximos Pasos de Diseño
1. Crear los 3 estados en el proyecto Stitch `12671127596624713653`.
2. Exportar el código HTML/CSS para el equipo de Frontend.
3. Validar consistencia con el Dashboard Pro existente.
