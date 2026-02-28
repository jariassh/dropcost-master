/**
 * Componente DashboardKPIs.
 * Muestra las métricas principales en la parte superior del Dashboard.
 */
import React from 'react';
import { Card } from '@/components/common';
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Info, Zap } from 'lucide-react';
import { PeriodMetrics } from '@/types/dashboard';

interface Props {
    metrics: PeriodMetrics | null;
    isLoading?: boolean;
}

export const DashboardKPIs: React.FC<Props> = ({ metrics, isLoading }) => {
    // Si no hay métricas, usamos valores por defecto (evita errores de renderizado)
    const displayMetrics = metrics || {
        ganancia: 0,
        ventas: 0,
        gastos: 0,
        roas_promedio: 0,
        cpa_promedio: 0,
        aov_promedio: 0,
        ordenes_efectivas: 0,
        cvr_promedio: 0
    };

    const mainKPIs = [
        {
            title: 'Ganancia Neta',
            value: `$${displayMetrics.ganancia.toLocaleString()}`,
            icon: TrendingUp,
            color: 'var(--color-success)',
            bg: 'var(--color-success)12'
        },
        {
            title: 'Ventas Totales',
            value: `$${displayMetrics.ventas.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--color-primary)',
            bg: 'var(--color-primary)12'
        },
        {
            title: 'Gastos Meta Ads',
            value: `$${displayMetrics.gastos.toLocaleString()}`,
            icon: TrendingDown,
            color: 'var(--color-error)',
            bg: 'var(--color-error)12'
        },
        {
            title: 'ROAS Real',
            value: `${displayMetrics.roas_promedio.toFixed(2)}x`,
            icon: TrendingUp,
            color: displayMetrics.roas_promedio >= 3 ? 'var(--color-success)' : 'var(--color-warning)',
            bg: displayMetrics.roas_promedio >= 3 ? 'var(--color-success)12' : 'var(--color-warning)12',
            badge: displayMetrics.roas_promedio >= 3 ? 'Rentable' : 'Bajo'
        }
    ];

    const secondaryKPIs = [
        {
            title: 'CPA Real',
            value: `$${displayMetrics.cpa_promedio.toFixed(2)}`,
            icon: TrendingDown,
            color: 'var(--color-primary)',
            bg: 'var(--color-primary)12'
        },
        {
            title: 'Ticket Promedio',
            value: `$${displayMetrics.aov_promedio.toFixed(2)}`,
            icon: DollarSign,
            color: 'var(--color-primary)',
            bg: 'var(--color-primary)12'
        },
        {
            title: 'Órdenes Efectivas',
            value: displayMetrics.ordenes_efectivas.toString(),
            icon: ShoppingBag,
            color: 'var(--color-warning)',
            bg: 'var(--color-warning)12'
        },
        {
            title: '% Compras vs Tráfico',
            value: displayMetrics.cvr_promedio > 0 ? `${displayMetrics.cvr_promedio.toFixed(2)}%` : 'Inactivo',
            icon: Zap,
            color: displayMetrics.cvr_promedio > 0 ? 'var(--color-success)' : 'var(--text-tertiary)',
            bg: displayMetrics.cvr_promedio > 0 ? 'var(--color-success)12' : 'var(--bg-secondary)',
            isInactive: displayMetrics.cvr_promedio === 0,
            helpText: 'KPI Crítico: Compras ÷ Visitas a la página de destino. Configúrala como métrica personalizada en tu Business Manager.'
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
            {/* Fila 1: KPIs PRINCIPALES */}
            <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                    KPIs Principales
                </p>
                <div
                    className="kpis-grid-main"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px'
                    }}
                >
                    {mainKPIs.map((card, index) => (
                        <KPICard key={card.title} card={card} index={index} isLoading={isLoading} />
                    ))}
                </div>
            </div>

            {/* Fila 2: MÉTRICAS SECUNDARIAS */}
            <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                    Métricas Secundarias
                </p>
                <div
                    className="kpis-grid-secondary"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px'
                    }}
                >
                    {secondaryKPIs.map((card, index) => (
                        <KPICard key={card.title} card={card} index={index + 4} isLoading={isLoading} />
                    ))}
                </div>
            </div>

            <style>
                {`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    @keyframes shimmer {
                        0% { background-position: -468px 0 }
                        100% { background-position: 468px 0 }
                    }

                    .skeleton-shimmer {
                        display: block;
                        height: 24px;
                        width: 100%;
                        background: linear-gradient(to right, var(--bg-secondary) 8%, var(--border-color) 18%, var(--bg-secondary) 33%);
                        background-size: 800px 104px;
                        border-radius: 4px;
                        animation: shimmer 1.5s infinite linear;
                        opacity: 0.6;
                    }
                    
                    @media (min-width: 1400px) {
                        .kpis-grid-main { grid-template-columns: repeat(4, 1fr) !important; }
                        .kpis-grid-secondary { grid-template-columns: repeat(4, 1fr) !important; }
                    }
                    
                    .kpi-help-tooltip {
                        position: absolute;
                        bottom: 100%;
                        left: 0;
                        width: 260px;
                        background: var(--bg-primary);
                        padding: 12px;
                        border-radius: 12px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        z-index: 100;
                        border: 1px solid var(--border-color);
                        font-size: 12px;
                        color: var(--text-secondary);
                        line-height: 1.5;
                        margin-bottom: 8px;
                        pointer-events: none;
                        opacity: 0;
                        transform: translateY(10px);
                        transition: all 200ms ease;
                    }
                    
                    .kpi-help-trigger:hover + .kpi-help-tooltip {
                        opacity: 1;
                        transform: translateY(0);
                    }
                `}
            </style>
        </div>
    );
};

function KPICard({ card, index, isLoading }: { card: any; index: number; isLoading?: boolean }) {
    return (
        <div
            style={{
                animation: 'slideUp 0.5s ease-out forwards',
                opacity: 0,
                transform: 'translateY(10px)',
                animationDelay: `${index * 0.1}s`,
                height: '100%',
                position: 'relative'
            }}
        >
            <Card hoverable style={{
                height: '100%',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                opacity: card.isInactive ? 0.7 : 1,
                border: card.isInactive ? '1px dashed var(--border-color)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {card.title}
                            </p>
                            {card.badge && !isLoading && (
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: card.bg, color: card.color }}>
                                    {card.badge}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="skeleton-shimmer" style={{ width: '80%', height: '32px' }}></div>
                        ) : (
                            <h3 style={{
                                fontSize: card.isInactive ? '20px' : '26px',
                                fontWeight: 800,
                                color: card.isInactive ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                margin: 0,
                                letterSpacing: '-0.03em'
                            }}>
                                {card.value}
                            </h3>
                        )}
                    </div>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        backgroundColor: isLoading ? 'var(--bg-secondary)' : card.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: (card.isInactive || isLoading) ? 'none' : `0 8px 16px -4px ${card.color}20`,
                        opacity: isLoading ? 0.5 : 1
                    }}>
                        {!isLoading ? (
                            <card.icon size={26} style={{ color: card.color }} />
                        ) : (
                            <Zap size={20} color="var(--text-tertiary)" />
                        )}
                    </div>
                </div>
            </Card>

            {card.helpText && !isLoading && (
                <>
                    <div className="kpi-help-trigger" style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'help', color: 'var(--text-tertiary)', display: 'flex' }}>
                        <Info size={13} />
                    </div>
                    <div className="kpi-help-tooltip" style={{ right: '0', left: 'auto' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Setup Meta Ads:</p>
                        {card.helpText}
                    </div>
                </>
            )}
        </div>
    );
}
