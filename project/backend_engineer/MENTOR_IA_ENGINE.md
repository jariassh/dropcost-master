# Mentor IA Engine - Especificaciones Técnicas
**Responsable:** Backend Engineer | **Estado:** Implementado

## I. Edge Functions
- **Función:** `ia-mentor`
- **Tecnología:** Deno, Gemini 1.5 API, Supabase Edge Functions.
- **Seguridad:** 
  - Validación de JWT de usuario.
  - Uso de `service_role` para CRUD de créditos y mensajes (proteger lógica de cobro).
  - API Key de Gemini encriptada/protegida por env vars.

## II. Lógica de Cobro (Taximeter)
- Se valida el saldo en `user_credits` antes de llamar al LLM.
- **Costos definidos:** `{ quick: 5, standard: 15, deep: 50 }`.
- Deducción inmediata tras recibir respuesta exitosa.

## III. Prompt Engineering
- Se inyecta el JSON completo del costeo actual en cada prompt.
- El sistema incluye reglas financieras locales de LATAM (recaudo, devoluciones).
- **Auto-titulado:** La función actualiza el título del thread tras la primera respuesta si no tiene uno.

## IV. Endpoint de Integración
- URL: `POST /functions/v1/ia-mentor`
- Payload: `{ threadId, message, researchDepth, costeoData }`
