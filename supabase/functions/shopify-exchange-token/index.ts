import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Edge Function: shopify-exchange-token
 * 
 * Función puramente 'stateless' (sin estado). 
 * Recibe las credenciales temporales del usuario, hace la petición a Shopify
 * para crear el Access Token y lo devuelve. No interactúa con Supabase DB.
 * Garantiza privacidad absoluta de los secretos del cliente.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const { shop, client_id, client_secret } = await req.json();

    if (!shop || !client_id || !client_secret) {
      return new Response(JSON.stringify({ error: "Faltan parámetros requeridos (shop, client_id, client_secret)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Asegurarnos de limpiar el shop
    const cleanShop = shop.replace('.myshopify.com', '').trim();
    const endpoint = `https://${cleanShop}.myshopify.com/admin/oauth/access_token`;

    // Preparar el payload form-urlencoded
    const formData = new URLSearchParams();
    formData.append('client_id', client_id);
    formData.append('client_secret', client_secret);
    formData.append('grant_type', 'client_credentials');

    // Realizar la petición a Shopify
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[exchange-token] Error desde Shopify:", data);
      return new Response(JSON.stringify({ 
        error: "Error de Shopify", 
        details: data.error_description || data.error || "Credenciales inválidas" 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Devolver el Access Token al frontend
    // Shopify responde con: { access_token: "shpat_...", scope: "..." }
    return new Response(JSON.stringify({
      success: true,
      access_token: data.access_token,
      scope: data.scope
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[exchange-token] Internal Error:", error);
    return new Response(JSON.stringify({ error: "Error interno", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
