/**
 * Página Dashboard — Visualización de métricas operacionales.
 */
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common';
import { BarChart3, RefreshCw, Filter } from 'lucide-react';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { getDashboardMetrics } from '@/services/dashboardService';
import { DashboardMetrics } from '@/types/dashboard';

export function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

    useEffect(() => {
        const fetchMetrics = async () => {
            setIsLoading(true);
            try {
                // TODO: Obtener tienda_id del contexto global o URL
                const data = await getDashboardMetrics({ tienda_id: '123' });
                setMetrics(data);
            } catch (error) {
                console.error('Error cargando métricas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const handleRefresh = async () => {
        setIsLoading(true);
        const data = await getDashboardMetrics({ tienda_id: '123' });
        setMetrics(data);
        setIsLoading(false);
    };

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out', paddingBottom: '40px' }}>
            {/* Header de página */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: '28px'
                }}
            >
                <div>
                    <p
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--color-primary)',
                            marginBottom: '6px',
                        }}
                    >
                        Dashboard Operacional
                    </p>
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            margin: '0 0 4px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Resumen de Operaciones
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
                        {timeRange === 'today' ? 'Datos de hoy' : timeRange === 'week' ? 'Resumen semanal' : 'Resumen mensual'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                        style={{
                            display: 'flex',
                            backgroundColor: 'var(--bg-secondary)',
                            padding: '4px',
                            borderRadius: '10px'
                        }}
                    >
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    backgroundColor: timeRange === range ? 'var(--bg-primary)' : 'transparent',
                                    color: timeRange === range ? 'var(--color-primary)' : 'var(--text-secondary)',
                                    boxShadow: timeRange === range ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 200ms ease'
                                }}
                            >
                                {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRefresh}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Sección KPIs */}
            {metrics && (
                <DashboardKPIs
                    metrics={metrics[timeRange]}
                    isLoading={isLoading}
                />
            )}

            {/* Grid Principal de Gráficos y Análisis */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px'
                }}
            >
                {/* Gráfico de Ganancia/Pérdida - Placeholder */}
                <Card title="Rendimiento Histórico">
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px 20px',
                            textAlign: 'center',
                        }}
                    >
                        <BarChart3 size={32} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>
                            Análisis de Tendencias
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                            Los gráficos de Recharts se integrarán próximamente para visualizar {timeRange === 'month' ? 'los últimos 30 días' : 'el período seleccionado'}.
                        </p>
                    </div>
                </Card>

                {/* Tabla de Órdenes Recientes - Placeholder */}
                <Card title="Últimas Órdenes Shopify">
                    <div style={{ padding: '8px 0' }}>
                        {metrics?.recentOrders.map((order, idx) => (
                            <div
                                key={order.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 0',
                                    borderBottom: idx === metrics.recentOrders.length - 1 ? 'none' : '1px solid var(--border-color)'
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        {order.order_number}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                                        {order.campaign_name || 'Sin campaña'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                        ${order.total.toFixed(2)}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: order.status === 'paid' ? 'var(--color-success)' : order.status === 'cancelled' ? 'var(--color-error)' : 'var(--color-warning)',
                                            margin: 0
                                        }}
                                    >
                                        {order.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Sección Alertas CPA - Placeholder */}
            <div>
                <p
                    style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                        marginBottom: '14px',
                    }}
                >
                    Alertas de Campañas
                </p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '16px'
                    }}
                >
                    {metrics?.topCampaigns.filter(c => c.cpa > 15).map(campaign => (
                        <Card key={campaign.campaign_id} style={{ borderLeft: '4px solid var(--color-error)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                                        CPA Alto: {campaign.name}
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                                        CPA Actual: <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>${campaign.cpa.toFixed(2)}</span>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase' }}>
                                        Conversiones
                                    </p>
                                    <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                        {campaign.conversions}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {metrics?.topCampaigns.filter(c => c.cpa > 15).length === 0 && (
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No hay alertas de CPA alto en este período.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
