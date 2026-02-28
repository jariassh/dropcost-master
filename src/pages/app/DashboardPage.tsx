/**
 * Página Dashboard — Visualización de métricas operacionales.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Card, Tooltip as DSTooltip } from '@/components/common';
import { BarChart3, RefreshCw, Filter, TrendingUp, Store, Zap, ShoppingCart, ShoppingBag, Info } from 'lucide-react';
import { DashboardKPIs } from '@/components/dashboard/DashboardKPIs';
import { CostingsAnalyticsTable } from '@/components/dashboard/CostingsAnalyticsTable';
import { OrderDetailsModal } from '@/components/dashboard/OrderDetailsModal';
import { getDashboardMetrics } from '@/services/dashboardService';
import { useNotificationStore } from '@/store/notificationStore';
import { DashboardMetrics, DashboardOrder } from '@/types/dashboard';
import { useStoreStore } from '@/store/useStoreStore';
import {
    ResponsiveContainer,
    AreaChart, Area,
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis,
    CartesianGrid, Tooltip, Legend
} from 'recharts';

export function DashboardPage() {
    const { tiendaActual } = useStoreStore();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
    const [historyDays, setHistoryDays] = useState(30);
    const [roasPeriod, setRoasPeriod] = useState<'thisMonth' | 'lastMonth' | 'last3Months'>('thisMonth');
    const [selectedOrder, setSelectedOrder] = useState<DashboardOrder | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const { addNotification, notifications } = useNotificationStore();

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
    }, [tiendaActual?.id, timeRange]);

    const handleRefresh = async () => {
        await fetchMetrics();
    };

    // Sync Campaign Alerts to Global Notifications
    useEffect(() => {
        if (metrics?.topCampaigns) {
            const highCpaCampaigns = metrics.topCampaigns.filter(c => c.cpa > 15);

            highCpaCampaigns.forEach(campaign => {
                const exists = notifications.some(n =>
                    n.title.includes(campaign.name) && n.type === 'warning'
                );

                if (!exists) {
                    addNotification({
                        userId: 'user',
                        title: `CPA Alto detectado: ${campaign.name}`,
                        message: `La campaña "${campaign.name}" tiene un CPA de $${campaign.cpa.toFixed(2)}, lo cual supera el límite establecido.`,
                        type: 'warning'
                    });
                }
            });
        }
    }, [metrics?.topCampaigns]);

    const handleOrderClick = (order: DashboardOrder) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    const filteredHistory = useMemo(() => {
        if (!metrics?.history) return [];
        return [...metrics.history]
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .slice(-historyDays);
    }, [metrics?.history, historyDays]);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                            padding: '4px 10px',
                            backgroundColor: 'var(--color-primary)15',
                            color: 'var(--color-primary)',
                            borderRadius: '30px',
                            fontSize: '10px',
                            fontWeight: 800,
                            letterSpacing: '0.05em'
                        }}>
                            PRO FEATURES ACTIVE
                        </span>
                    </div>
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
                <div style={{ padding: '80px 40px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', border: '1px dashed var(--border-color)', maxWidth: '600px', margin: '40px auto' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: 'var(--color-primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Store size={40} color="var(--color-primary)" />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Selecciona tu Tienda</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                        Para ver el rendimiento operacional, los KPIs avanzados y las alertas de campañas, primero debes elegir una tienda del menú lateral.
                    </p>
                </div>
            ) : (
                <>
                    {/* Sección KPIs */}
                    <DashboardKPIs
                        metrics={metrics ? metrics[timeRange] : null}
                        isLoading={isLoading}
                    />

                    {/* Grid de Gráficos Duales */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                            gap: '24px',
                            marginBottom: '32px'
                        }}
                    >
                        {/* Gráfico 1: Ventas vs Gastos */}
                        <Card
                            title={`Ventas vs Gastos (${historyDays} días)`}
                            icon={<TrendingUp size={16} />}
                            headerAction={
                                <select
                                    value={historyDays}
                                    onChange={(e) => setHistoryDays(Number(e.target.value))}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value={7}>7 días</option>
                                    <option value={15}>15 días</option>
                                    <option value={30}>30 días</option>
                                    <option value={60}>60 días</option>
                                </select>
                            }
                        >
                            <div style={{ height: '350px', width: '100%', padding: '10px 0' }}>
                                {metrics && metrics.history.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis
                                                dataKey="fecha"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                                                tickFormatter={(str) => {
                                                    const parts = str.split('-');
                                                    return `${parts[2]}/${parts[1]}`;
                                                }}
                                            />
                                            <YAxis hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                                            <Area
                                                type="monotone"
                                                name="Ventas ($)"
                                                dataKey="ventas"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorVentas)"
                                            />
                                            <Area
                                                type="monotone"
                                                name="Gastos ($)"
                                                dataKey={(d) => (d.gasto_logistica || 0) + (d.gasto_meta || 0)}
                                                stroke="#f97316"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorGastos)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <NoDataView />
                                )}
                            </div>
                        </Card>

                        {/* Gráfico 2: ROAS por Semana */}
                        <Card
                            title="ROAS por Semana"
                            icon={<BarChart3 size={16} />}
                            headerAction={
                                <select
                                    value={roasPeriod}
                                    onChange={(e) => setRoasPeriod(e.target.value as any)}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="thisMonth">Este mes</option>
                                    <option value="lastMonth">Mes pasado</option>
                                    <option value="last3Months">Últimos 3 meses</option>
                                </select>
                            }
                        >
                            <div style={{ height: '350px', width: '100%', padding: '10px 0' }}>
                                {metrics && metrics.history.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={(() => {
                                                const sorted = [...metrics.history].sort((a, b) => a.fecha.localeCompare(b.fecha));
                                                let filtered = sorted;

                                                if (roasPeriod === 'thisMonth') {
                                                    filtered = sorted.slice(-30);
                                                } else if (roasPeriod === 'lastMonth') {
                                                    filtered = sorted.slice(-60, -30);
                                                } else if (roasPeriod === 'last3Months') {
                                                    filtered = sorted.slice(-90);
                                                }

                                                const weeklyData: any[] = [];
                                                for (let i = 0; i < filtered.length; i += 7) {
                                                    const weekSlice = filtered.slice(i, i + 7);
                                                    const totalVentas = weekSlice.reduce((sum, d) => sum + d.ventas, 0);
                                                    const totalGastoMeta = weekSlice.reduce((sum, d) => sum + (d.gasto_meta || 0), 0);
                                                    weeklyData.push({
                                                        name: `Semana ${Math.floor(i / 7) + 1}`,
                                                        roas: totalGastoMeta > 0 ? Number((totalVentas / totalGastoMeta).toFixed(2)) : 0
                                                    });
                                                }
                                                return weeklyData;
                                            })()}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorRoas" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.5} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                            <Tooltip
                                                cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                                                contentStyle={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar name="ROAS Real" dataKey="roas" fill="url(#colorRoas)" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <NoDataView />
                                )}
                            </div>
                        </Card>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '24px',
                            marginBottom: '32px'
                        }}
                    >
                        {/* Tabla de Órdenes Recientes */}
                        <Card title="Últimas Órdenes Shopify" icon={<ShoppingCart size={16} />}>
                            <div style={{ padding: '8px 0', maxHeight: '400px', overflowY: 'auto' }}>
                                {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                                    metrics.recentOrders.map((order, idx) => (
                                        <div
                                            key={order.id}
                                            onClick={() => handleOrderClick(order)}
                                            className="order-row-hover"
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '16px 12px',
                                                margin: '0 -12px',
                                                borderBottom: idx === metrics.recentOrders.length - 1 ? 'none' : '1px solid var(--border-color)',
                                                transition: 'all 200ms ease',
                                                cursor: 'pointer',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <ShoppingBag size={18} color="var(--text-tertiary)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                        {order.order_number}
                                                    </p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                                                        {new Date(order.date).toLocaleDateString()} • {order.campaign_name || 'Directo'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                    ${order.total.toFixed(2)}
                                                </p>
                                                <span
                                                    style={{
                                                        fontSize: '10px',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        color: order.fulfillment === 'entregado' ? 'var(--color-success)' : order.status === 'paid' ? 'var(--color-success)' : order.status === 'cancelled' ? 'var(--color-error)' : 'var(--color-warning)',
                                                        backgroundColor: order.fulfillment === 'entregado' ? 'var(--color-success)15' : order.status === 'paid' ? 'var(--color-success)15' : order.status === 'cancelled' ? 'var(--color-error)15' : 'var(--color-warning)15',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <NoDataView />
                                )}
                            </div>
                        </Card>

                        {/* Top Campañas por Rendimiento */}
                        <Card
                            title="Top Campañas (Meta Ads)"
                            icon={<Zap size={16} />}
                            headerAction={
                                <DSTooltip
                                    content="Las 3 campañas que más presupuesto están consumiendo actualmente, basado en el gasto real detectado en Meta Ads."
                                    position="left"
                                >
                                    <div style={{ color: 'var(--text-tertiary)', cursor: 'help', display: 'flex' }}>
                                        <Info size={16} />
                                    </div>
                                </DSTooltip>
                            }
                        >
                            <div style={{ padding: '8px 0', maxHeight: '400px', overflowY: 'auto' }}>
                                {metrics?.topCampaigns && metrics.topCampaigns.length > 0 ? (
                                    metrics.topCampaigns.map((campaign, i) => (
                                        <div key={i} style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{campaign.name}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>${campaign.spend.toLocaleString()} Gasto</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min((campaign.spend / 5000) * 100, 100)}%`,
                                                    height: '100%',
                                                    backgroundColor: 'var(--color-primary)',
                                                    borderRadius: '4px'
                                                }} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No hay campañas vinculadas aún.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Nueva Tabla: Analítica de Costeos Cruzada */}
                    {metrics && (
                        <div style={{ marginTop: '0', marginBottom: '40px' }}>
                            <CostingsAnalyticsTable
                                data={metrics.costeoAnalytics}
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </>
            )}

            <OrderDetailsModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                order={selectedOrder}
            />

            <style>{`
                .order-row-hover:hover {
                    background-color: var(--bg-secondary);
                    transform: translateX(4px);
                }
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: repeat(auto-fit, minmax(450px, 1fr))"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

function NoDataView() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
            <Zap size={32} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Datos insuficientes</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Sincroniza tus ventas para ver el análisis.</p>
        </div>
    );
}
