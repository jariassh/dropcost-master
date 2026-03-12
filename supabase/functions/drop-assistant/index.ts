
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { summarizeThread, getCollectiveInsights } from "./ollama-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Modelos según rol
const MODELS = {
  SELLER: "gemma-3-27b-it",
  SUPPORT: "gemma-3-27b-it",
  MENTOR: "gemini-2.5-flash" 
};

/**
 * Fetch con reintento para manejo de cuota (429)
 * Provee la "sensación humana" de espera sugerida por el usuario.
 */
async function fetchWithRetry(url: string, options: any, maxRetries = 2) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  let lastError: any = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type") || "";
      let data: any;

      const text = await response.text();
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: { message: "Invalid JSON from API: " + text.substring(0, 100) } };
        }
      } else {
        data = { text };
      }

      // Si es 429 (Cuota), reintentamos con espera larga
      if (response.status === 429) {
        const modelUsed = url.split('/').slice(-1)[0].split(':')[0];
        console.warn(`[API] 429 Rate Limit hit for ${modelUsed}. Attempt ${i+1}/${maxRetries+1}`);
        if (i === maxRetries) throw new Error(`Cuota de API excedida definitivamente para el modelo ${modelUsed}.`);
        await new Promise(r => setTimeout(r, 4500));
        continue;
      }

      // Si es otro error 4xx (400, 404, 403), NO reintentamos, es un error de config/modelo
      if (!response.ok && response.status < 500) {
        console.error(`[API] 4xx Error ${response.status}:`, JSON.stringify(data));
        throw new Error(data?.error?.message || `API Error ${response.status}`);
      }

      // Si es un error 5xx, reintentamos
      if (!response.ok) {
        console.error(`[API] 5xx Error ${response.status}. Attempt ${i+1}/${maxRetries+1}`);
        if (i === maxRetries) throw new Error(data?.error?.message || `API Error ${response.status}`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      return { response, data };
    } catch (err) {
      lastError = err;
      if (i === maxRetries) throw err;
      console.error(`[API Attempt ${i+1}] Failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError || new Error("Excedido límite de reintentos.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const threadId = payload.threadId;
    const message = payload.message;
    const costeoData = payload.costeoData;
    const roleSelected = payload.roleSelected || 'automatic'; 
    const contactData = payload.contactData; 
    const isAnonymous = payload.isAnonymous || false;
    const context = payload.context || {};
    const appUrl = context.app_url || 'https://app.dropcostmaster.com';
    const referralCode = context.referral_code || 'jariash';

    // 1. Setup Clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let userRole = 'cliente';
    let userId = null;
    let isAdmin = false;
    let userRegistradoNombre = 'Usuario';

    // 2. Auth & Identification
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
        .select('rol, nombres')
        .eq('id', userId)
        .single();
      
      userRole = userData?.rol ?? 'cliente';
      userRegistradoNombre = userData?.nombres?.split(' ')[0] ?? 'Usuario';
      isAdmin = (userRole === 'admin' || userRole === 'superadmin');
    }

    // 3. Role Determination
    let agentRole = 'SUPPORT';
    if (isAnonymous) {
      agentRole = 'SELLER';
    } else if (roleSelected === 'mentoría') {
      agentRole = 'MENTOR';
    }

    // 4. Credit Handling (Only for Mentoring & non-admins)
    let creditCost = 0;
    if (agentRole === 'MENTOR' && !isAdmin && userId) {
      const tokenEstimate = message.length * 4;
      if (tokenEstimate < 500) creditCost = 1;         
      else if (tokenEstimate < 1800) creditCost = 4;   
      else creditCost = 9;                             

      const { data: creditData } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('usuario_id', userId)
        .single();
      
      if ((creditData?.credits ?? 0) < creditCost) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes", needed: creditCost }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 402,
        });
      }
    }

    // 5. Config & Context
    const { data: agentConfig } = await supabaseAdmin
      .from('drop_assistant_agents')
      .select('*')
      .eq('nombre', agentRole)
      .eq('status', 'active')
      .maybeSingle();

    let kbContext = "";
    if (agentRole === 'SUPPORT' || agentRole === 'MENTOR') {
      const { data: kbEntries } = await supabaseAdmin.from('knowledge_base').select('title, content').limit(5);
      kbContext = kbEntries?.map(e => `### ${e.title}\n${e.content}`).join('\n\n') ?? "";
    }

    let plansContext = "";
    if (agentRole === 'SELLER') {
      const { data: plansData } = await supabaseAdmin.from('plans').select('name, price_monthly, description').eq('is_active', true).limit(3);
      plansContext = plansData?.map(p => `- ${p.name} ($${p.price_monthly}/mes): ${p.description}`).join('\n') ?? "";
    }

    // 6. History & Ollama
    let history = [];
    let ollamaSummary = "";
    let ollamaIn = 0, ollamaOut = 0, ollamaTotal = 0;

    if (!isAnonymous && threadId) {
      const { data: messages } = await supabaseAdmin.from('conversation_messages').select('role, content').eq('thread_id', threadId).order('created_at', { ascending: true });
      history = messages || [];
    } else if (isAnonymous && contactData?.email) {
      const { data: leadData } = await supabaseAdmin.from('consultas_anonimas').select('conversacion').eq('email', contactData.email).maybeSingle();
      if (leadData?.conversacion) history = leadData.conversacion;
    }

    if (history.length >= 4) {
      const summaryResult = await summarizeThread(supabaseAdmin, history, userId || undefined);
      ollamaSummary = summaryResult.summary;
      ollamaIn = summaryResult.tokensIn;
      ollamaOut = summaryResult.tokensOut;
      ollamaTotal = summaryResult.tokensTotal;
    }

    // 7. System Prompt - Reglas de brevedad AL INICIO para que el modelo las respete
    const userName = isAnonymous ? (contactData?.nombre || 'Visitante') : userRegistradoNombre;
    const msgCount = history.length;

    const SYSTEM_PROMPT = `### REGLA #1 (OBLIGATORIA, NO NEGOCIABLE):
Responde en MÁXIMO 2-3 oraciones cortas. Estilo WhatsApp. Sin párrafos largos. Sin listas. Sin asteriscos ni bold. Sin emojis excesivos (máximo 1). UNA pregunta por mensaje.

${agentConfig?.prompt_personalidad ?? "Eres un asistente experto en dropshipping."}

${agentConfig?.prompt_objetivo_flujo ?? ""}

${agentConfig?.prompt_reglas ?? ""}

### CONTEXTO:
- Rol activo: ${agentRole}
- Chateando con: ${userName}
- Mensajes previos: ${msgCount}
${msgCount > 0 ? '- ESTA ES UNA CHARLA EN CURSO. PROHIBIDO saludar de nuevo. Continúa directamente.' : '- Primer mensaje: puedes saludar UNA vez de forma breve.'}
${ollamaSummary ? `\n### RESUMEN PREVIO:\n${ollamaSummary}` : ""}
${kbContext ? `\n### KB:\n${kbContext}` : ""}
${plansContext ? `\n### PLANES:\n${plansContext}` : ""}
${costeoData ? `\n### DATOS SIMULADOS:\n${JSON.stringify(costeoData)}` : ""}

RECUERDA: Máximo 2-3 oraciones. Estilo chat. Nada de textos largos.`;

    // 8. Preparar historial con el nuevo mensaje del usuario (NO guardar aún, se guarda en paso 9 con la respuesta)
    let leadHistory = history;
    if (isAnonymous && contactData?.email) {
      const newUserMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
      leadHistory = [...history, newUserMsg];
      // NO hacemos upsert aquí. Se guarda todo junto en el paso 9 para que incluya la respuesta del asistente.
    }

    // Determinar modelo según rol
    let modelName = (MODELS as any)[agentRole] || "gemini-2.5-flash";
    console.log(`[DropAssistant] Role: ${agentRole}, Target Model: ${modelName}`);

    // Preparar historial para Gemini (apiHistory)
    // Si no hay historial previo, inyectamos el saludo del frontend como contexto
    // para que la IA sepa que ya se presentó y no repita el saludo
    const greetingContext = history.length === 0 
      ? [{ role: 'assistant', content: `Encantado de saludarte ${userName}, soy Drop Assistant y estaré encantado de ayudarte el día de hoy.` }]
      : [];

    const apiHistory = ollamaSummary 
      ? [{ role: 'user', content: "Summarized context: " + ollamaSummary }, { role: 'assistant', content: "Understood." }, ...history.slice(-3), { role: 'user', content: message }]
      : [...greetingContext, ...history, { role: 'user', content: message }];

    // 5. Configurar llamada a la API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    // Preparar contenido para la API
    // IMPORTANTE: Gemma no soporta 'system_instruction' como campo separado en v1beta todavía.
    // Inyectamos el prompt del sistema como el primer mensaje del historial.
    const apiContents = [
      {
        role: 'user',
        parts: [{ text: `SYSTEM INSTRUCTION: ${SYSTEM_PROMPT}` }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I will follow those instructions precisely.' }]
      },
      ...apiHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'user' : 'user', // Mapeo seguro
        parts: [{ text: m.content }]
      }))
    ];

    let aiData: any = null;

    try {
      console.log(`[DropAssistant] Sending request to Google API for model: ${modelName}`);
      const fetchResult = await fetchWithRetry(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: apiContents,
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7
          }
        })
      });
      aiData = fetchResult.data;
    } catch (apiErr) {
      console.error(`[DropAssistant] Google API Error for ${modelName}:`, apiErr.message);
      // No hacemos fallback automático para ver el error real del modelo solicitado
      throw new Error(`Error en el modelo ${modelName}: ${apiErr.message}`);
    }

    if (!aiData || !aiData.candidates || aiData.candidates.length === 0) {
      console.error("[DropAssistant] No candidates in AI Response:", JSON.stringify(aiData));
      const googleError = aiData?.error?.message || "Sin respuesta válida del servidor.";
      throw new Error(`Google API (${modelName}): ${googleError}`);
    }

    const assistantContent = aiData.candidates[0].content?.parts?.[0]?.text || "No pude generar una respuesta.";
    const rawUsage = aiData.usageMetadata || {};
    const promptTokens = rawUsage.promptTokenCount || 0;
    // Gemma no devuelve candidatesTokenCount, estimamos desde el texto (~4.5 chars/token en español)
    const estimatedOutTokens = Math.ceil(assistantContent.length / 4.5);
    const outputTokens = rawUsage.candidatesTokenCount || estimatedOutTokens;
    const totalTokens = rawUsage.totalTokenCount || (promptTokens + outputTokens);
    const usage = { promptTokenCount: promptTokens, candidatesTokenCount: outputTokens, totalTokenCount: promptTokens + outputTokens };
    console.log(`[DropAssistant] Tokens - In: ${promptTokens}, Out: ${outputTokens}${!rawUsage.candidatesTokenCount ? ' (est)' : ''}, Total: ${promptTokens + outputTokens}`);

    // 9. Final Persistence
    try {
      let currentThreadId = threadId;
      if (isAnonymous && contactData?.email) {
        console.log(`[Persistence] Saving for lead: ${contactData.email}`);
        const finalChat = [...leadHistory, { 
          role: 'assistant', 
          content: assistantContent, 
          timestamp: new Date().toISOString(),
          ai_stats: {
            model: modelName,
            estimated: !rawUsage.candidatesTokenCount,
            gemini: { in: usage.promptTokenCount, out: usage.candidatesTokenCount, total: usage.totalTokenCount },
            ollama: { in: ollamaIn, out: ollamaOut, total: ollamaTotal }
          }
        }];
        
        const { error: upsertError } = await supabaseAdmin
          .from('consultas_anonimas')
          .upsert({
            email: contactData.email,
            nombre: contactData.nombre,
            telefono: contactData.telefono,
            pais: contactData.pais,
            conversacion: finalChat,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
        
        if (upsertError) console.error(`[Persistence] Upsert Error:`, upsertError);
      } else if (!isAnonymous && userId) {
        console.log(`[Persistence] Saving for user: ${userId}`);
        if (!currentThreadId) {
          const { data: nt, error: tError } = await supabaseAdmin.from('conversation_threads').insert({ 
            usuario_id: userId, 
            tipo: agentRole === 'MENTOR' ? 'mentoría' : 'soporte' 
          }).select().single();
          
          if (tError) {
            console.error(`[Persistence] Thread Creation Error:`, tError);
          } else {
            currentThreadId = nt.id;
          }
        }

        if (currentThreadId) {
          const { error: msgError } = await supabaseAdmin.from('conversation_messages').insert([{ 
            thread_id: currentThreadId, role: 'user', content: message 
          }, {
            thread_id: currentThreadId, role: 'assistant', content: assistantContent,
            tokens_input: usage.promptTokenCount, tokens_output: usage.candidatesTokenCount, tokens_total: usage.totalTokenCount,
            model_name: modelName, ollama_tokens_used: ollamaTotal, credits_consumed: creditCost
          }]);

          if (msgError) console.error(`[Persistence] Message Insert Error:`, msgError);

          await supabaseAdmin.rpc('increment_thread_tokens', { p_thread_id: currentThreadId, p_in: usage.promptTokenCount, p_out: usage.candidatesTokenCount, p_total: usage.totalTokenCount });
          
          if (creditCost > 0) {
            await supabaseAdmin.rpc('increment_credits', { userid: userId, amount: -creditCost });
          }
        }
      }
    } catch (e) {
      console.error(`[Persistence Fatal Error]:`, e);
    }

    return new Response(JSON.stringify({ 
      reply: assistantContent, 
      threadId: isAnonymous ? null : (currentThreadId || threadId) 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[DropAssistant Fatal]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
