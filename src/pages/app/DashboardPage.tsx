/**
 * Página Dashboard — Placeholder con KPIs.
 * Gráficos completos serán implementados en Fase 7.
 */
import { Card } from '@/components/common';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, TrendingDown } from 'lucide-react';

const kpiCards = [
    { title: 'Ventas Totales', value: '$0', change: '0%', positive: true, icon: DollarSign, color: 'var(--color-primary)' },
    { title: 'CPA Promedio', value: '$0.00', change: '0%', positive: true, icon: TrendingDown, color: 'var(--color-success)' },
    { title: 'Productos Activos', value: '0', change: '0', positive: true, icon: ShoppingBag, color: 'var(--color-warning)' },
    { title: 'Efectividad', value: '0%', change: '0%', positive: true, icon: TrendingUp, color: 'var(--color-primary-dark)' },
];

export function DashboardPage() {
    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            {/* Header de página */}
            <div style={{ marginBottom: '28px' }}>
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
                    Panel Principal
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
                    Dashboard
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
                    Resumen general de tus operaciones
                </p>
            </div>

            {/* Sección KPIs */}
            <div style={{ marginBottom: '32px' }}>
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
                    Métricas Clave
                </p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.title} hoverable>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            margin: '0 0 8px',
                                        }}
                                    >
                                        {kpi.title}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: 800,
                                            color: 'var(--text-primary)',
                                            margin: '0 0 6px',
                                            letterSpacing: '-0.02em',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {kpi.value}
                                    </p>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: kpi.positive ? 'var(--color-success)' : 'var(--color-error)',
                                        }}
                                    >
                                        {kpi.change}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: `${kpi.color}12`,
                                        flexShrink: 0,
                                    }}
                                >
                                    <kpi.icon size={20} style={{ color: kpi.color }} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Sección Gráficos — placeholder */}
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
                    Análisis y Tendencias
                </p>
                <Card>
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
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                backgroundColor: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px',
                            }}
                        >
                            <BarChart3 size={32} color="var(--text-tertiary)" />
                        </div>
                        <h3
                            style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: '0 0 8px',
                            }}
                        >
                            Dashboard en construcción
                        </h3>
                        <p
                            style={{
                                fontSize: '14px',
                                color: 'var(--text-secondary)',
                                maxWidth: '420px',
                                lineHeight: 1.6,
                                margin: 0,
                            }}
                        >
                            Los gráficos detallados, análisis de tendencias e insights del
                            dashboard serán implementados en la Fase 7.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
