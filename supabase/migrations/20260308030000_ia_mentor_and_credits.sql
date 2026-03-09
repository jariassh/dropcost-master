
-- ia_threads: Stores conversation headers
CREATE TABLE IF NOT EXISTS public.ia_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    costeo_id UUID REFERENCES public.costeos(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Nueva conversación',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ia_messages: Stores the actual messages
CREATE TABLE IF NOT EXISTS public.ia_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.ia_threads(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tokens_consumed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies
ALTER TABLE public.ia_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_messages ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies if any (safeguard)
DROP POLICY IF EXISTS "Users can manage their own ia_threads" ON public.ia_threads;
DROP POLICY IF EXISTS "Users can manage their own ia_messages" ON public.ia_messages;

CREATE POLICY "Users can manage their own ia_threads"
ON public.ia_threads
FOR ALL
USING (usuario_id = auth.uid());

CREATE POLICY "Users can manage their own ia_messages"
ON public.ia_messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.ia_threads
        WHERE id = thread_id AND usuario_id = auth.uid()
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ia_threads_usuario_id ON public.ia_threads(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ia_threads_costeo_id ON public.ia_threads(costeo_id);
CREATE INDEX IF NOT EXISTS idx_ia_messages_thread_id ON public.ia_messages(thread_id);

-- user_credits table for Phase 4
CREATE TABLE IF NOT EXISTS public.user_credits (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 500 NOT NULL, 
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own credits" ON public.user_credits;

CREATE POLICY "Users can see their own credits"
ON public.user_credits
FOR SELECT
USING (usuario_id = auth.uid());
