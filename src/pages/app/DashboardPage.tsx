/**
 * Página Dashboard — Visualización de métricas operacionales.
 */
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common';
import { BarChart3, RefreshCw, Filter, TrendingUp } from 'lucide-react';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { getDashboardMetrics } from '@/services/dashboardService';
import { DashboardMetrics } from '@/types/dashboard';
import { useStoreStore } from '@/store/useStoreStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PremiumFeatureGuard } from '@/components/common/PremiumFeatureGuard';

export function DashboardPage() {
    const { tiendaActual } = useStoreStore();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

    const fetchMetrics = async () => {
        if (!tiendaActual?.id) {
            setMetrics(null);
            return;
        }

        setIsLoading(true);
        try {
            const data = await getDashboardMetrics({ tienda_id: tiendaActual.id });
            setMetrics(data);
        } catch (error) {
            console.error('Error cargando métricas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, [tiendaActual?.id, timeRange]); // We might not need to refetch on timeRange change if history handles all, but keeping it reactive makes sense if we fetch specific ranges

    const handleRefresh = async () => {
        await fetchMetrics();
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
                        Resumen de {tiendaActual?.nombre || 'Operaciones'}
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

            {!tiendaActual?.id ? (
                <div style={{ padding: '60px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px' }}>
                    <Store size={48} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Selecciona una Tienda</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Por favor elige una tienda del menú lateral para ver el dashboard.</p>
                </div>
            ) : (
                <>
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
                        {/* Gráfico Histórico - Recharts implementado */}
                        <Card title="Rendimiento Histórico">
                            <div style={{ height: '300px', width: '100%', padding: '10px 0' }}>
                                {metrics && metrics.history.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={metrics.history}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-error)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--color-error)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis
                                                dataKey="fecha"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                                tickFormatter={(str) => {
                                                    const parts = str.split('-');
                                                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : str;
                                                }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                                tickFormatter={(val) => `$${val}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                                                itemStyle={{ fontWeight: 600 }}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            <Area type="monotone" name="Ganancia Neta" dataKey="ganancia" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorGanancia)" />
                                            <Area type="monotone" name="Gasto Publicidad" dataKey="gastos" stroke="var(--color-error)" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                        <TrendingUp size={32} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>No hay datos suficientes para mostrar.</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Tabla de Órdenes Recientes */}
                        <Card title="Últimas Órdenes Shopify">
                            <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
                                {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                                    metrics.recentOrders.map((order, idx) => (
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
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '40px' }}>Sin órdenes recientes</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Sección Alertas CPA */}
                    <PremiumFeatureGuard featureKey="advanced_analytics" title="Análisis Avanzado" description="Las alertas de CPA y el análisis de campañas son exclusivos de nuestro plan Pro.">
                        <div style={{ marginTop: '32px' }}>
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
                                {metrics?.topCampaigns && metrics.topCampaigns.filter(c => c.cpa > 15).map(campaign => (
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
                                {(!metrics?.topCampaigns || metrics.topCampaigns.filter(c => c.cpa > 15).length === 0) && (
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        No hay alertas de CPA alto en este período o no tienes Meta Ads conectado.
                                    </p>
                                )}
                            </div>
                        </div>
                    </PremiumFeatureGuard>
                </>
            )}
        </div>
    );
}
