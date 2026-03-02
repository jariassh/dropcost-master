import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../../utils/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS Handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  try {
    if (!token) {
        throw new Error('Authorization header is missing');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Create client explicitly to verify user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("[EdgeFunction] User verification failed:", authError?.message);
      throw new Error(`Unauthorized (User verification failure): ${authError?.message || 'Invalid session'}`);
    }

    // Body parsing
    const bodyText = await req.text();
    if (!bodyText) {
       throw new Error("Missing request body (code/redirect_uri)");
    }
    
    const { code, redirect_uri } = JSON.parse(bodyText);
    if (!code || !redirect_uri) {
      throw new Error('Code and redirect_uri are required parameters');
    }

    // Call Meta to exchange code for token
    const metaAppId = Deno.env.get('META_APP_ID');
    const metaAppSecret = Deno.env.get('META_APP_SECRET');
    
    if (!metaAppId || !metaAppSecret) {
        throw new Error('Meta App configuration missing in Edge Function secrets');
    }
    
    const encodedRedirectUri = encodeURIComponent(redirect_uri);
    const metaUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodedRedirectUri}&client_secret=${metaAppSecret}&code=${code}`;

    const tokenResponse = await fetch(metaUrl);
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      const fbErr = tokenData.error;
      throw new Error(`Meta API Error: ${fbErr.message || 'Verification failed'} (${fbErr.type || 'unknown'})`);
    }

    // Profile metadata
    const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=name&access_token=${tokenData.access_token}`);
    const userData = await userResponse.json();
    const metaUserName = userData.name || 'Usuario Meta';

    // Encryption
    const encryptedToken = await encryptToken(tokenData.access_token);

    // Database operation
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError } = await supabaseAdmin
        .from('integraciones')
        .upsert({
            usuario_id: user.id,
            tipo: 'meta_ads',
            estado: 'conectado',
            credenciales_encriptadas: encryptedToken,
            meta_user_name: metaUserName,
            ultima_sincronizacion: new Date().toISOString()
        }, { onConflict: 'usuario_id, tipo' });

    if (dbError) throw new Error(`Database Error: ${dbError.message}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Meta Ads successfully connected", 
      meta_user_name: metaUserName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("[EdgeFunction] Fatal Error:", err.message);
    
    // Devolvemos más contexto en el error para ayudar a la depuración en el frontend
    return new Response(JSON.stringify({ 
        error: err.message || 'Unknown server error',
        debug: {
            authPresent: !!authHeader,
            authStart: authHeader?.substring(0, 15) + "...",
            timestamp: new Date().toISOString()
        }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
