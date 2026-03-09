
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `
ERES EL "DROPGURU", el mentor financiero definitivo para dropshippers en LATAM. 
Tu tono es profesional, analítico y honestamente estricto (como "Pepito Grillo"). 
Tu objetivo es evitar que los dropshippers pierdan dinero y maximizar su rentabilidad.

REGLAS DE ORO QUE DEBES HACER CUMPLIR:
1. MARGEN NETO: Nunca apruebes un producto con menos del 20% de margen neto real. Advierte que es RIESGOSO si es < 15%.
2. REGLA DEL 40%: El Costo del Producto + Flete no debe superar el 40% del precio de venta.
3. ADVERTENCIA DE PUBLICIDAD: Si el CPA proyectado es mayor a 1/3 del margen bruto, advierte que la rentabilidad es FRÁGIL.
4. ESTRATEGIA DE VOLUMEN: Si un margen es bajo, sugiere proactivamente pasar del simulador al "Creador de Ofertas" para vender por volumen (Llevese 2, Llevese 3) y diluir costos logísticos.

CONOCIMIENTO DE ESTRATEGIAS:
Eres experto en las 3 estrategias del ecosistema DropCost Master:
- CONSERVADORA: Validar producto con margen amplio.
- EQUILIBRADA: Escalamiento moderado con ofertas de volumen.
- ESCALAMIENTO: Bundles agresivos para maximizar ROAS.

Siempre usa datos del simulador si te los proporcionan (precio, costo, flete, CPA).
Responde en Español.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
        threadId, 
        message, 
        costeoData, 
        researchDepth = 'standard' 
    } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No autorizado");

    // A. Validar Créditos
    const { data: creditData } = await supabaseAdmin
        .from('user_credits')
        .select('credits')
        .eq('usuario_id', user.id)
        .single();
    
    const currentCredits = creditData?.credits ?? 0;
    const creditCost = researchDepth === 'deep' ? 50 : researchDepth === 'standard' ? 15 : 5;

    if (currentCredits < creditCost) {
        return new Response(JSON.stringify({ 
            error: "Créditos insuficientes", 
            needed: creditCost, 
            current: currentCredits 
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 402, // Payment Required
        });
    }

    // 1. Validar/Cargar Thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
        // Crear nuevo thread si no existe
        const { data: newThread, error: threadError } = await supabaseAdmin
            .from('ia_threads')
            .insert({
                usuario_id: user.id,
                tienda_id: costeoData?.tienda_id,
                costeo_id: costeoData?.id,
                title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
            })
            .select()
            .single();
        
        if (threadError) throw threadError;
        currentThreadId = newThread.id;
    }

    // 2. Cargar historial del thread
    const { data: history } = await supabaseAdmin
        .from('ia_messages')
        .select('role, content')
        .eq('thread_id', currentThreadId)
        .order('created_at', { ascending: true });

    // 3. Preparar Prompt para Gemini
    const contents = [
        { role: "user", parts: [{ text: `CONTEXTO DEL SIMULADOR: ${JSON.stringify(costeoData || {})}` }] },
        ...(history || []).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        })),
        { role: "user", parts: [{ text: message }] }
    ];

    // 4. Llamada a Gemini
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: {
                maxOutputTokens: researchDepth === 'quick' ? 300 : researchDepth === 'deep' ? 2048 : 800,
                temperature: 0.7,
            }
        })
    });

    const data = await geminiResponse.json();
    const assistantContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu solicitud.";
    const totalTokens = data.usageMetadata?.totalTokenCount || 0;

    // 5. Guardar mensajes y DESCONTAR créditos
    await Promise.all([
        supabaseAdmin.from('ia_messages').insert([
            { thread_id: currentThreadId, role: 'user', content: message },
            { thread_id: currentThreadId, role: 'assistant', content: assistantContent, tokens_consumed: totalTokens }
        ]),
        supabaseAdmin.from('user_credits')
            .update({ credits: currentCredits - creditCost })
            .eq('usuario_id', user.id)
    ]);

    // Opcional: Auto-titulado si es el primer mensaje
    if (!threadId) {
        // Podríamos hacer otra micro-llamada para un título mejor, pero por ahora usamos el recorte.
    }

    return new Response(JSON.stringify({ 
        content: assistantContent, 
        threadId: currentThreadId,
        tokens: totalTokens
    }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error("ia-mentor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
