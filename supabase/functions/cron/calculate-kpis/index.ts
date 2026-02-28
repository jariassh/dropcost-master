import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        // Calculate for the last 7 days to cover delayed data
        const priorDate = new Date();
        priorDate.setDate(priorDate.getDate() - 7);
        const startDate = priorDate.toISOString().split('T')[0];

        // 1. Trigger Meta Ads Sync
        try {
            console.log("Triggering Meta Ads Sync...");
            const syncRes = await fetch(`${supabaseUrl}/functions/v1/sync-meta-campaigns`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${supabaseServiceKey}` }
            });
            const syncData = await syncRes.json();
            console.log("Meta Sync Result:", JSON.stringify(syncData));
        } catch (e) {
            console.error("Failed to trigger Meta Sync, proceeding with KPI calculation:", e);
        }

        // 2. Fetch all active tiendas
        const { data: tiendas, error: tiendasError } = await supabase
            .from('tiendas')
            .select('id, configuracion')
            .eq('active', true);

        if (tiendasError) throw tiendasError;

        for (const tienda of (tiendas || [])) {
            // Call the RPC calculate_kpis for each store
            const { data: kpis, error: rpcError } = await supabase.rpc('calculate_kpis', {
                p_tienda_id: tienda.id,
                p_start_date: startDate,
                p_end_date: endDate
            });

            if (rpcError) {
                console.error(`Error calculating KPIs for tienda ${tienda.id}:`, rpcError);
                continue;
            }

            if (!kpis || kpis.length === 0) continue;

            const metricsToUpsert = kpis.map((kpi: any) => ({
                tienda_id: tienda.id,
                fecha: kpi.fecha,
                ventas_count: kpi.ventas_count,
                ingresos_totales: kpi.ingresos_totales,
                gasto_publicidad: kpi.gasto_publicidad,
                cpa_promedio: kpi.cpa_promedio,
                roas_real: kpi.roas_real,
                margen_real: kpi.margen_real,
                last_calculation: new Date().toISOString()
            }));

            const { error: upsertError } = await supabase
                .from('dashboard_metrics')
                .upsert(metricsToUpsert, { onConflict: 'tienda_id, fecha' });

            if (upsertError) {
                console.error(`Error upserting KPIs for tienda ${tienda.id}:`, upsertError);
            }
        }

        return new Response(JSON.stringify({ success: true, processed: tiendas?.length || 0 }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (err: any) {
        console.error("Calculate KPIs Cron Error:", err);
        return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
