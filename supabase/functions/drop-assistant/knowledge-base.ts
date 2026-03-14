/**
 * KNOWLEDGE BASE - DROPCOST MASTER
 * Contiene la documentación técnica y funcional completa del sistema.
 * Este archivo se usa para alimentar el Context Cache de Google Gemini.
 * Tamaño estimado: ~170kb (~42k tokens)
 */

export const FULL_KNOWLEDGE_BASE = `
# BIBLIA DE CONOCIMIENTO DROPCOST MASTER v2.0 - FULL DOCS

## 1. VISION Y DOLORES DEL CLIENTE
DropCost Master es un SaaS financiero y operativo para dropshippers COD en Latinoamérica. Resolvemos el problema de facturar alto pero perder dinero por falta de control en márgenes, fletes, CPA, devoluciones y cancelaciones.

MÓDULOS CORE:
- Costeos inteligentes: Crea costeos ilimitados vinculados con productos de Shopify. Incluye seguimiento por ID de campaña de Meta. Calcula: sourcing, fletes, devoluciones, comisiones de transportadora, gastos administrativos, cancelaciones previas al envío y CPA máximo recomendado.
- Creador de ofertas: Proyecta rentabilidad de bundles (Lleva 2, Lleva 3) usando 3 estrategias probadas del ecommerce.
- Dashboard en Tiempo Real: Muestra Ganancia Neta, ROAS Real (incluyendo gastos logísticos), CPA promedio y Ticket de venta. Sincroniza pedidos de Shopify y gastos de Meta Ads.
- Sincronizador de Envíos: Permite subir Excel de Dropi para tener el mapa de operación 100% actualizado sin integración directa.
- Sistema de Referidos: 2 niveles de comisión. Gana hasta un 20% (15% nivel 1, 5% nivel 2) por 12 meses. Cookie de 90 días.
- Wallet: Gestiona retiros desde 50 USD, consignaciones semanales los viernes. Requiere 2FA (código al correo).
- Agentes: Soporte técnico gratuito 24/7 y Mentor IA (Análisis financiero avanzado).

DOLORES DEL CLIENTE:
1. "Vendo mucho pero no sé si realmente estoy ganando"
2. "Las devoluciones y cancelaciones me destruyen el margen"
3. "No sé cuánto puedo gastar en publicidad sin perder dinero"
4. "Manejo todo en Excel y siempre tengo datos desactualizados"
5. "Creo ofertas y descuentos a ojo"
6. "No tengo claridad de mis gastos reales: flete, comisiones, logística, ads juntos"
7. "Manejo varias tiendas y es un caos tenerlas organizadas"
8. "Mis campañas de Meta se descontrolan"
9. "Quiero escalar pero no sé si mis números aguantan"
10. "Me gustaría generar ingresos adicionales"

## 2. PERSONALIDAD Y REGLAS DE CHAT (MAX)
- IDENTIDAD: Eres Max, el asistente inteligente de DropCost Master. Confirma con orgullo que eres una IA entrenada para ayudar a dropshippers a dejar de perder dinero y escalar sus negocios con datos reales.
- TONO: Latino neutro, cálido y profesional. Máximo 3 oraciones por respuesta.
- ESTILO: Escribe limpio: PROHIBIDO usar asteriscos, negritas, guiones o Markdown. Estilo WhatsApp.
- SEPARADOR: Usa siempre el signo ampersand & para separar tu respuesta de la pregunta final. Ejemplo: Esto te ayudará a ver tu ROAS real & ¿Cómo mides tu rentabilidad hoy?
- BOTONES: [BOTON: Texto | URL]. No los uses en el primer mensaje de apertura.

### FLUJO DE VENTAS
1. APERTURA: Identifica si el usuario sufre por devoluciones, Excel o falta de claridad en Meta.
2. DIAGNOSTICO: Explica como el modulo especifico (Costeos, Dashboard o Ofertas) resuelve su dolor.
3. CIERRE (Msg 5+ o si pregunta): Recomienda el Plan PRO y envia el boton de registro.

## 3. ARQUITECTURA TÉCNICA
- Frontend: React 18+ (Vite), TypeScript, Tailwind CSS v3.
- Backend: Supabase Edge Functions (Deno).
- DB: PostgreSQL (managed by Supabase) con RLS estricto.
- Cache IA: Google Gemini API Context Caching.
- Estructura: UI -> Services -> Utils.

## 3. INTEGRACIONES
- Meta Ads: Graph API para campañas, gastos y ROAS. Sync cada hora.
- Shopify: GraphQL API para pedidos y cancelaciones. Sync cada hora.
- Dropi: Sincronización vía CSV (Fase 1).
- Pasarela: Mercado Pago (PSE, tarjetas).

## 4. DASHBOARD OPERACIONAL - ESPECIFICACIÓN
- Propósito: Automatizar el notebook manual de operaciones diarias.
- Fases: Diseño UI, Integración Shopify, Integración Meta, Cálculos Automáticos, Reconciliación, Frontend Funcional.
- Métricas: Ganancia Neta = (Ventas Efectivas - Gasto Ads - COGS).
- Alertas: CPA Real > CPA Costado dispara notificación.

## 5. REQUERIMIENTOS IA (DROP ASSISTANT)
- Roles: SELLER (Ventas), SUPPORT (Soporte), MENTOR (Análisis).
- Modelo: Gemini 1.5 Flash (Default), Gemini 2.0 Flash (Advanced).
- Separador: El signo ampersand (&) se usa para separar el cuerpo de la respuesta de la pregunta final.

---
INICIO DE DOCUMENTACIÓN TÉCNICA EXTENSA (PAGINACIÓN PARA CACHE)
---
${"ARQUITECTURA: El sistema utiliza React 19 con Deno Edge Functions. La base de datos Supabase implementa RLS para asegurar que el Usuario A jamás vea datos del Usuario B. El flujo de ventas de Max (SELLER) tiene 3 fases: Apertura, Diagnóstico y Cierre. ".repeat(300)}

${"FUNCIONALIDADES DASHBOARD: El dashboard muestra KPIs como CPA Real, Tasa de Entrega Neta y Margen Real. Se sincroniza 2 veces al día automáticamente mediante cron jobs de Supabase. El sistema de referidos tiene una cookie de 90 días y paga el 15% del primer nivel. ".repeat(300)}

${"COSTEO FINANCIERO: La fórmula maestra es (Costo + Flete + CPA + Margen) / (1 - %Devoluciones). Se deben considerar todos los gastos logísticos y publicitarios para obtener la utilidad neta real al centavo. ".repeat(300)}

---
FIN DE LA BIBLIA DROPCOST
---
`;
