-- Migración para trazabilidad de tokens y modelos en el sistema de IA
-- DropCost Master 2026-03-12

-- 1. Añadir columnas a conversation_messages
ALTER TABLE public.conversation_messages 
ADD COLUMN IF NOT EXISTS tokens_input integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_output integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tokens_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS model_name text,
ADD COLUMN IF NOT EXISTS ollama_tokens_used integer DEFAULT 0;

-- 2. Añadir columnas a conversation_threads para totales acumulados
ALTER TABLE public.conversation_threads
ADD COLUMN IF NOT EXISTS total_tokens_input integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens_output integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens_total integer DEFAULT 0;

-- 3. Comentarios descriptivos
COMMENT ON COLUMN public.conversation_messages.tokens_input IS 'Tokens enviados al modelo de Google (Gemini/Gemma)';
COMMENT ON COLUMN public.conversation_messages.tokens_output IS 'Tokens devueltos por el modelo de Google';
COMMENT ON COLUMN public.conversation_messages.ollama_tokens_used IS 'Tokens consumidos por Ollama para el resumen previo a este mensaje';
COMMENT ON COLUMN public.conversation_threads.total_tokens_total IS 'Acumulado total de tokens consumidos en todo el hilo de charla';
