import { type CostBreakdown } from '@/types/simulator';

interface ProfitabilityFunnelProps {
    costBreakdown: CostBreakdown;
    currency: string;
}

export function ProfitabilityFunnel({ costBreakdown, currency }: ProfitabilityFunnelProps) {
    const {
        productCost,
        shippingCost,
        collectionCommission,
        returnCost,
        otherExpenses,
        cpa,
        netMargin,
        totalPrice
    } = costBreakdown;

    const format = (val: number) =>
        new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2
        }).format(val);

    const logisticsTotal = shippingCost + collectionCommission + returnCost + otherExpenses;

    const segments = [
        { label: 'Costo Producto', value: productCost, color: '#3b82f6', icon: '📦' },
        { label: 'Gastos Logísticos', value: logisticsTotal, color: '#f59e0b', icon: '🚚' },
        { label: 'Costo Marketing (CPA)', value: cpa, color: '#ef4444', icon: '📢' },
        { label: 'Utilidad Neta', value: netMargin, color: '#10b981', icon: '💰' },
    ];

    return (
        <div style={{
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Embudo de Rentabilidad por Venta
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {segments.map((seg, idx) => {
                    const percentage = totalPrice > 0 ? (seg.value / totalPrice) * 100 : 0;
                    return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '14px' }}>{seg.icon}</span> {seg.label}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {format(seg.value)} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({percentage.toFixed(1)}%)</span>
                                </span>
                            </div>
                            <div style={{
                                height: '8px',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.max(0, percentage)}%`,
                                    backgroundColor: seg.color,
                                    borderRadius: '4px',
                                    transition: 'width 500ms ease-out'
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px dashed var(--border-color)',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Ingreso Total: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{format(totalPrice)}</span>
                </p>
            </div>
        </div>
    );
}
