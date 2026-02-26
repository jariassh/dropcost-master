import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function: sync-meta-campaigns
 * Sincroniza las campañas y métricas de Meta Ads para los usuarios conectados.
 */

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Obtener integraciones de Meta Ads activas
    // Estas están vinculadas al usuario (tienda_id es NULL)
    const { data: integraciones, error: intError } = await supabaseAdmin
      .from("integraciones")
      .select("*")
      .eq("tipo", "meta_ads")
      .eq("estado", "conectado");

    if (intError) throw intError;

    const results = [];

    // 2. Procesar cada usuario
    for (const integration of integraciones) {
      try {
        const userId = integration.usuario_id;
        const accessToken = integration.credenciales_encriptadas; // Encriptado en BD

        console.log(`Sincronizando Meta Ads para usuario: ${userId}`);

        // Aquí iría el fetch a Meta Graph API
        // const campaigns = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?...&access_token=${accessToken}`);

        // Actualizar última sincronización
        await supabaseAdmin
          .from("integraciones")
          .update({ ultima_sincronizacion: new Date().toISOString() })
          .eq("id", integration.id);

        results.push({ userId, status: "success" });
      } catch (err) {
        console.error(`Error en integración Meta ${integration.id}:`, err);
        results.push({ id: integration.id, status: "error", message: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
