/**
 * Interfaces para el Dashboard Operacional.
 * Basado en la especificación técnica Fase 1.
 */

export interface DashboardMetrics {
    today: PeriodMetrics;
    week: PeriodMetrics;
    month: PeriodMetrics;
    history: ChartDataPoint[];
    topCampaigns: CampaignData[];
    recentOrders: DashboardOrder[];
    costeoAnalytics: CosteoAnalytics[];
}

export interface CosteoAnalytics {
    id: string;
    nombre_producto: string;
    meta_campaign_id?: string;
    target_price: number;
    target_cpa: number;
    target_flete: number;
    real_cpa: number;
    real_orders: number;
    real_spend: number;
    real_roas: number;
}

export interface PeriodMetrics {
    ganancia: number;
    ventas: number;
    gastos: number;
    ordenes_efectivas: number;
    cpa_promedio: number;
    roas_promedio: number;
    aov_promedio: number;
    cvr_promedio: number;
    gastos_meta?: number;
}

export interface ChartDataPoint {
    fecha: string;
    ganancia: number;
    ventas: number;
    gasto_logistica: number;
    gasto_meta: number;
}

export interface CampaignData {
    campaign_id: string;
    name: string;
    spend: number;
    conversions: number;
    cpa: number;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

export interface DashboardOrder {
    id: string;
    order_number: string;
    date: string;
    status: string;
    fulfillment: string;
    total: number;
    campaign_name?: string;
    notas?: string;
    customer_details?: any;
    cliente_nombre?: string;
    cliente_telefono?: string;
    cliente_ciudad?: string;
    cliente_departamento?: string;
    cliente_direccion?: string;
    cliente_email?: string;
}

export interface DashboardFilters {
    tienda_id: string;
    startDate?: string;
    endDate?: string;
    campaign_id?: string;
}
