interface FunnelStep {
    label: string;
    value: number;
    color: string;
}

interface VerticalFunnelProps {
    steps: FunnelStep[];
    currency: string;
    totalPrice: number;
    country?: string;
}

export function VerticalFunnel({ steps, currency, country = 'CO' }: VerticalFunnelProps) {
    const formatCurrency = (val: number) => {
        const locale = country === 'CO' ? 'es-CO' : country === 'MX' ? 'es-MX' : country === 'PE' ? 'es-PE' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    if (!steps || steps.length < 5) return null;

    const ingreso = steps[0];
    const costos = steps.slice(1, steps.length - 1);
    const profit = steps[steps.length - 1];

    const bgColors = [
        'var(--funnel-bg-ingreso)',
        'var(--funnel-bg-costo)',
        'var(--funnel-bg-logis)',
        'var(--funnel-bg-cpa)'
    ];

    const textColors = [
        'var(--funnel-text-ingreso)',
        'var(--funnel-text-costo)',
        'var(--funnel-text-logis)',
        'var(--funnel-text-cpa)'
    ];

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '420px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
        }}>
            {/* Top Row: Ingreso */}
            <div style={{
                width: '100%',
                height: '56px',
                background: bgColors[0],
                clipPath: 'polygon(0% 0%, 100% 0%, 96% 100%, 4% 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                transition: 'all 0.3s'
            }}>
                <span style={{ color: textColors[0], fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-headings)' }}>
                    Ingreso
                </span>
                <span style={{ color: textColors[0], fontSize: '16px', fontWeight: 900, fontFamily: 'var(--font-headings)' }}>
                    {formatCurrency(ingreso.value)}
                </span>
            </div>

            {/* Middle Rows: Costos */}
            {costos.map((step, idx) => {
                const stepIdx = idx + 1;
                const topP = stepIdx * 4;
                const botP = (stepIdx + 1) * 4;

                return (
                    <div key={step.label} style={{
                        width: '100%',
                        height: '52px',
                        background: bgColors[stepIdx],
                        clipPath: `polygon(${topP}% 0%, ${100 - topP}% 0%, ${100 - botP}% 100%, ${botP}% 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `0 calc(32px + ${topP} * 1%)`,
                        transition: 'all 0.3s'
                    }}>
                        <span style={{ color: textColors[stepIdx], fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-headings)' }}>
                            {step.label}
                        </span>
                        <span style={{ color: textColors[stepIdx], fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-headings)' }}>
                            -{formatCurrency(step.value)}
                        </span>
                    </div>
                );
            })}

            <div style={{ height: '8px' }} />

            {/* Bottom Row: Profit Final */}
            <div style={{
                width: '74%',
                margin: '0 auto',
                background: 'var(--funnel-bg-profit)',
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
                <span style={{ color: 'var(--funnel-text-profit)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontFamily: 'var(--font-body)' }}>
                    PROFIT FINAL
                </span>
                <span style={{ color: 'var(--funnel-text-profit)', fontSize: '24px', fontWeight: 950, letterSpacing: '-0.02em', fontFamily: 'var(--font-headings)' }}>
                    {formatCurrency(profit.value)}
                </span>
            </div>
        </div>
    );
}
