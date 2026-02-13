/**
 * SimuladorResults - Panel sticky de resultados.
 * Layout: Price card (+ volume overlay) → Costos + Embudo → Desglose bar.
 * Shows RAW per-event values (not amortized) for display clarity.
 * When volume strategy is active, a secondary block shows bundle pricing.
 */
import type { SimulatorResults as Results, VolumeStrategy } from '@/types/simulator';
import { Package } from 'lucide-react';

interface SimuladorResultsProps {
    results: Results | null;
    shippingCost: number;
    collectionCommissionPercent: number;
    volumeStrategy: VolumeStrategy;
    maxUnits: number;
}

export function SimuladorResults({ results, shippingCost, collectionCommissionPercent, volumeStrategy, maxUnits }: SimuladorResultsProps) {
    const formatCurrency = (val: number) =>
        '$' + Math.round(val).toLocaleString('es-CO');

    const r = results ?? {
        suggestedPrice: 0,
        netProfitPerSale: 0,
        finalEffectivenessPercent: 0,
        costBreakdown: { productCost: 0, shippingCost: 0, collectionCommission: 0, returnCost: 0, otherExpenses: 0, cpa: 0, netMargin: 0, totalPrice: 0 },
        effectivenessFunnel: { totalOrders: 100, afterPreCancellation: 0, afterReturns: 0, effectiveOrders: 0 },
    };

    const { suggestedPrice, netProfitPerSale, finalEffectivenessPercent, costBreakdown, effectivenessFunnel } = r;

    // Raw display values (per-event, not amortized)
    const rawCommission = suggestedPrice * (collectionCommissionPercent / 100);
    const rawFleteRecaudo = shippingCost + rawCommission;
    const rawReturnLoss = shippingCost * 1.5; // 150% del flete por cada devolución

    // Desglose bar
    const logisticaCost = costBreakdown.shippingCost + costBreakdown.collectionCommission + costBreakdown.returnCost + costBreakdown.otherExpenses;
    const breakdownSegments = [
        { label: 'Producto', value: costBreakdown.productCost, color: '#0066FF' },
        { label: 'Marketing', value: costBreakdown.cpa, color: '#EF4444' },
        { label: 'Logística', value: logisticaCost, color: '#F59E0B' },
        { label: 'Neto', value: costBreakdown.netMargin, color: '#10B981' },
    ];

    const confirmationPct = effectivenessFunnel.totalOrders > 0
        ? (effectivenessFunnel.afterPreCancellation / effectivenessFunnel.totalOrders) * 100
        : 0;

    // Volume row for the selected quantity
    const volumeActive = volumeStrategy.enabled && suggestedPrice > 0;
    const volumeRow = volumeActive
        ? volumeStrategy.priceTable.find((row) => row.quantity === maxUnits)
        : null;

    return (
        <div
            style={{
                position: 'sticky',
                top: '92px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            {/* ─── Precio de Venta Sugerido (1 unidad base) ─── */}
            <div
                style={{
                    flex: 1,
                    minHeight: '239.5px',
                    padding: '28px 24px 24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(0,102,255,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                <p style={{
                    fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px',
                }}>
                    Precio de Venta Sugerido
                </p>
                <h2 style={{
                    fontSize: '42px', fontWeight: 700, color: '#fff',
                    letterSpacing: '-1px', lineHeight: 1, marginBottom: '20px',
                }}>
                    {formatCurrency(suggestedPrice)}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{
                        padding: '12px', borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                            Utilidad Neta / Venta
                        </p>
                        <p style={{
                            fontSize: '18px', fontWeight: 700,
                            color: netProfitPerSale > 0 ? '#4ADE80' : '#FCA5A5',
                        }}>
                            {formatCurrency(netProfitPerSale)}
                        </p>
                    </div>
                    <div style={{
                        padding: '12px', borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                            Efectividad Final
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                            {finalEffectivenessPercent}%
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Volume Strategy Block (conditional) ─── */}
            {volumeActive && volumeRow && (
                <div
                    style={{
                        padding: '18px 20px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: '0 6px 20px rgba(5,150,105,0.25)',
                        textAlign: 'center',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        marginBottom: '10px',
                    }}>
                        <Package size={14} color="rgba(255,255,255,0.7)" />
                        <p style={{
                            fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            Precio por {maxUnits} unidades
                        </p>
                    </div>

                    {/* Total price */}
                    <h3 style={{
                        fontSize: '32px', fontWeight: 700, color: '#fff',
                        letterSpacing: '-0.5px', lineHeight: 1, marginBottom: '14px',
                    }}>
                        {formatCurrency(volumeRow.totalPrice)}
                    </h3>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div style={{
                            padding: '10px 8px', borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.12)',
                        }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>
                                Por unidad
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                                {formatCurrency(volumeRow.pricePerUnit)}
                            </p>
                        </div>
                        <div style={{
                            padding: '10px 8px', borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.12)',
                        }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>
                                Ahorro total
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#A7F3D0' }}>
                                {formatCurrency(volumeRow.savingsPerUnit * maxUnits)}
                            </p>
                        </div>
                        <div style={{
                            padding: '10px 8px', borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.12)',
                        }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>
                                Rentabilidad
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#A7F3D0' }}>
                                {formatCurrency(volumeRow.totalProfit)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Costos Logísticos + Embudo ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Costos Logísticos — raw per-event values */}
                <div style={{
                    padding: '16px', borderRadius: '12px',
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                }}>
                    <p style={{
                        fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px',
                    }}>
                        Costos Logísticos Reales
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Flete + Recaudo</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatCurrency(rawFleteRecaudo)}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#EF4444', fontStyle: 'italic' }}>Pérdida por Devolución</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>
                            -{formatCurrency(rawReturnLoss)}
                        </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                        *Costo promedio de logística por cada pedido enviado exitosamente.
                    </p>
                </div>

                {/* Embudo */}
                <div style={{
                    padding: '16px', borderRadius: '12px',
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                }}>
                    <p style={{
                        fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px',
                    }}>
                        Embudo de Efectividad
                    </p>
                    <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Confirmación (No Cancelados)</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{confirmationPct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${confirmationPct}%`, backgroundColor: '#F59E0B', borderRadius: '3px', transition: 'width 400ms ease' }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Entrega Final (No Devueltos)</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{finalEffectivenessPercent}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${finalEffectivenessPercent}%`, backgroundColor: '#10B981', borderRadius: '3px', transition: 'width 400ms ease' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Desglose del Precio de Venta (%) ─── */}
            <div style={{
                padding: '16px 20px', borderRadius: '12px',
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
            }}>
                <p style={{
                    fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px',
                }}>
                    Desglose del Precio de Venta (%)
                </p>

                <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                    {breakdownSegments.map((seg) => {
                        const pct = suggestedPrice > 0 ? (seg.value / suggestedPrice) * 100 : 0;
                        if (pct <= 0) return null;
                        return (
                            <div
                                key={seg.label}
                                style={{
                                    width: `${pct}%`, backgroundColor: seg.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 700, color: '#fff',
                                    transition: 'width 400ms ease', minWidth: pct > 5 ? '32px' : '0',
                                }}
                            >
                                {pct > 8 && seg.label}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {breakdownSegments.map((seg) => {
                        const pct = suggestedPrice > 0 ? (seg.value / suggestedPrice) * 100 : 0;
                        return (
                            <div key={seg.label} style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: seg.color }}>{seg.label.toUpperCase()}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{pct.toFixed(0)}%</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
