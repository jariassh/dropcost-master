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
}

export interface PeriodMetrics {
    ganancia: number;
    ventas: number;
    gastos: number;
    ordenes_efectivas: number;
    cpa_promedio: number;
    roas_promedio: number;
}

export interface ChartDataPoint {
    fecha: string;
    ganancia: number;
    ventas: number;
    gastos: number;
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
    status: 'paid' | 'pending' | 'refunded' | 'cancelled';
    fulfillment: 'fulfilled' | 'pending' | 'cancelled';
    total: number;
    campaign_name?: string;
}

export interface DashboardFilters {
    tienda_id: string;
    startDate?: string;
    endDate?: string;
    campaign_id?: string;
}
