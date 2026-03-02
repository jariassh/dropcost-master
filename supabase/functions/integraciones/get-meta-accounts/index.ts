import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://esm.sh/base64-arraybuffer@1.0.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const decryptToken = async (encryptedBase64: string): Promise<string> => {
    try {
        const secret = Deno.env.get("ENCRYPTION_KEY");
        if (!secret || secret.length < 32) {
            throw new Error("ENCRYPTION_KEY environment variable is missing or invalid");
        }
        
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret.substring(0, 32));
        const key = await crypto.subtle.importKey(
            "raw", keyData, { name: "AES-GCM" }, false, ["decrypt"]
        );

        const combinedBuffer = decode(encryptedBase64);
        const combined = new Uint8Array(combinedBuffer);
        const iv = combined.slice(0, 12);
        const encryptedArray = combined.slice(12);
        
        const decryptedBuff = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv }, key, encryptedArray
        );
        
        return new TextDecoder().decode(decryptedBuff);
    } catch (e) {
        console.error("Decryption failed:", e);
        throw new Error("Failed to decrypt access token");
    }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is missing');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized access');

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: integration, error: integrationError } = await supabaseAdmin
        .from('integraciones')
        .select('credenciales_encriptadas')
        .eq('usuario_id', user.id)
        .eq('tipo', 'meta_ads')
        .single();

    if (integrationError || !integration || !integration.credenciales_encriptadas) {
        throw new Error('Meta Ads integration not found. Please connect your profile first.');
    }

    const accessToken = await decryptToken(integration.credenciales_encriptadas);

    // Fetch Business Managers
    const bmResponse = await fetch(`https://graph.facebook.com/v19.0/me/businesses?fields=name,id&access_token=${accessToken}`);
    const bmData = await bmResponse.json();

    // Fetch ALL Ad Accounts at once
    // By default /me/adaccounts returns all accounts where the user has a role
    const adAccountUrl = `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,id,account_id,business&limit=500&access_token=${accessToken}`;
    const adAccountResponse = await fetch(adAccountUrl);
    const adAccountData = await adAccountResponse.json();

    if (adAccountData.error) {
        console.error("Meta API Error:", adAccountData.error);
        throw new Error(`Meta API Error: ${adAccountData.error.message}`);
    }

    return new Response(JSON.stringify({ 
        business_managers: bmData.data || [], 
        ad_accounts: adAccountData.data || [] 
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (err: any) {
    console.error("Fetch Meta Accounts Error:", err.message);
    return new Response(JSON.stringify({ 
        error: err.message || 'Unknown error',
        timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
