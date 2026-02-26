/**
 * Componente DashboardKPIs.
 * Muestra las métricas principales en la parte superior del Dashboard.
 */
import React from 'react';
import { Card } from '@/components/common';
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react';
import { PeriodMetrics } from '@/types/dashboard';

interface Props {
    metrics: PeriodMetrics;
    isLoading?: boolean;
}

export const DashboardKPIs: React.FC<Props> = ({ metrics, isLoading }) => {
    // Si está cargando, podemos mostrar un esqueleto o indicador
    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando métricas...</div>;
    }

    const cards = [
        {
            title: 'Ganancia Neta',
            value: `$${metrics.ganancia.toLocaleString()}`,
            icon: TrendingUp,
            color: 'var(--color-success)',
            bg: 'var(--color-success)12'
        },
        {
            title: 'Ventas Totales',
            value: `$${metrics.ventas.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--color-primary)',
            bg: 'var(--color-primary)12'
        },
        {
            title: 'Gastos Meta Ads',
            value: `$${metrics.gastos.toLocaleString()}`,
            icon: TrendingDown,
            color: 'var(--color-error)',
            bg: 'var(--color-error)12'
        },
        {
            title: 'Órdenes Efectivas',
            value: metrics.ordenes_efectivas.toString(),
            icon: ShoppingBag,
            color: 'var(--color-warning)',
            bg: 'var(--color-warning)12'
        }
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}
        >
            {cards.map((card) => (
                <Card key={card.title} hoverable>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '8px'
                                }}
                            >
                                {card.title}
                            </p>
                            <h3
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                {card.value}
                            </h3>
                        </div>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                backgroundColor: card.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <card.icon size={24} style={{ color: card.color }} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
