import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Edge Function: webhook-redirect
 * 
 * Acortador de enlaces para webhooks de Shopify.
 * Recibe tráfico desde la URL corta que el usuario configura en Shopify:
 *   POST https://dropcost.jariash.com/{shortId}
 * 
 * Flujo:
 *   1. Extrae el shortId de la URL
 *   2. Busca en la tabla tiendas cuál tiene ese webhook_short_id
 *   3. Reenvía el payload completo al Edge Function webhook-shopify con el store_id real
 * 
 * Esto evita exponer el project_id de Supabase y el tienda_id real al usuario.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Manejo de preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Solo aceptar POST (lo que envía Shopify)
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Extraer el shortId de la URL
    // La URL llega como: /functions/v1/webhook-redirect?short_id=7ulMx
    // o como path: /functions/v1/webhook-redirect/7ulMx
    const url = new URL(req.url);
    let shortId = url.searchParams.get("short_id");

    // También buscar en el pathname por si viene como path param
    if (!shortId) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      // El último segmento después de "webhook-redirect" es el shortId
      const redirectIndex = pathParts.indexOf("webhook-redirect");
      if (redirectIndex !== -1 && pathParts.length > redirectIndex + 1) {
        shortId = pathParts[redirectIndex + 1];
      }
    }

    if (!shortId) {
      return new Response(
        JSON.stringify({ error: "Missing short_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Inicializar Supabase con service role para buscar la tienda
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Buscar la tienda por webhook_short_id
    const { data: storeData, error: storeError } = await supabase
      .from("tiendas")
      .select("id")
      .eq("webhook_short_id", shortId)
      .maybeSingle();

    if (storeError || !storeData) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook identifier" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const storeId = storeData.id;

    // 4. Leer el body crudo para reenviarlo
    const rawBody = await req.text();

    // 5. Reenviar el payload al webhook-shopify real con el store_id
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-shopify?store_id=${storeId}`;

    const proxyResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Usar la service role key como Authorization para saltar el JWT check
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: rawBody,
    });

    // 6. Devolver la respuesta del webhook-shopify al llamante (Shopify)
    const responseBody = await proxyResponse.text();

    return new Response(responseBody, {
      status: proxyResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("[webhook-redirect] Error:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
