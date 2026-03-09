
import { Tooltip } from '@/components/common';

interface FunnelStep {
    label: string;
    value: number;
    color: string;
}

interface VerticalFunnelProps {
    steps: FunnelStep[];
    currency: string;
    totalPrice: number;
}

export function VerticalFunnel({ steps, currency }: VerticalFunnelProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(val);
    };

    if (!steps || steps.length < 5) return null;

    const ingreso = steps[0];
    const costos = steps.slice(1, steps.length - 1);
    const profit = steps[steps.length - 1];

    // Colors matching the design approximately
    const bgColors = [
        'var(--funnel-bg-ingreso)',   // Ingreso
        'var(--funnel-bg-costo)',     // Costo Prod
        'var(--funnel-bg-logis)',   // Logística
        'var(--funnel-bg-cpa)'      // Ads CPA
    ];

    const textColors = [
        'var(--funnel-text-ingreso)', // Ingreso
        'var(--funnel-text-costo)',   // Costo Prod
        'var(--funnel-text-logis)',   // Logística
        'var(--funnel-text-cpa)'      // Ads CPA
    ];

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px', // Small gap between trapezoids
        }}>
            {/* Top Row: Ingreso */}
            <Tooltip content={`${ingreso.label}: ${formatCurrency(ingreso.value)}`}>
                <div style={{
                    width: '100%',
                    height: '56px',
                    background: bgColors[0],
                    clipPath: 'polygon(0% 0%, 100% 0%, 96% 100%, 4% 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    transition: 'all 0.3s'
                }}>
                    <span style={{ color: textColors[0], fontSize: '15px', fontWeight: 800 }}>
                        {ingreso.label === 'Precio' ? 'Ingreso' : ingreso.label}
                    </span>
                    <span style={{ color: textColors[0], fontSize: '16px', fontWeight: 900 }}>
                        {formatCurrency(ingreso.value)}
                    </span>
                </div>
            </Tooltip>

            {/* Middle Rows: Costos */}
            {costos.map((step, idx) => {
                // To create the continuous funnel effect, each step's top width = previous step's bottom width
                // Base: 100% width
                // Top step bot: 96%
                // 1st cost top: 96%, bot: 92%
                // 2nd cost top: 92%, bot: 88%
                // 3rd cost top: 88%, bot: 84%

                const stepIdx = idx + 1;
                const topP = stepIdx * 4; // 4, 8, 12...
                const botP = (stepIdx + 1) * 4; // 8, 12, 16...

                return (
                    <Tooltip key={step.label} content={`${step.label}: -${formatCurrency(step.value)}`}>
                        <div style={{
                            width: '100%',
                            height: '52px',
                            background: bgColors[stepIdx],
                            clipPath: `polygon(${topP}% 0%, ${100 - topP}% 0%, ${100 - botP}% 100%, ${botP}% 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            // The visual padding mathematically narrows but we keep texts somewhat constrained
                            padding: `0 calc(24px + ${topP} * 1%)`,
                            transition: 'all 0.3s'
                        }}>
                            <span style={{ color: textColors[stepIdx] || 'var(--text-tertiary)', fontSize: '13px', fontWeight: 700 }}>
                                {step.label === 'Producto' ? 'Costo Prod' : step.label === 'Pauta' ? 'Ads CPA' : step.label}
                            </span>
                            <span style={{ color: textColors[stepIdx] || 'var(--text-inverse)', fontSize: '14px', fontWeight: 800 }}>
                                -{formatCurrency(step.value)}
                            </span>
                        </div>
                    </Tooltip>
                );
            })}

            {/* Spacer before Profit */}
            <div style={{ height: '8px' }} />

            {/* Bottom Row: Profit Final */}
            <Tooltip content={`Ganancia Neta por Venta`}>
                <div style={{
                    width: '74%', // Slightly narrower than the last trapezoid bottom
                    margin: '0 auto',
                    background: 'var(--funnel-bg-profit)', // Dark greenish base
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 24px',
                    transition: 'all 0.3s',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <span style={{ color: 'var(--funnel-text-profit)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        PROFIT FINAL
                    </span>
                    <span style={{ color: 'var(--text-inverse)', fontSize: '24px', fontWeight: 950, letterSpacing: '-0.02em' }}>
                        {formatCurrency(profit.value)}
                    </span>
                </div>
            </Tooltip>
        </div>
    );
}
