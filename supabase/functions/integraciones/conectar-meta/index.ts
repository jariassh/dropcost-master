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
    const { code, redirect_uri } = JSON.parse(bodyText);
    
    if (!code || !redirect_uri) {
      throw new Error('Code and redirect_uri are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Create client to verify user
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Call Meta to exchange code for token
    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    
    if (!metaAppId || !metaAppSecret) {
        throw new Error('Meta App configuration missing in Edge Function env variables');
    }
    
    const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${redirect_uri}&client_secret=${metaAppSecret}&code=${code}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message || 'Error exchanging token with Meta');
    }

    // Encrypt the token using our new AES-256 utils/crypto.ts module
    const encryptedToken = await encryptToken(tokenData.access_token);

    // Save to integraciones table using service role (bypass RLS if needed, although user client might work, better to be safe or use user client for RLS check)
    // We update/insert based on usuario_id and tipo='meta_ads'
    // Since we don't have a unique constraint on (usuario_id, tipo) explicitly defined in schema, we have to find and update first
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');

    const { data: existingIntegration } = await supabaseAdmin
        .from('integraciones')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('tipo', 'meta_ads')
        .maybeSingle();

    let dbError;
    if (existingIntegration) {
        const { error } = await supabaseAdmin
            .from('integraciones')
            .update({
                credenciales_encriptadas: encryptedToken,
                estado: 'conectado',
                ultima_sincronizacion: new Date().toISOString()
            })
            .eq('id', existingIntegration.id);
        dbError = error;
    } else {
        const { error } = await supabaseAdmin
            .from('integraciones')
            .insert({
                usuario_id: user.id,
                tipo: 'meta_ads',
                estado: 'conectado',
                credenciales_encriptadas: encryptedToken,
                ultima_sincronizacion: new Date().toISOString()
            });
        dbError = error;
    }

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, message: "Meta Ads successfully connected" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error("Meta Connection Error:", err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
