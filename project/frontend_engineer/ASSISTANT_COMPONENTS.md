# Componentes del Asistente IA
**Responsable:** Frontend Engineer | **Estado:** Implementado

## I. Componentes Core
### 1. `MentorAssistant.tsx`
- Panel lateral deslizable (450px).
- Chat interactivo con Burbujas de mensaje optimizadas.
- Gestión de historial de hilos.
- Selector de Profundidad (Depths) con visualización de costo en créditos.
- Integración con `useToast` para errores de saldo.

### 2. `SimuladorPage.tsx` (Integración)
- Botón flotante (FAB) con badge "AI".
- Pasa los estados de `inputs` y `results` al asistente para contexto en tiempo real.

### 3. `ProfitabilityFunnel.tsx`
- Gráfico de barras segmentado que muestra la erosión del margen desde el precio de venta hasta el neto.

## II. Experiencia de Usuario (Tesla Vibe)
- Gradientes: `linear-gradient(135deg, var(--color-primary)...)`
- Animaciones: `slideIn` keyframes para el panel.
- Micro-interacciones: Hover effects en el FAB y botones de selección.
