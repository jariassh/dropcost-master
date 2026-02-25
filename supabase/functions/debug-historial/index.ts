import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: historial, error } = await adminClient
      .from('email_historial')
      .select('id, usuario_email, asunto_enviado, estado, razon_error, tipo_envio, fecha_envio')
      .order('fecha_envio', { ascending: false })
      .limit(10)

    console.log(`[debug-historial] Historial encontrado:`, historial?.length);
    historial?.forEach(h => {
        console.log(`[${h.fecha_envio}] To: ${h.usuario_email} | Subject: ${h.asunto_enviado} | Status: ${h.estado}`);
    });

    return new Response(JSON.stringify({ historial, error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
