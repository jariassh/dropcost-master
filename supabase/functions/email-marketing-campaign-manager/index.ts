import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: email-marketing-campaign-manager
 * Maneja el CRUD y el lanzamiento de campañas de email marketing.
 */

serve(async (req: Request) => {
  // Manejo de CORS
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

    const userId = user.id;

    if (req.method === "POST") {
      const body = await req.json();
      const { action, campaignId, name, subject, templateId, segmentId, tiendaId, es_prueba } = body;

      // Acción: Crear Campaña
      if (action === "create") {
        const { data, error } = await supabaseClient
          .from("email_campaigns")
          .insert({
            tienda_id: tiendaId,
            usuario_id: userId,
            name,
            subject,
            template_id: templateId,
            segment_id: segmentId,
            status: "draft",
            created_by: userId
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 201
        });
      }

      // Acción: Lanzar Campaña
      if (action === "launch") {
        if (!campaignId) throw new Error("ID de campaña requerido");

        // 1. Obtener detalles de la campaña y sus filtros
        const { data: campaign, error: campError } = await supabaseClient
          .from("email_campaigns")
          .select("*, email_segments(filters)")
          .eq("id", campaignId)
          .single();

        if (campError || !campaign) throw new Error("Campaña no encontrada");

        // Si es prueba, enviar solo al admin (usuario actual)
        if (es_prueba) {
          const { error: logError } = await supabaseClient
            .from("email_campaign_logs")
            .insert({
              campaign_id: campaignId,
              tienda_id: campaign.tienda_id,
              user_id: userId,
              email: user.email,
              status: "pending"
            });
          
          if (logError) throw logError;

          return new Response(JSON.stringify({ message: "Envío de prueba programado" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // 2. Obtener audiencia según filtros (Lógica simplificada para esta fase)
        // Usamos el Service Role para pasar por encima de RLS si es necesario para listar usuarios de la tienda
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch users (AQUÍ IRÍA LA LÓGICA DE FILTROS REAL DEL SEGMENT-BUILDER)
        // Por ahora, traemos todos los usuarios (demo)
        const { data: users, error: usersError } = await supabaseAdmin
          .from("users")
          .select("id, email");

        if (usersError) throw usersError;

        // 3. Poblar email_campaign_logs
        const logs = users.map(u => ({
          campaign_id: campaignId,
          tienda_id: campaign.tienda_id,
          user_id: u.id,
          email: u.email,
          status: "pending"
        }));

        const { error: insertError } = await supabaseAdmin
          .from("email_campaign_logs")
          .insert(logs);

        if (insertError) throw insertError;

        // 4. Marcar campaña como processing
        await supabaseClient
          .from("email_campaigns")
          .update({ status: "processing" })
          .eq("id", campaignId);

        return new Response(JSON.stringify({ message: "Campaña lanzada", count: logs.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (req.method === "GET") {
      const { data, error } = await supabaseClient
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Acción no válida", { status: 400 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
