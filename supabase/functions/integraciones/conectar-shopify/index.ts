import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { encryptToken } from "../../utils/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    if (!bodyText) {
       throw new Error("Missing request body");
    }
    const { code, shop_domain, tienda_id } = JSON.parse(bodyText);
    
    if (!code || !shop_domain || !tienda_id) {
      throw new Error('Code, shop_domain, and tienda_id are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const shopifyClientId = Deno.env.get('SHOPIFY_CLIENT_ID');
    const shopifyClientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');
    
    if (!shopifyClientId || !shopifyClientSecret) {
        throw new Error('Shopify Configuration missing in Edge Function env vars');
    }

    const tokenResponse = await fetch(`https://${shop_domain}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: shopifyClientId,
            client_secret: shopifyClientSecret,
            code: code
        })
    });
    
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error_description || 'Error exchanging token with Shopify');
    }

    const encryptedToken = await encryptToken(tokenData.access_token);

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');

    const { data: existingIntegration } = await supabaseAdmin
        .from('integraciones')
        .select('id')
        .eq('tienda_id', tienda_id)
        .eq('tipo', 'shopify')
        .maybeSingle();

    let dbError;
    if (existingIntegration) {
        const { error } = await supabaseAdmin
            .from('integraciones')
            .update({
                credenciales_encriptadas: encryptedToken,
                config_sync: { shop_domain: shop_domain, scope: tokenData.scope },
                estado: 'conectado',
                ultima_sincronizacion: new Date().toISOString()
            })
            .eq('id', existingIntegration.id);
        dbError = error;
    } else {
        const { error } = await supabaseAdmin
            .from('integraciones')
            .insert({
                tienda_id: tienda_id,
                tipo: 'shopify',
                estado: 'conectado',
                config_sync: { shop_domain: shop_domain, scope: tokenData.scope },
                credenciales_encriptadas: encryptedToken,
                ultima_sincronizacion: new Date().toISOString()
            });
        dbError = error;
    }

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, message: "Shopify successfully connected" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error("Shopify Connection Error:", err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
