/**
 * Servicio para el Dashboard Operacional.
 * Maneja la obtención de métricas consolidando Shopify + Meta Ads.
 */
import { DashboardMetrics, DashboardFilters } from '@/types/dashboard';

// TODO: Integrar con Supabase cuando el backend esté listo
// import { supabase } from '@/lib/supabase';

/**
 * Obtiene las métricas del dashboard para una tienda específica.
 * @param filters Filtros de búsqueda (tienda_id, rango fechas, etc.)
 */
export const getDashboardMetrics = async (filters: DashboardFilters): Promise<DashboardMetrics> => {
    // Por ahora retornamos datos mock para desarrollo frontend
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                today: {
                    ganancia: 450.00,
                    ventas: 800.00,
                    gastos: 150.00,
                    ordenes_efectivas: 12,
                    cpa_promedio: 12.50,
                    roas_promedio: 5.33
                },
                week: {
                    ganancia: 2100.00,
                    ventas: 4200.00,
                    gastos: 800.00,
                    ordenes_efectivas: 85,
                    cpa_promedio: 9.41,
                    roas_promedio: 5.25
                },
                month: {
                    ganancia: 8500.00,
                    ventas: 15000.00,
                    gastos: 3000.00,
                    ordenes_efectivas: 310,
                    cpa_promedio: 9.67,
                    roas_promedio: 5.0
                },
                history: [
                    { fecha: '2026-02-20', ganancia: 300, ventas: 600, gastos: 100 },
                    { fecha: '2026-02-21', ganancia: 450, ventas: 800, gastos: 150 },
                    { fecha: '2026-02-22', ganancia: 200, ventas: 500, gastos: 200 },
                    { fecha: '2026-02-23', ganancia: 550, ventas: 900, gastos: 120 },
                    { fecha: '2026-02-24', ganancia: 400, ventas: 750, gastos: 140 },
                    { fecha: '2026-02-25', ganancia: 600, ventas: 1000, gastos: 180 },
                    { fecha: '2026-02-26', ganancia: 450, ventas: 800, gastos: 150 }
                ],
                topCampaigns: [
                    { campaign_id: '1', name: 'Campaña Escala Pro', spend: 500, conversions: 45, cpa: 11.11, status: 'ACTIVE' },
                    { campaign_id: '2', name: 'Retargeting Caliente', spend: 150, conversions: 22, cpa: 6.81, status: 'ACTIVE' },
                    { campaign_id: '3', name: 'Testing Producto X', spend: 150, conversions: 5, cpa: 30.00, status: 'PAUSED' }
                ],
                recentOrders: [
                    { id: '1', order_number: '#12345', date: '2026-02-26T14:30:00Z', status: 'paid', fulfillment: 'fulfilled', total: 45.00, campaign_name: 'Campaña Escala Pro' },
                    { id: '2', order_number: '#12344', date: '2026-02-26T13:15:00Z', status: 'cancelled', fulfillment: 'cancelled', total: 50.00, campaign_name: 'Testing Producto X' },
                    { id: '3', order_number: '#12343', date: '2026-02-25T18:45:00Z', status: 'paid', fulfillment: 'pending', total: 40.00, campaign_name: 'Campaña Escala Pro' }
                ]
            });
        }, 800);
    });
};
