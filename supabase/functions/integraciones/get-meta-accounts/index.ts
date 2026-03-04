import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../../utils/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is missing');

    // Parse options
    let sync = false;
    let integrationId: string | null = null;
    try {
      const clonedReq = req.clone();
      const body = await clonedReq.json();
      sync = body.sync === true;
      integrationId = body.integrationId || null;
    } catch (e) {
      // Body might be empty or not JSON
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Validar el usuario con el token recibido
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
        console.error("[get-meta-accounts] Auth Error:", authError);
        return new Response(JSON.stringify({ error: 'Unauthorized access', details: authError?.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
        });
    }

    // 1. Buscamos la integración
    let query = supabaseAdmin
        .from('integraciones')
        .select('id, credenciales_encriptadas')
        .eq('usuario_id', user.id)
        .eq('tipo', 'meta_ads');

    if (integrationId) {
        query = query.eq('id', integrationId);
    }

    const { data: integrations, error: integrationError } = await query;

    if (integrationError || !integrations || integrations.length === 0) {
        return new Response(JSON.stringify({ error: 'Meta Ads integration not found. Please connect your profile first.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }

    // Usamos la integración seleccionada o la primera encontrada
    const integration = integrationId 
        ? integrations.find(i => i.id === integrationId) 
        : integrations[0];

    if (!integration) {
        throw new Error('Selected integration not found.');
    }

    // 2. Si no pedimos sync, intentamos traer de la base de datos (caché)
    if (!sync) {
        const { data: cachedAccounts, error: cacheError } = await supabaseAdmin
            .from('meta_ad_accounts')
            .select('*')
            .eq('integracion_id', integration.id);

        if (!cacheError && cachedAccounts && cachedAccounts.length > 0) {
            console.log(`[get-meta-accounts] Devolviendo ${cachedAccounts.length} cuentas desde caché.`);
            
            // Buscar la fecha más reciente de sincronización en este set
            const newestSync = cachedAccounts.reduce((max, acc) => 
                acc.last_synced_at > max ? acc.last_synced_at : max, 
                cachedAccounts[0].last_synced_at
            );

            return new Response(JSON.stringify({ 
                ad_accounts: cachedAccounts.map(a => ({
                    id: a.meta_id,
                    account_id: a.account_id,
                    name: a.name,
                    business: a.business_id ? { id: a.business_id, name: a.business_name } : null,
                    currency: a.currency
                })),
                from_cache: true,
                last_synced_at: newestSync
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }
    }

    // 3. Si pide sync o la caché está vacía, vamos a Meta
    console.log("[get-meta-accounts] Sincronizando con Meta API...");
    const accessToken = await decryptToken(integration.credenciales_encriptadas);

    const adAccountUrl = `https://graph.facebook.com/v19.0/me/adaccounts?fields=name,id,account_id,business,currency&limit=500&access_token=${accessToken}`;
    const adAccountResponse = await fetch(adAccountUrl);
    const adAccountData = await adAccountResponse.json();

    if (adAccountData.error) {
        console.error("[get-meta-accounts] Meta API Error:", adAccountData.error);
        throw new Error(`Meta API Error: ${adAccountData.error.message}`);
    }

    const accounts = adAccountData.data || [];
    
    // 4. Actualizamos la caché
    if (accounts.length > 0) {
        const upsertData = accounts.map((acc: any) => ({
            integracion_id: integration.id,
            usuario_id: user.id,
            meta_id: acc.id,
            account_id: acc.account_id,
            name: acc.name,
            business_id: acc.business?.id,
            business_name: acc.business?.name,
            currency: acc.currency,
            last_synced_at: new Date().toISOString()
        }));

        await supabaseAdmin.from('meta_ad_accounts').upsert(upsertData, { onConflict: 'integracion_id, meta_id' });
    }

    return new Response(JSON.stringify({ 
        ad_accounts: accounts,
        from_cache: false,
        last_synced_at: new Date().toISOString()
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });

  } catch (err: any) {
    console.error("[get-meta-accounts] Unexpected Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
