import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../../utils/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Helper: Obtiene tasas de cambio desde USD
 */
async function getExchangeRates() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    return data.rates || { USD: 1, COP: 4000 };
  } catch (e) {
    console.error("Error fetching exchange rates:", e);
    return { USD: 1, COP: 4000 };
  }
}

/**
 * Helper: Convierte montos entre divisas
 */
function convertCurrency(amount: number, from: string, to: string, rates: any) {
  if (from === to) return amount;
  // Convert from -> USD
  const inUSD = from === "USD" ? amount : amount / (rates[from] || 1);
  // Convert USD -> to
  return inUSD * (rates[to] || 1);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Obtener todos los costeos que tienen vinculada una campaña de Meta
    const { data: costeos, error: costError } = await supabaseAdmin
      .from("costeos")
      .select(`
        id, 
        usuario_id, 
        meta_campaign_id,
        tiendas (id, moneda)
      `)
      .not("meta_campaign_id", "is", null);

    if (costError) throw costError;
    if (!costeos || costeos.length === 0) {
      return new Response(JSON.stringify({ message: "No costeos with meta_campaign_id found" }), { status: 200 });
    }

    // 2. Obtener integraciones de Meta Ads activas
    const { data: integraciones, error: intError } = await supabaseAdmin
      .from("integraciones")
      .select("*")
      .eq("tipo", "meta_ads")
      .eq("estado", "conectado");

    if (intError) throw intError;

    const rates = await getExchangeRates();
    const results = [];

    // 3. Procesar por cada integración (Usuario)
    for (const integration of (integraciones || [])) {
      try {
        const accessToken = await decryptToken(integration.credenciales_encriptadas);
        const userCosteos = costeos.filter(c => c.usuario_id === integration.usuario_id);

        for (const costeo of userCosteos) {
          const campaignId = costeo.meta_campaign_id;
          const storeCurrency = (costeo.tiendas as any)?.moneda || "COP";

          // A. Fetch Insights for the campaign (last 30 days)
          const insightsRes = await fetch(
            `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=campaign_name,account_id,spend,cpa,conversions,actions,cpm,objective,cpp,roas&date_preset=last_30d&access_token=${accessToken}`
          );
          const insightsData = await insightsRes.json();

          if (insightsData.error) {
            console.error(`Meta API Error for campaign ${campaignId}:`, insightsData.error);
            continue;
          }

          const insight = insightsData.data?.[0];
          if (!insight) {
            console.warn(`No insights found for campaign ${campaignId}`);
            continue;
          }

          // B. Get Ad Account Currency
          const accountId = insight.account_id;
          const accountRes = await fetch(
            `https://graph.facebook.com/v19.0/act_${accountId}?fields=currency&access_token=${accessToken}`
          );
          const accountData = await accountRes.json();
          const metaCurrency = accountData.currency || "USD";

          // C. Extract Metrics
          // Meta CPA: Buscamos el coste por acción de compra o resultado según objetivo
          // Simplificamos: buscamos 'purchase' en actions o usamos 'cost_per_action_type' si disponible
          const actions = insight.actions || [];
          const purchaseAction = actions.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase');
          const comprasCount = purchaseAction ? parseInt(purchaseAction.value) : 0;

          // CPA Reportado por Meta (en moneda de la cuenta)
          // Si no viene directo, lo calculamos: spend / compras
          let cpaMeta = insight.cpp || (comprasCount > 0 ? parseFloat(insight.spend) / comprasCount : 0);
          
          // ROAS
          const roas = insight.roas ? parseFloat(insight.roas[0]?.value) : 0;
          
          // D. Normalización a moneda de la tienda
          const cpaNormalizado = convertCurrency(cpaMeta, metaCurrency, storeCurrency, rates);
          const gastoNormalizado = convertCurrency(parseFloat(insight.spend), metaCurrency, storeCurrency, rates);

          // E. Upsert a meta_product_stats
          const { error: upsertError } = await supabaseAdmin
            .from("meta_product_stats")
            .upsert({
              costeo_id: costeo.id,
              meta_campaign_id: campaignId,
              currency_original: metaCurrency,
              cpa_normalizado: Math.round(cpaNormalizado * 100) / 100,
              importe_gastado_normalizado: Math.round(gastoNormalizado * 100) / 100,
              roas: roas,
              compras: comprasCount,
              cpm: parseFloat(insight.cpm || "0"),
              campaign_status: insight.objective || 'ACTIVE', // Simplificación, ideally get status from campaign endpoint
            }, { onConflict: 'costeo_id, meta_campaign_id' });

          if (upsertError) {
            console.error(`Error saving stats for costeo ${costeo.id}:`, upsertError);
          } else {
            results.push({ costeo_id: costeo.id, status: "synced" });
          }
        }
        
        // Update integration sync date
        await supabaseAdmin
          .from("integraciones")
          .update({ ultima_sincronizacion: new Date().toISOString() })
          .eq("id", integration.id);

      } catch (err) {
        console.error(`Error processing integration ${integration.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Meta Sync Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

