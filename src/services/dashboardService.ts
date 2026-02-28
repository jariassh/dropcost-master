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
        today: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0, aov_promedio: 0, cvr_promedio: 0, gastos_meta: 0 },
        week: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0, aov_promedio: 0, cvr_promedio: 0, gastos_meta: 0 },
        month: { ganancia: 0, ventas: 0, gastos: 0, ordenes_efectivas: 0, cpa_promedio: 0, roas_promedio: 0, aov_promedio: 0, cvr_promedio: 0, gastos_meta: 0 },
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

            // History Chart - Ahora con gastos reales (logística + meta)
            if (charts?.tendencia) {
                result.history = charts.tendencia.map((d: any) => ({
                    fecha: d.fecha,
                    ventas: Number(d.ventas) || 0,
                    gasto_logistica: Number(d.gasto_logistica) || 0,
                    gasto_meta: Number(d.gasto_meta) || 0,
                    ganancia: (Number(d.ventas) || 0) - ((Number(d.gasto_logistica) || 0) + (Number(d.gasto_meta) || 0))
                }));
            }

            // Central KPIs
            const metricsData = {
                ganancia: Number(kpis.ganancia_total) || 0,
                ventas: Number(kpis.ventas_totales) || 0,
                gastos: Number(kpis.gastos_totales) || 0,
                gastos_meta: Number(kpis.gastos_meta) || 0,
                ordenes_efectivas: Number(kpis.ordenes_count) || 0,
                cpa_promedio: Number(kpis.cpa_promedio) || 0,
                roas_promedio: Number(kpis.roas_promedio) || 0,
                aov_promedio: Number(kpis.aov_promedio) || 0,
                cvr_promedio: Number(kpis.cvr_promedio) || 0
            };

            result.month = metricsData;
            result.week = { ...metricsData }; 
            result.today = { ...metricsData };
        }

        // 2. Fetch Recent Orders
        const { data: ordersData } = await (supabase
            .from('orders' as any) as any)
            .select('*')
            .eq('tienda_id', tienda_id)
            .order('fecha_orden', { ascending: false })
            .limit(5);

        if (ordersData) {
            result.recentOrders = (ordersData as any[]).map((o: any) => {
                // Si el pago es pending pero logistica tiene algo, priorizar visualmente o combinar
                const status = (o.estado_logistica || o.estado_pago || 'pending').toLowerCase();
                
                return {
                    id: o.id,
                    order_number: o.order_number,
                    date: o.fecha_orden,
                    status: status as any,
                    fulfillment: (o.estado_logistica?.toLowerCase() || 'pending') as any,
                    total: Number(o.total_orden) || 0,
                    campaign_name: o.utm_source || 'Directo',
                    notas: o.notas,
                    customer_details: o.customer_details,
                    cliente_nombre: o.cliente_nombre,
                    cliente_telefono: o.cliente_telefono,
                    cliente_ciudad: o.cliente_ciudad,
                    cliente_departamento: o.cliente_departamento,
                    cliente_direccion: o.cliente_direccion,
                    cliente_email: o.cliente_email
                };
            });
        }

        // 3. Fetch Top Campaigns (limit 10)
        const { data: costeosData } = await (supabase
            .from('costeos' as any) as any)
            .select('id, nombre_producto, meta_spend, meta_roas, meta_aov, meta_cvr')
            .eq('tienda_id', tienda_id)
            .order('meta_spend', { ascending: false })
            .limit(10);

        if (costeosData) {
            result.topCampaigns = costeosData.map((c: any) => ({
                campaign_id: c.id,
                name: c.nombre_producto,
                spend: Number(c.meta_spend) || 0,
                conversions: 0, 
                cpa: 0, // Se llenará con datos reales cuando conectemos Meta
                status: Number(c.meta_spend) > 0 ? 'ACTIVE' : 'PAUSED'
            }));
        }

        // 4. Fetch FULL Costeo Analytics with REAL order count
        // Primero traemos los costeos
        const { data: fullCosteos } = await (supabase
            .from('costeos' as any) as any)
            .select('id, nombre_producto, meta_campaign_id, precio_final, cpa, costo_flete, meta_spend, meta_roas, meta_aov, meta_cvr')
            .eq('tienda_id', tienda_id)
            .order('created_at', { ascending: false });

        if (fullCosteos) {
            // Luego traemos el conteo real de órdenes agrupadas por costeo
            const { data: ordersWithCosteo } = await (supabase
                .from('orders' as any) as any)
                .select('costeo_id')
                .in('costeo_id', fullCosteos.map((c: any) => c.id))
                .not('costeo_id', 'is', null);

            const countsMap: Record<string, number> = {};
            if (ordersWithCosteo) {
                (ordersWithCosteo as any[]).forEach(o => {
                    countsMap[o.costeo_id] = (countsMap[o.costeo_id] || 0) + 1;
                });
            }

            result.costeoAnalytics = (fullCosteos as any[]).map(c => {
                const realSpend = Number(c.meta_spend) || 0;
                const realOrders = countsMap[c.id] || 0;
                const realCpa = realOrders > 0 ? (realSpend / realOrders) : 0;
                
                const targetPrice = Number(c.precio_final) || 0;
                const estimatedSales = targetPrice * realOrders;
                const realRoas = realSpend > 0 ? (estimatedSales / realSpend) : 0;

                return {
                    id: c.id,
                    nombre_producto: c.nombre_producto,
                    meta_campaign_id: c.meta_campaign_id,
                    target_price: targetPrice,
                    target_cpa: Number(c.cpa) || 0,
                    target_flete: Number(c.costo_flete) || 0,
                    real_cpa: Number(realCpa.toFixed(2)),
                    real_orders: realOrders,
                    real_spend: Number(realSpend.toFixed(2)),
                    real_roas: Number(realRoas.toFixed(2))
                };
            });
        }

    } catch (e) {
        console.error("Error al obtener metrics de DDBB:", e);
    }

    return result;
};

