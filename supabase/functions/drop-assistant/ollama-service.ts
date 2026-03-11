
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OLLAMA_API_URL = Deno.env.get("OLLAMA_API_URL");
const OLLAMA_API_KEY = Deno.env.get("OLLAMA_API_KEY");
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") || "mistral:7b";

interface UsageLog {
  usuario_id?: string;
  operacion: string;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  duracion_ms: number;
  status: string;
  error_message?: string;
}

/**
 * Registra el uso de Ollama en la base de datos
 */
async function logUsage(supabase: any, log: UsageLog) {
  try {
    await supabase.from('ollama_usage_log').insert(log);
  } catch (e) {
    console.error("Error logging Ollama usage:", e);
  }
}

/**
 * Resume una conversación completa usando Ollama Cloud
 */
export async function summarizeThread(
  supabase: any,
  messages: { role: string; content: string }[],
  userId?: string
) {
  const startTime = Date.now();
  
  try {
    const historyText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    
    const systemPrompt = `Eres un asistente de resumación para DropCost Master.
Identifica puntos clave, decisiones y datos financieros (CPA, Márgenes).
Resumen máximo 300 tokens. Idioma: Español.`;

    const response = await fetch(`${OLLAMA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resume esto:\n${historyText}` }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) throw new Error(data.error?.message || "Error en Ollama API");

    const summary = data.choices[0].message.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    await logUsage(supabase, {
      usuario_id: userId,
      operacion: 'summarization',
      tokens_input: usage.prompt_tokens,
      tokens_output: usage.completion_tokens,
      tokens_total: usage.prompt_tokens + usage.completion_tokens,
      duracion_ms: duration,
      status: 'success'
    });

    return summary;

  } catch (error) {
    await logUsage(supabase, {
      usuario_id: userId,
      operacion: 'summarization',
      tokens_input: 0,
      tokens_output: 0,
      tokens_total: 0,
      duracion_ms: Date.now() - startTime,
      status: 'error',
      error_message: error.message
    });
    return null;
  }
}

/**
 * Busca casos de éxito anónimos combinando nicho, país y tipo de consulta
 */
export async function getCollectiveInsights(
  supabase: any,
  niche: string,
  pais: string,
  tipo: string
) {
  const { data } = await supabase
    .from('anonymous_learnings')
    .select('resumen_exito, recomendaciones_ia, cpa_promedio, margen_promedio')
    .eq('niche', niche)
    .eq('pais', pais)
    .eq('tipo_consulta', tipo)
    .order('metricas_score', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
