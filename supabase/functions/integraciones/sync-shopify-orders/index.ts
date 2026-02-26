import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function: sync-shopify-orders
 * Sincroniza las órdenes de Shopify para las tiendas conectadas.
 */

serve(async (req) => {
  // Solo permitir POST (para cron jobs o triggers manuales)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Obtener integraciones de Shopify activas
    const { data: integraciones, error: intError } = await supabaseAdmin
      .from("integraciones")
      .select(`
        id,
        tienda_id,
        credenciales_encriptadas,
        config_sync,
        ultima_sincronizacion,
        tiendas (
          id,
          nombre,
          usuario_id
        )
      `)
      .eq("tipo", "shopify")
      .eq("estado", "conectado");

    if (intError) throw intError;

    const results = [];

    // 2. Procesar cada integración
    for (const integration of integraciones) {
      try {
        // En una implementación real, aquí se desencriptaría el token
        // y se llamaría a la API de Shopify.
        // Simulamos la obtención de datos para esta fase.
        
        const tiendaId = integration.tienda_id;
        const shopUrl = integration.config_sync?.shop_url;
        const accessToken = integration.credenciales_encriptadas; // Asumimos desencriptado para el ejemplo

        if (!shopUrl || !accessToken) {
          results.push({ tiendaId, status: "error", message: "Faltan credenciales o URL" });
          continue;
        }

        // Llamada a Shopify (Simulada o real si tuviéramos las llaves)
        // const response = await fetch(`https://${shopUrl}/admin/api/2024-01/orders.json?...`);
        
        console.log(`Sincronizando Shopify para tienda: ${integration.tiendas?.nombre}`);

        // Actualizar última sincronización
        await supabaseAdmin
          .from("integraciones")
          .update({ ultima_sincronizacion: new Date().toISOString() })
          .eq("id", integration.id);

        results.push({ tiendaId, status: "success" });
      } catch (err) {
        console.error(`Error en tienda ${integration.tienda_id}:`, err);
        results.push({ tiendaId, status: "error", message: err.message });
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
