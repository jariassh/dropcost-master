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
        today: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0, aov_promedio: 0, cvr_promedio: 0 },
        week: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0, aov_promedio: 0, cvr_promedio: 0 },
        month: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0, aov_promedio: 0, cvr_promedio: 0 },
        history: [],
        topCampaigns: [],
        recentOrders: [],
        costeoAnalytics: []
    };

    if (!tienda_id) return result;

    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const { data: proData, error: proError } = await (supabase.rpc as any)('get_dashboard_pro_data', {
            p_tienda_id: tienda_id,
            p_dias: 90,
            p_timezone: timezone
        });

        if (!proError && proData) {
            const { kpis, charts } = proData as any;

            // History Chart
            if (charts?.ventas_diarias) {
                result.history = charts.ventas_diarias.map((d: any) => ({
                    fecha: d.fecha,
                    ventas: Number(d.ventas) || 0,
                    ganancia: 0, // In this simplified phase, we might calculate profit roughly or wait for costeo integration
                    gastos: 0    // Gasto is global in costings, not daily in this version
                }));
            }

            // Central KPIs (Mapping the 30-day result to 'month')
            result.month = {
                ganancia: Number(kpis.ganancia_total) || 0,
                ventas: Number(kpis.ventas_totales) || 0,
                gastos: Number(kpis.gastos_totales) || 0,
                ordenes_efectivas: Number(kpis.ordenes_count) || 0,
                cpa_promedio: Number(kpis.gastos_totales) / (Number(kpis.ordenes_count) || 1),
                roas_promedio: Number(kpis.roas_promedio) || 0,
                aov_promedio: Number(kpis.aov_promedio) || 0,
                cvr_promedio: Number(kpis.cvr_promedio) || 0
            };

            // For simplification in this phase, we reuse month data for week/today or calculate from charts
            // Ideally we would have specific RPCs or filters, but let's follow the simplified "Master" scope.
            result.week = { ...result.month }; 
            result.today = { ...result.month };
        }

        // 2. Fetch Recent Orders from the NEW public.orders table
        const { data: ordersData } = await (supabase
            .from('orders' as any) as any)
            .select('*')
            .eq('tienda_id', tienda_id)
            .order('fecha_orden', { ascending: false })
            .limit(5);

        if (ordersData) {
            result.recentOrders = (ordersData as any[]).map((o: any) => ({
                id: o.id,
                order_number: o.order_number,
                date: o.fecha_orden,
                status: (o.estado_pago?.toLowerCase() || 'pending') as any,
                fulfillment: (o.estado_logistica?.toLowerCase() || 'pending') as any,
                total: Number(o.total_orden) || 0,
                campaign_name: 'Atribución Directa'
            }));
        }

        // 3. Fetch Top Campaigns from public.costeos (1:1 Meta mapping)
        const { data: costeosData } = await supabase
            .from('costeos')
            .select('id, nombre_producto, meta_spend, meta_roas, meta_aov, meta_cvr')
            .eq('tienda_id', tienda_id)
            .neq('meta_spend', 0)
            .order('meta_spend', { ascending: false })
            .limit(3);

        if (costeosData) {
            result.topCampaigns = costeosData.map((c: any) => ({
                campaign_id: c.id,
                name: c.nombre_producto,
                spend: Number(c.meta_spend) || 0,
                conversions: 0, 
                cpa: Number(c.meta_aov) || 0,
                status: 'ACTIVE'
            }));
        }

        // 4. Fetch FULL Costeo Analytics for the new table
        const { data: fullCosteos } = await supabase
            .from('costeos')
            .select('id, nombre_producto, precio_final, cpa, costo_flete, meta_spend, meta_roas, meta_aov, meta_cvr')
            .eq('tienda_id', tienda_id)
            .order('created_at', { ascending: false });

        if (fullCosteos) {
            result.costeoAnalytics = (fullCosteos as any[]).map(c => {
                const realSpend = Number(c.meta_spend) || 0;
                const realRoas = Number(c.meta_roas) || 0;
                const realAov = Number(c.meta_aov) || 0;
                const realSales = realSpend * realRoas;
                const realOrders = realAov > 0 ? Math.floor(realSales / realAov) : 0;
                const realCpa = realOrders > 0 ? realSpend / realOrders : 0;

                return {
                    id: c.id,
                    nombre_producto: c.nombre_producto,
                    target_price: Number(c.precio_final) || 0,
                    target_cpa: Number(c.cpa) || 0,
                    target_flete: Number(c.costo_flete) || 0,
                    real_cpa: realCpa,
                    real_orders: realOrders,
                    real_spend: realSpend,
                    real_roas: realRoas
                };
            });
        }

    } catch (e) {
        console.error("Error al obtener metrics de DDBB:", e);
    }

    return result;
};

