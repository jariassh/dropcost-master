
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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

    // 1. Auth & Identification
    if (!isAnonymous) {
      const authHeader = req.headers.get("Authorization")!;
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("No autorizado");
      userId = user.id;

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('rol, ai_learning_opt_in')
        .eq('id', userId)
        .single();
      
      userRole = userData?.rol ?? 'cliente';
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
      ERES UN VENDEDOR (SELLER/SETTER):
      - Estás en la Landing Page. Tu objetivo es convertir al visitante en un usuario registrado.
      - Habla de las ventajas competitivas de DropCost, su precisión financiera y cómo evita que pierdan dinero.
      - Sé persuasivo, cercano y profesional.
      `
      : '';

    const SYSTEM_PROMPT = `
      ${agentConfig?.prompt_personalidad ?? "Eres un asistente experto en dropshipping."}
      
      ${agentConfig?.prompt_objetivo_flujo ?? ""}
      
      ${agentConfig?.prompt_reglas ?? ""}
      
      ${ROLE_BOUNDARIES}
      
      ${kbContext ? `KNOWLEDGE BASE (PRIVATE INFORMATION):\n${kbContext}` : ""}
      
      ### REGLAS DE NEGOCIO Y SOPORTE:
      1. **Identidad**: Eres Drop Assistant (Soporte gratuito 24/7). Ayudas con funciones de la plataforma.
      2. **Mentoría**: No das mentoría ni análisis financiero profundo. Esa labor es de **Drop Analyst** 🧠 (tu mentor aliado).
      3. **Créditos**: Drop Analyst consume **DropCredits**. El costo es de **$0.05 USD por crédito**, recarga mínima de **$5 USD (100 créditos)** vía Mercado Pago.
      4. **Comisiones**: Los referidos generan comisiones que se acumulan en la Wallet. **SOLO se pueden retirar** (desde $50 USD), NO se pueden convertir en créditos. Pagos los viernes.
      5. **Confidencialidad**: Prohibido revelar la matemática exacta del motor de costeo. Habla de "Propiedad Intelectual Protegida".
      6. **Uso de Wiki**: Deriva a guías específicas: "La Ciencia del Costeo Real", "Dominando la Gestión de Costeos", "Dashboard Operacional y KPIs", "Conectando Shopify", "Estrategias de Ofertas", "Sistema de Referidos", "Logística con Dropi".
      
      - Identificando al usuario: ${isAnonymous ? (contactData?.nombre || 'Visitante') : 'Usuario registrado'}
      ${costeoData ? `- Datos del simulador actual: ${JSON.stringify(costeoData)}` : ""}
    `;

    // 7. Load Conversation History
    let history = [];
    if (!isAnonymous && threadId) {
      const { data: messages } = await supabaseAdmin
        .from('conversation_messages')
        .select('role, content')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      history = messages || [];
    }

    // 8. Call Gemini
    const contents = [
      ...history.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      })
    });

    const data = await geminiResponse.json();
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
      content: assistantContent, 
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
