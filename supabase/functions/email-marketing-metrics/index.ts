import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: email-marketing-metrics
 * Retorna contadores de progreso para una campaña específica.
 */

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("No autorizado");

    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId) throw new Error("campaignId es requerido");

    // Consultar el estado de los logs
    const { data: logs, error: logsError } = await supabaseClient
      .from("email_campaign_logs")
      .select("status")
      .eq("campaign_id", campaignId);

    if (logsError) throw logsError;

    const metrics = {
      total: logs.length,
      sent: logs.filter(l => l.status === "sent").length,
      pending: logs.filter(l => l.status === "pending").length,
      failed: logs.filter(l => l.status === "failed").length
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
