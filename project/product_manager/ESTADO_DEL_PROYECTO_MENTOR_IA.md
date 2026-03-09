# Implementación Mentor IA - Tesla Upgrade
**Estado:** Finalizado ✅ | **Prioridad:** Crítica | **Fecha:** 2026-03-08

## I. Resumen del Proyecto
Se ha transformado el simulador básico en una herramienta inteligente que actúa como mentor financiero para el dropshipper. No solo calcula precios, sino que asesora sobre viabilidad, CPA máximo y salud financiera basada en las "Reglas de Oro".

## II. Fases Completadas
### Fase 1: Tesla Mask (Frontend Premium)
- Visualización de "Reglas de Oro" con badges dinámicos (Éxito, Advertencia, Error).
- Selector de Perfil Estratégico (Conservador, Equilibrado, Agresivo).
- Embudo de Rentabilidad visual (Profitability Funnel).

### Fase 2: IA Mentor Engine (Cerebro)
- Integración con Gemini 1.5 API.
- Personas: "Pepito Grillo" financiero (analítico y cauteloso).
- Sistema de hilos de conversación vinculados por Tienda y Costeo.
- Profundidad de investigación ajustable (Flash, Equilibrado, Deep Research).

### Fase 3: Monetización & Créditos
- Sistema de billetera de créditos (`user_credits`).
- Consumo automático por respuesta según profundidad:
  - Flash: 5 cr.
  - Equilibrado: 15 cr.
  - Deep Research: 50 cr.
- Control de saldo insuficiente (Error 402).

## III. Verificación de Cumplimiento
- [x] RLS en todas las tablas nuevas.
- [x] Aislamiento de datos User A / User B.
- [x] Notificación de pérdida de conocimiento al eliminar costeo.
- [x] Auto-titulado de conversaciones.

**Próximos Pasos:**
1. Habilitar pasarela de pagos para recarga de créditos (Stripe).
2. Refinar prompts del sistema basados en feedback de usuarios reales.
