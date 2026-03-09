# Mentor IA - Diseño del Esquema & RLS
**Responsable:** Database Architect | **Estado:** Implementado (SQL 20260308030000)

## I. Tablas Nuevas
### 1. `user_credits`
- `credits`: integer.
- `usuario_id`: UUID (FK to auth.users).
- **Default:** 0 créditos iniciales.

### 2. `ia_threads`
- `id`: UUID.
- `tienda_id`: UUID (FK to tiendas).
- `costeo_id`: UUID (FK to costeos, nullable).
- `title`: text.
- `updated_at`: timestamp with timezone.

### 3. `ia_messages`
- `thread_id`: UUID.
- `role`: text ('user', 'assistant').
- `content`: text.
- `tokens_consumed`: integer.

## II. Seguridad (RLS)
- **ia_threads:** `usuario_id = auth.uid()` ensures isolation per user.
- **ia_messages:** Access only through threads owned by the user.
- **user_credits:** Only the user can read their own credits. Updates are handled via service role from the Edge Function for integrity.

## III. Índices
- `idx_threads_tienda`: Optimiza el filtrado por tienda en el panel de historial.
- `idx_messages_thread`: Carga rápida de chats largos.
