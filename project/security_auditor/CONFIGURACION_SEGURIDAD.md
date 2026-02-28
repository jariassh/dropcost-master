# Configuración de Seguridad - DropCost Master

## Autenticación (Supabase Auth)
- **JWT:** HS256, expiración 30 días.
- **2FA:** Implementado mediante Edge Function `auth-2fa`.
- **Single Session:** Forzado mediante `session_token` en `public.users` y validado en frontend.

## Autorización (PostgreSQL RLS)
- **Modo:** "Nuclear RLS" (Pure JWT Claims).
- **Función:** `is_admin()` basada en metadatos del JWT.
- **Aislamiento:** Filtros obligatorios por `usuario_id` o `tienda_id` (vía join).

## Encriptación de Datos
- **Status:** Planificado para tokens de Shopify y Meta Ads.
- **Algoritmo Sugerido:** AES-256-GCM.
- **Manejo de Llaves:** Secretos en Supabase Edge Functions.

## Auditoría
- **Logs:** Tabla `audit_logs` registra acciones críticas (LOGIN, UPDATE, DELETE).
- **IP Tracking:** Implementado en el sistema de auditoría.
