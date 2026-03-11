
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { summarizeThread, getCollectiveInsights } from "./ollama-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
        threadId, 
        message, 
        costeoData, 
        roleSelected = 'automatic', // 'soporte' | 'mentoría' 
        contactData, // { nombre, telefono, email, pais } for landing
        isAnonymous = false
    } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let userRole = 'cliente';
    let userId = null;
    let isAdmin = false;
    let userRegistradoNombre = 'Usuario registrado';

    // 1. Auth & Identification
    if (!isAnonymous) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No autorizado: Falta token");
      
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("No autorizado: Token inválido");
      userId = user.id;

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('rol, ai_learning_opt_in, nombres')
        .eq('id', userId)
        .single();
      
      userRole = userData?.rol ?? 'cliente';
      userRegistradoNombre = userData?.nombres?.split(' ')[0] ?? 'Usuario registrado';
      isAdmin = (userRole === 'admin' || userRole === 'superadmin');
    }

    // 2. Role Determination
    let agentRole = 'SUPPORT';
    let scope = isAnonymous ? 'landing' : 'app_registrado';

    if (isAnonymous) {
      agentRole = 'SELLER';
    } else if (roleSelected === 'mentoría') {
      agentRole = 'MENTOR';
      scope = 'app_suscrito';
    }

    // 3. Credit Handling (Only for Mentoring & non-admins)
    let creditCost = 0;
    if (agentRole === 'MENTOR' && !isAdmin) {
      // Estimate cost (Logic from doc)
      const tokenEstimate = message.length * 4; // Mock estimate
      if (tokenEstimate < 500) creditCost = 1;         // Rápida
      else if (tokenEstimate < 1800) creditCost = 4;   // Moderada
      else creditCost = 9;                             // Research

      const { data: creditData } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('usuario_id', userId)
        .single();
      
      if ((creditData?.credits ?? 0) < creditCost) {
        return new Response(JSON.stringify({ 
            error: "Créditos insuficientes", 
            needed: creditCost, 
            current: creditData?.credits ?? 0 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 402,
        });
      }
    }

    // 4. Fetch Prompts from DB
    const { data: agentConfig } = await supabaseAdmin
      .from('drop_assistant_agents')
      .select('*')
      .eq('nombre', agentRole)
      .eq('status', 'active')
      .single();
    
    // 5. RAG Context (Knowledge Base)
    let kbContext = "";
    if (agentRole === 'SUPPORT' || agentRole === 'MENTOR') {
      // Simpler Search for MVP: fetch top related categories
      const { data: kbEntries } = await supabaseAdmin
        .from('knowledge_base')
        .select('title, content')
        .order('created_at', { ascending: false })
        .limit(5); // In production, use vector search or specific filters
      
      kbContext = kbEntries?.map(e => `### ${e.title}\n${e.content}`).join('\n\n') ?? "";
    }

    // 5.5 Fetch Active Plans for SELLER context
    let plansContext = "";
    if (agentRole === 'SELLER') {
      const { data: plansData } = await supabaseAdmin
        .from('plans')
        .select('name, price_monthly, description, features')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('price_monthly', { ascending: true });
        
      if (plansData && plansData.length > 0) {
        plansContext = plansData.map(p => `- ${p.name} ($${p.price_monthly}/mes): ${p.description}`).join('\n');
      } else {
        plansContext = "- Starter ($10/mes)\n- Pro ($25/mes)\n- Enterprise ($40/mes)";
      }
    }

    // 6. Build System Prompt
    const ROLE_BOUNDARIES = agentRole === 'SUPPORT' 
      ? `
      SEPARACIÓN DE RESPONSABILIDADES (OBLIGATORIO):
      - Eres "Drop Assistant", el agente de SOPORTE de la plataforma DropCost Master.
      - Tu ÚNICO ámbito es: ayudar con funcionalidades de la plataforma, navegación, configuración de cuenta, 
        planes de suscripción, integraciones (Shopify, Meta, Dropi), billetera, retiros, referidos, 
        errores técnicos, y uso general de la herramienta.
      - NUNCA respondas preguntas de análisis de negocio, estrategia de dropshipping, interpretación de 
        métricas financieras, recomendaciones de precios, análisis de márgenes, CPA, ROI, ni cualquier 
        tema de mentoría o consultoría de negocio.
      - Si el usuario te hace una pregunta de análisis de negocio o estrategia, responde EXACTAMENTE:
        "Esa pregunta es más para nuestro Drop Analyst 🧠. Puedes acceder a él desde el Simulador, 
        Dashboard o el Creador de Ofertas usando la pestaña 'Mentoría'. ¡Ahí te dará un análisis profesional!"
      - NUNCA intentes responder temas de Drop Analyst por tu cuenta.
      `
      : agentRole === 'MENTOR'
      ? `
      SEPARACIÓN DE RESPONSABILIDADES (OBLIGATORIO):
      - Eres "Drop Analyst", el mentor de negocio especializado en dropshipping y e-commerce.
      - Tu ÚNICO ámbito es: análisis financiero, interpretación de costeos, márgenes, CPA,
        estrategias de pricing, validación de ofertas, análisis de viabilidad de productos,
        interpretación de métricas del dashboard, recomendaciones estratégicas de negocio,
        y mentoría en general sobre dropshipping.
      - NUNCA respondas preguntas sobre cómo usar la plataforma, configuración de cuenta,
        planes de suscripción, integraciones técnicas, billetera, retiros, referidos,
        ni errores técnicos de la herramienta.
      - Si el usuario te hace una pregunta sobre la plataforma o soporte técnico, responde EXACTAMENTE:
        "Esa pregunta es más para Drop Assistant 💬. Puedes cambiar a la pestaña 'Soporte' para que 
        te ayude con eso. Yo me enfoco en ayudarte con tu estrategia de negocio."
      - NUNCA intentes responder temas de Drop Assistant por tu cuenta.
      `
      : agentRole === 'SELLER'
      ? `
      ERES UN SETTER EXPERTO (VENTA CONSULTIVA):
      - Tu objetivo es descubrir el dolor del visitante y luego invitarlo a registrarse a DropCost para adquirir un plan.
      - TIENES DOS FASES OBLIGATORIAS:
        FASE 1 - DESCUBRIMIENTO (Máximo 2 preguntas):
        * Escucha su situación.
        * Haz preguntas cortas para encontrar su "punto de dolor" (pain point), ej: "¿Cómo calculas tus márgenes hoy?".
        FASE 2 - PRESENTACIÓN Y CIERRE (Tan pronto conozcas su problema):
        * Valida su problema: "Te entiendo, calcular en Excel es un dolor de cabeza."
        * Presenta DropCost como la ÚNICA solución a SU problema: "Justamente DropCost Master te calcula esa utilidad real al centavo en segundos."
        * Cierra invitándolo a registrarse y elegir su plan. **NUNCA digas que la herramienta es gratis para usar o probar.** El registro es gratis, pero el uso requiere plan.
        * Ejemplo de cierre suave: "¿Te gustaría registrarte gratis para explorar nuestros planes y empezar a ser rentable hoy?".
      - REGLAS ESTRICTAS: 
        * NUNCA te quedes en un bucle infinito de preguntas. Si ya te dijo su problema, PASA A LA FASE 2.
        * Usa datos reales sutilmente: "El 80% pierden dinero sin conocer su CPA real".
        * NO mientas ofreciendo pruebas gratis ni "usarlo gratis". 
      
      - CONOCIMIENTO DE PLANES (Solo para persuadir si preguntan):
      ${plansContext}
      `
      : '';

    // Se eliminó la declaración temprana de SYSTEM_PROMPT para evitar el SyntaxError: Identifier 'SYSTEM_PROMPT' has already been declared.

    // 7. Load Conversation History
    let history = [];
    let ollamaSummary = "";
    let communalInsight = null;

    if (!isAnonymous && threadId) {
      const { data: messages } = await supabaseAdmin
        .from('conversation_messages')
        .select('role, content')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      history = messages || [];

      // Ahorro de Tokens: Si el hilo es largo (>10 msgs), resumimos con Ollama
      if (history.length > 5) {
        ollamaSummary = await summarizeThread(supabaseAdmin, history, userId) || "";
      }
    } else if (isAnonymous && contactData?.email) {
      // Cargar historial de leads (anónimos) desde consultas_anonimas
      const { data: leadData } = await supabaseAdmin
        .from('consultas_anonimas')
        .select('conversacion')
        .eq('email', contactData.email)
        .maybeSingle();
      
      if (leadData?.conversacion && Array.isArray(leadData.conversacion)) {
        history = leadData.conversacion;
      }
    }

    // 8. Aprendizaje Colectivo (Paso B: Enriquecimiento)
    // Buscamos benchmarks si el usuario tiene opt-in o es anónimo (landing)
    if (agentRole === 'MENTOR' && costeoData?.niche) {
      communalInsight = await getCollectiveInsights(
        supabaseAdmin, 
        costeoData.niche, 
        costeoData.pais || 'CO', 
        costeoData.tipo || 'viabilidad'
      );
    }

    // 9. Build Hybrid System Prompt
    const SYSTEM_PROMPT = `
      ${agentConfig?.prompt_personalidad ?? "Eres un asistente experto en dropshipping."}
      ${agentConfig?.prompt_objetivo_flujo ?? ""}
      ${agentConfig?.prompt_reglas ?? ""}
      
      ${ROLE_BOUNDARIES}
      
      ${kbContext ? `KNOWLEDGE BASE (PRIVATE INFORMATION):\n${kbContext}` : ""}
      
      ${ollamaSummary ? `### RESUMEN CONTEXTO PREVIO (CONCISO):\n${ollamaSummary}` : ""}
      
      ${communalInsight ? `### BENCHMARKS COLECTIVOS (CASOS DE ÉXITO):\nNicho: ${costeoData.niche}\nCPA Promedio: $${communalInsight.cpa_promedio}\nMargen Sugerido: ${communalInsight.margen_promedio}%\nInsight: ${communalInsight.resumen_exito}` : ""}

      ### REGLAS DE NEGOCIO Y SOPORTE:
      1. **Identidad**: Eres Drop Assistant (Soporte gratuito 24/7). Si asumes el rol de Drop Analyst (Mentor), ayudas con el negocio.
      2. **Estilo de Comunicación (CRÍTICO)**: Responde con ESTILO WHATSAPP. Muy corto, fluido, directo al grano. NO des introducciones largas. Máximo 40-60 palabras. Siéntete como un amigo charlando por chat.
      3. **Contexto DropCost**: Somos DropCost Master, un SaaS financiero y operacional para dropshippers. Ofrecemos costeos precisos que muestran la utilidad real (descontando devoluciones, fletes, etc). 
      4. **Créditos**: El "Drop Analyst" (Mentoría AI profunda) consume DropCredits.
      5. **Confidencialidad**: No reveles formulas matemáticas exactas.
      6. **Efectividad**: Responde de forma precisa basándote en el resumen previo. No inventes características. Si no sabes, deriva al equipo humano.
      
      ### MODO DE CONVERSACIÓN ACTUAL:
      - Estás chateando en tiempo real con: ${isAnonymous ? (contactData?.nombre || 'Visitante') : userRegistradoNombre}
      - Historial actual: ${history.length} mensajes previos.
      - REGLA CRÍTICA DE SALUDO: ${history.length > 0 ? "ESTA ES UNA CHARLA EN CURSO. PROHIBIDO decir '¡Hola [Nombre]!' o saludar de nuevo. Continúa la charla directamente." : "Este es el primer mensaje, puedes saludar cordialmente una sola vez."}
      ${costeoData ? `- Datos del simulador actual: ${JSON.stringify(costeoData)}` : ""}
    `;

    const finalUserMessage = message;
    
    // Función para garantizar roles estrictamente alternados para Gemini (user -> model -> user -> model ...)
    const buildAlternatingHistory = (messages: any[]) => {
      if (!messages || messages.length === 0) return [];
      const alternated = [];
      let currentRole = messages[0].role === 'assistant' ? 'model' : 'user';
      let currentContent = messages[0].content || '';

      for (let i = 1; i < messages.length; i++) {
        const msgRole = messages[i].role === 'assistant' ? 'model' : 'user';
        if (msgRole === currentRole) {
          currentContent += `\n\n${messages[i].content}`;
        } else {
          alternated.push({ role: currentRole, parts: [{ text: currentContent }] });
          currentRole = msgRole;
          currentContent = messages[i].content || '';
        }
      }
      alternated.push({ role: currentRole, parts: [{ text: currentContent }] });
      return alternated;
    };

    let baseHistory = history;
    if (ollamaSummary) {
        baseHistory = [
            { role: 'user', content: "Contexto previo resumido: " + ollamaSummary },
            { role: 'assistant', content: "Entendido." },
            ...history.slice(-3)
        ];
    }
    
    let processedContents = buildAlternatingHistory([...baseHistory, { role: 'user', content: finalUserMessage }]);
    
    // Si el primer mensaje es 'model', Gemini podría quejarse. Verificamos:
    if (processedContents.length > 0 && processedContents[0].role === 'model') {
        processedContents = [
            { role: 'user', parts: [{ text: 'Iniciando conversación...' }] },
            ...processedContents
        ];
    }
    
    const optimizedContents = processedContents;

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: optimizedContents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.5 }
      })
    });

    const data = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
        console.error("Gemini API Error:", data);
        throw new Error(`Gemini API Error: ${data?.error?.message || "Unknown error"}`);
    }

    const assistantContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

    // 9. Persistence
    if (isAnonymous && contactData?.email) {
      // Buscar si el lead ya existe para no perder el historial
      const { data: existingLead } = await supabaseAdmin
        .from('consultas_anonimas')
        .select('conversacion')
        .eq('email', contactData.email)
        .maybeSingle();

      const previousChat = Array.isArray(existingLead?.conversacion) ? existingLead.conversacion : [];
      const updatedChat = [
        ...previousChat, 
        { role: 'user', content: message, timestamp: new Date().toISOString() }, 
        { role: 'assistant', content: assistantContent, timestamp: new Date().toISOString() }
      ];

      await supabaseAdmin.from('consultas_anonimas').upsert({
        email: contactData.email,
        nombre: contactData.nombre,
        telefono: contactData.telefono,
        pais: contactData.pais,
        conversacion: updatedChat,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });
    } else if (!isAnonymous) {
      // Auth Persistence
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const { data: newThread } = await supabaseAdmin
          .from('conversation_threads')
          .insert({ 
            usuario_id: userId, 
            tipo: agentRole === 'MENTOR' ? 'mentoría' : 'soporte',
            total_credits_used: creditCost
          })
          .select().single();
        currentThreadId = newThread.id;
      }

      await supabaseAdmin.from('conversation_messages').insert([
        { thread_id: currentThreadId, role: 'user', content: message },
        { thread_id: currentThreadId, role: 'assistant', content: assistantContent, credits_consumed: creditCost }
      ]);

      if (creditCost > 0) {
        // Deducir créditos
        await supabaseAdmin.rpc('increment_credits', { userid: userId, amount: -creditCost });
        // Log transaction
        await supabaseAdmin.from('credit_transactions').insert({
          usuario_id: userId,
          tipo: 'usage',
          credits_amount: creditCost,
          consultation_type: creditCost === 1 ? 'rápida' : creditCost === 4 ? 'moderada' : 'research'
        });
      }
    }

    return new Response(JSON.stringify({ 
      reply: assistantContent, 
      threadId: isAnonymous ? null : threadId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("DropAssistant error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
