import { BarChart3 } from 'lucide-react';
import {
    calculateCPA,
    calculateViability,
    getViabilityRecommendation,
    type ViabilityData
} from './simulatorCalculations';

interface ViabilityAnalysisProps {
    gastoMeta: number;
    numeroVentas: number;
    margenNeto: number;
    currency?: string;
    country?: string;
}

export function ViabilityAnalysis({
    gastoMeta,
    numeroVentas,
    margenNeto,
    currency = 'COP',
    country = 'CO',
}: ViabilityAnalysisProps) {
    const cpa = calculateCPA(gastoMeta, numeroVentas);
    const viability = calculateViability(cpa, margenNeto);
    const recommendation = getViabilityRecommendation(viability);

    const formatCurrency = (val: number) => {
        const locale = country === 'CO' ? 'es-CO' : country === 'MX' ? 'es-MX' : country === 'PE' ? 'es-PE' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    return (
        <div style={{
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            marginTop: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--color-primary)'
                }}>
                    <BarChart3 size={20} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Análisis de Viabilidad CPA
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <MetricCard
                    label="CPA Amortizado"
                    value={formatCurrency(cpa)}
                    subtext={`${formatCurrency(gastoMeta)} / ${numeroVentas} ventas`}
                />
                <MetricCard
                    label="Rentabilidad"
                    value={`${viability.rentabilidad}%`}
                    subtext="Sobre el CPA"
                    valueColor={viability.color}
                />
            </div>

            <div style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: `${viability.color}15`, // Extra subtle transparency
                border: `1px solid ${viability.color}30`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: viability.color,
                    letterSpacing: '0.02em'
                }}>
                    {recommendation.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {recommendation.message}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💡 {recommendation.subMessage}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, subtext, valueColor }: {
    label: string, value: string, subtext: string, valueColor?: string
}) {
    return (
        <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
        }}>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                {label}
            </p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: valueColor || 'var(--text-primary)' }}>
                {value}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {subtext}
            </p>
        </div>
    );
}
