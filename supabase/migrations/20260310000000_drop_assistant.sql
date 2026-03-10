/*******************************************************************************
 * DROP ASSISTANT & CREDITS SYSTEM - MASTER MIGRATION
 * Based on: RF_DROP_ASSISTANT_SISTEMA_COMPLETO.md
 *******************************************************************************/

-- 1. AGENTS (DYNAMIC PROMPTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_scope') THEN
        CREATE TYPE public.agent_scope AS ENUM ('landing', 'app_registrado', 'app_suscrito');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_status') THEN
        CREATE TYPE public.agent_status AS ENUM ('active', 'inactive');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.drop_assistant_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    scope public.agent_scope NOT NULL,
    prompt_personalidad TEXT NOT NULL,
    prompt_objetivo_flujo TEXT NOT NULL,
    prompt_reglas TEXT NOT NULL,
    status public.agent_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ANONYMOUS CONSULTATIONS (LANDING LEADS)
CREATE TABLE IF NOT EXISTS public.consultas_anonimas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    pais VARCHAR(2), -- ISO 2-letter detected from IP API
    conversacion JSONB DEFAULT '[]', -- Array of {role, content, timestamp}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONVERSATION THREADS (APP)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thread_type') THEN
        CREATE TYPE public.thread_type AS ENUM ('soporte', 'mentoría');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thread_status') THEN
        CREATE TYPE public.thread_status AS ENUM ('active', 'closed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.conversation_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tienda_id UUID REFERENCES public.tiendas(id) ON DELETE CASCADE, 
    tipo public.thread_type NOT NULL DEFAULT 'soporte',
    status public.thread_status DEFAULT 'active',
    total_credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.conversation_threads(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    credits_consumed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREDIT SYSTEM EXTENSION
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_credits') THEN
        CREATE TABLE public.user_credits (
            usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            credits INTEGER DEFAULT 0 NOT NULL,
            total_spent_usd DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='total_spent_usd') THEN
            ALTER TABLE public.user_credits ADD COLUMN total_spent_usd DECIMAL(10,2) DEFAULT 0;
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
        CREATE TYPE public.credit_transaction_type AS ENUM ('purchase', 'usage', 'refund');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo public.credit_transaction_type NOT NULL,
    credits_amount INTEGER NOT NULL,
    cost_usd DECIMAL(10,2),
    consultation_type VARCHAR(50), 
    mercado_pago_transaction_id VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. KNOWLEDGE BASE (TECHNICAL DOCUMENTATION)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'simulador', 'ofertas', 'campañas', 'plataforma', 'créditos', 'referidos'
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    is_public BOOLEAN DEFAULT false, -- Only for internal AI use or also for /soporte page
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SUPPORT TICKETS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE public.ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    thread_id UUID REFERENCES public.conversation_threads(id),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status public.ticket_status DEFAULT 'open',
    priority public.ticket_priority DEFAULT 'medium',
    assigned_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. USER PREFERENCES (ANONYMOUS LEARNING)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_learning_opt_in BOOLEAN DEFAULT false;

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_conv_threads_usuario ON public.conversation_threads(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_thread ON public.conversation_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_credit_trans_usuario ON public.credit_transactions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_usuario ON public.support_tickets(usuario_id);

-- 8. RLS POLICIES
ALTER TABLE public.drop_assistant_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas_anonimas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Cleanup existing
DROP POLICY IF EXISTS "Public readable agents" ON public.drop_assistant_agents;
DROP POLICY IF EXISTS "Admins can view anonymous leads" ON public.consultas_anonimas;
DROP POLICY IF EXISTS "Users can manage their own threads" ON public.conversation_threads;
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.conversation_messages;
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can manage their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;

-- Definitions
CREATE POLICY "Public readable agents" ON public.drop_assistant_agents FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view anonymous leads" 
ON public.consultas_anonimas 
FOR ALL
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')));

CREATE POLICY "Users can manage their own threads" 
ON public.conversation_threads 
FOR ALL 
USING (usuario_id = auth.uid());

CREATE POLICY "Users can manage their own messages" 
ON public.conversation_messages 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.conversation_threads WHERE id = thread_id AND usuario_id = auth.uid()));

CREATE POLICY "Users can view their own credits" ON public.user_credits FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Users can manage their own tickets" ON public.support_tickets FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND rol IN ('admin', 'superadmin')));

-- Populate default agents
INSERT INTO public.drop_assistant_agents (nombre, scope, prompt_personalidad, prompt_objetivo_flujo, prompt_reglas)
VALUES 
(
  'SELLER', 'landing', 
  'Eres DROP ASSISTANT, mentor de dropshipping en DropCost Master. Tu objetivo es entender el dolor del visitante y guiarlo a registrarse. Tono experto, empático y accesible.', 
  'OBJETIVO: Convertir visitante en usuario registrado. FLUJO: Detectar desafío -> Educar -> Resaltar features -> CTA Registro.', 
  'SCOPE: DropCost, e-commerce, campañas. RESTRICCIONES: Nunca inventar features, nunca garantizar resultados.'
),
(
  'SUPPORT', 'app_registrado', 
  'Eres DROP ASSISTANT especialista en soporte técnico de DropCost. Tu objetivo es resolver dudas de funcionamiento técnico.', 
  'OBJETIVO: Resolver dudas técnicas consultando la KNOWLEDGE BASE interna.', 
  'SCOPE: Configuración de tienda, errores en plataforma, referidos. LÍMITE: Soporte técnico gratis, escalar a ticket si no hay solución.'
),
(
  'MENTOR', 'app_suscrito', 
  'Eres DROP ASSISTANT mentor financiero de dropshipping. Tu objetivo es guiar en decisiones de alto valor analítico.', 
  'OBJETIVO: Análisis de viabilidad, estrategia de CPA, optimización de ROAS y buyer persona detallado.', 
  'SCOPE: Mentoría financiera y estrategia de campañas. SEGURIDAD: Nunca reveles fórmulas matemáticas exactas del motor interno.'
)
ON CONFLICT DO NOTHING;
