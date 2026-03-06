import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: email-marketing-process-queue
 * Procesa la cola de envíos unitarios con un delay de 10 segundos.
 * Diseñado para ser ejecutado por un cron job o invocado manualmente.
 */

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    // 1. Obtener los próximos 5 correos pendientes para procesar en esta ejecución
    // Limitamos a 5 para no exceder el timeout de la Edge Function (60s)
    const { data: queue, error: queueError } = await supabaseAdmin
      .from("email_campaign_logs")
      .select("*, email_campaigns(subject, template_id, email_templates(html_content, component_name))")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(5);

    if (queueError) throw queueError;
    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ message: "Cola vacía" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];

    for (let i = 0; i < queue.length; i++) {
      const entry = queue[i];
      const { campaign_id, email, email_campaigns: campaign } = entry;
      const template = campaign.email_templates;

      try {
        console.log(`[Queue] procesando envío para ${email} de la campaña ${campaign_id}`);

        // 2. Enviar via Resend
        const { data: resendData, error: resendError } = await resend.emails.send({
          from: "DropCost Marketing <marketing@dropcostmaster.com>",
          to: [email],
          subject: campaign.subject,
          html: template.html_content,
        });

        if (resendError) throw resendError;

        // 3. Actualizar log
        await supabaseAdmin
          .from("email_campaign_logs")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", entry.id);

        results.push({ email, status: "sent" });

      } catch (err: any) {
        console.error(`Error enviando a ${email}:`, err);
        await supabaseAdmin
          .from("email_campaign_logs")
          .update({ status: "failed", error_message: err.message })
          .eq("id", entry.id);
        
        results.push({ email, status: "failed", error: err.message });
      }

      // 4. Esperar 10 segundos si no es el último de este lote
      if (i < queue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // 5. Verificar si la campaña terminó para marcarla como completed
    const activeCampaignIds = [...new Set(queue.map(q => q.campaign_id))];
    for (const cid of activeCampaignIds) {
      const { count } = await supabaseAdmin
        .from("email_campaign_logs")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", cid)
        .eq("status", "pending");

      if (count === 0) {
        await supabaseAdmin
          .from("email_campaigns")
          .update({ status: "completed" })
          .eq("id", cid);
      }
    }

    return new Response(JSON.stringify({ results }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
