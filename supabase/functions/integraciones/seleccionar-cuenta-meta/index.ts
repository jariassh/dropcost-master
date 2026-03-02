import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is missing');

    const body = await req.json();
    const { 
        tienda_id, 
        meta_business_id, 
        meta_ad_account_id, 
        meta_ad_account_name 
    } = body;

    if (!tienda_id || !meta_ad_account_id || !meta_ad_account_name) {
        throw new Error('tienda_id, meta_ad_account_id and meta_ad_account_name are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create client to verify user
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Unauthorized');

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 2. Save the relation in tiendas_meta_ads
    const { error: insertError } = await supabaseAdmin
        .from('tiendas_meta_ads' as any)
        .upsert({
            tienda_id,
            meta_ad_account_id,
            meta_ad_account_name,
            is_active: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'tienda_id, meta_ad_account_id' });

    if (insertError) {
        console.error("Database Insert Error:", insertError);
        throw new Error(`Database Error: ${insertError.message}`);
    }

    // 3. Update main integration state (just to keep synced metadata if needed)
    await supabaseAdmin
        .from('integraciones')
        .update({
            estado: 'conectado',
            ultima_sincronizacion: new Date().toISOString()
        })
        .eq('usuario_id', user.id)
        .eq('tipo', 'meta_ads');

    return new Response(JSON.stringify({ 
        success: true, 
        message: "Meta Ad account successfully selected and saved" 
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("Select Meta Account Error:", err.message);
    return new Response(JSON.stringify({ 
        error: err.message || 'Unknown error',
        timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
