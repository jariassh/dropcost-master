import { DashboardMetrics, DashboardFilters, PeriodMetrics } from '@/types/dashboard';
import { supabase } from '@/lib/supabase';

// Helper for dates
const getDatesInfo = () => {
    const todayObj = new Date();
    const today = todayObj.toISOString().split('T')[0];

    const weekStartObj = new Date(todayObj);
    weekStartObj.setDate(todayObj.getDate() - 7);
    const weekStart = weekStartObj.toISOString().split('T')[0];

    const monthStartObj = new Date(todayObj);
    monthStartObj.setDate(todayObj.getDate() - 30);
    const monthStart = monthStartObj.toISOString().split('T')[0];

    return { today, weekStart, monthStart };
};

export const getDashboardMetrics = async (filters: DashboardFilters): Promise<DashboardMetrics> => {
    const { tienda_id } = filters;
    const { today, weekStart, monthStart } = getDatesInfo();

    // Default structure
    const result: DashboardMetrics = {
        today: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0 },
        week: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0 },
        month: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0 },
        history: [],
        topCampaigns: [],
        recentOrders: []
    };

    if (!tienda_id) return result;

    try {
        // 1. Fetch History from RPC (last 30 days overall history for the chart + metrics)
        const { data: kpis, error: kpisError } = await supabase.rpc('calculate_kpis', {
            p_tienda_id: tienda_id,
            p_start_date: monthStart,
            p_end_date: today
        });

        if (!kpisError && kpis) {
            // Fill history chart data (reverse to show oldest to newest)
            const sortedKpis = [...kpis].reverse();
            for (const kpi of sortedKpis) {
                result.history.push({
                    fecha: kpi.fecha,
                    ganancia: Number(kpi.margen_real) || 0,
                    ventas: Number(kpi.ingresos_totales) || 0,
                    gastos: Number(kpi.gasto_publicidad) || 0
                });
            }

            // Fill aggregations (today, week, month)
            const aggregateMetrics = (rangeStart: string): PeriodMetrics => {
                const rangeData = kpis.filter((k: any) => k.fecha >= rangeStart && k.fecha <= today);
                const totales = rangeData.reduce((acc: any, curr: any) => ({
                    ganancia: acc.ganancia + (Number(curr.margen_real) || 0),
                    ventas: acc.ventas + (Number(curr.ingresos_totales) || 0),
                    gastos: acc.gastos + (Number(curr.gasto_publicidad) || 0),
                    ordenes: acc.ordenes + (Number(curr.ventas_count) || 0),
                }), { ganancia: 0, ventas: 0, gastos: 0, ordenes: 0 });

                return {
                    ganancia: totales.ganancia,
                    ventas: totales.ventas,
                    gastos: totales.gastos,
                    ordenes_efectivas: totales.ordenes,
                    cpa_promedio: totales.ordenes > 0 ? (totales.gastos / totales.ordenes) : 0,
                    roas_promedio: totales.gastos > 0 ? (totales.ventas / totales.gastos) : 0
                };
            };

            result.today = aggregateMetrics(today);
            result.week = aggregateMetrics(weekStart);
            result.month = aggregateMetrics(monthStart);
        }

        // 2. Fetch Recent Orders (last 5)
        const { data: ordersData } = await supabase
            .from('data_shopify_orders')
            .select('*')
            .eq('tienda_id', tienda_id)
            .order('shopify_created_at', { ascending: false })
            .limit(5);

        if (ordersData) {
            result.recentOrders = ordersData.map((o: any) => ({
                id: o.id,
                order_number: o.order_number || `#${o.shopify_order_id}`,
                date: o.shopify_created_at,
                status: o.financial_status || 'pending',
                fulfillment: o.fulfillment_status || 'pending',
                total: Number(o.total_price) || 0,
                campaign_name: 'Orgánico/Directo' // Needs attribution logic mapping
            }));
        }

        // 3. Fetch Top Campaigns (We assume the current user is fetched or we just limit to their connected meta ads)
        // Note: data_meta_ads uses usuario_id. We fetch it using an inner join through tiendas if needed,
        // but since RLS restricts by usuario_id anyway, we can just fetch campaigns that had spend in the last 7 days.
        const { data: ui } = await supabase.from('tiendas').select('usuario_id').eq('id', tienda_id).single();
        if (ui?.usuario_id) {
            const { data: metaData } = await supabase
                .from('data_meta_ads')
                .select('*')
                .eq('usuario_id', ui.usuario_id)
                .gte('fecha_sincronizacion', weekStart)
                .order('gasto_real', { ascending: false })
                .limit(5);

            if (metaData) {
                // Deduplicate by campaign_id since it might have daily entries and sum them
                const campaignsMap = new Map();
                for (const m of metaData) {
                    if (!campaignsMap.has(m.id_campana_meta)) {
                        campaignsMap.set(m.id_campana_meta, {
                           campaign_id: m.id_campana_meta,
                           name: m.nombre_campana || 'Desconocida',
                           spend: 0, conversions: 0,
                           status: m.estado_campana || 'ACTIVE'
                        });
                    }
                    const cmap = campaignsMap.get(m.id_campana_meta);
                    cmap.spend += Number(m.gasto_real || 0);
                    cmap.conversions += Number(m.conversiones || 0);
                }
                
                result.topCampaigns = Array.from(campaignsMap.values()).map((c: any) => ({
                    ...c,
                    cpa: c.conversions > 0 ? (c.spend / c.conversions) : 0,
                    status: c.status.toUpperCase()
                })).slice(0, 3); // top 3
            }
        }

    } catch (e) {
        console.error("Error al obtener metrics de DDBB:", e);
    }

    return result;
};
