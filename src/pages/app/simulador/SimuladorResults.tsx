import { useState, useEffect } from 'react';
import type { SimulatorResults as Results, VolumeStrategy } from '@/types/simulator';
import { Package, RotateCcw, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip } from '@/components/common';

interface SimuladorResultsProps {
    results: Results | null;
    volumeResults: Results | null; // New
    shippingCost: number;
    collectionCommissionPercent: number;
    volumeStrategy: VolumeStrategy;
    maxUnits: number;
    manualPrice: number | null;
    onManualPriceChange: (val: number | null) => void;
    manualVolumePrice: number | null; // New
    onManualVolumePriceChange: (val: number | null) => void; // New
}

export function SimuladorResults({
    results,
    volumeResults,
    shippingCost,
    collectionCommissionPercent,
    volumeStrategy,
    maxUnits,
    manualPrice,
    onManualPriceChange,
    manualVolumePrice,
    onManualVolumePriceChange,
}: SimuladorResultsProps) {
    const [inputValue, setInputValue] = useState('');
    const [volumeInputValue, setVolumeInputValue] = useState('');

    const formatCurrency = (val: number) =>
        '$' + Math.round(val).toLocaleString('es-CO');

    // Determinamos qué resultados mostrar en el desglose
    // Si la estrategia de volumen está activa, mostramos los resultados de volumen
    const isVolumeActive = volumeStrategy.enabled && maxUnits > 1;
    const currentResults = (isVolumeActive && volumeResults) ? volumeResults : results;

    const r = currentResults ?? {
        suggestedPrice: 0,
        originalSuggestedPrice: 0,
        netProfitPerSale: 0,
        finalEffectivenessPercent: 0,
        costBreakdown: { productCost: 0, shippingCost: 0, collectionCommission: 0, returnCost: 0, otherExpenses: 0, cpa: 0, netMargin: 0, totalPrice: 0 },
        effectivenessFunnel: { totalOrders: 100, afterPreCancellation: 0, afterReturns: 0, effectiveOrders: 0 },
    };

    const { suggestedPrice, originalSuggestedPrice = suggestedPrice, netProfitPerSale, finalEffectivenessPercent, costBreakdown, effectivenessFunnel } = r;

    // Sync main input with results
    useEffect(() => {
        if (manualPrice === null) {
            setInputValue('');
        } else {
            setInputValue(Math.round(manualPrice).toString());
        }
    }, [manualPrice]);

    // Sync volume input with results
    useEffect(() => {
        if (manualVolumePrice === null) {
            setVolumeInputValue('');
        } else {
            setVolumeInputValue(Math.round(manualVolumePrice).toString());
        }
    }, [manualVolumePrice]);

    // Raw display values (per-event, not amortized)
    const rawCommission = suggestedPrice * (collectionCommissionPercent / 100);
    const rawFleteRecaudo = shippingCost + rawCommission;
    const rawReturnLoss = shippingCost * 1.5;

    // Delta calculation for main price
    const hasOverride = manualPrice !== null;
    const delta = hasOverride ? suggestedPrice - originalSuggestedPrice : 0;
    const deltaPct = originalSuggestedPrice > 0 ? (delta / originalSuggestedPrice) * 100 : 0;

    const handleInputChange = (val: string) => {
        setInputValue(val);
        const num = parseInt(val.replace(/\D/g, ''));
        if (!isNaN(num)) {
            onManualPriceChange(num);
        } else if (val === '') {
            onManualPriceChange(null);
        }
    };

    const handleVolumeInputChange = (val: string) => {
        setVolumeInputValue(val);
        const num = parseInt(val.replace(/\D/g, ''));
        if (!isNaN(num)) {
            onManualVolumePriceChange(num);
        } else if (val === '') {
            onManualVolumePriceChange(null);
        }
    };

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

    // Volume info for the selected quantity
    const volumeRow = (volumeStrategy.enabled && results && results.suggestedPrice > 0)
        ? volumeStrategy.priceTable.find((row) => row.quantity === maxUnits)
        : null;

    const hasVolumeOverride = manualVolumePrice !== null;
    const vPrice = volumeResults ? volumeResults.suggestedPrice : (volumeRow ? volumeRow.totalPrice : 0);
    const vOriginalPrice = volumeRow ? volumeRow.totalPrice : vPrice;

    // Profit and savings need to be taken from volumeResults if manual override
    const vProfit = volumeResults ? volumeResults.netProfitPerSale : (volumeRow ? volumeRow.totalProfit : 0);
    const vSavingsTotal = volumeRow ? (volumeRow.savingsPerUnit * maxUnits) : 0;

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
            {/* ─── Precio de Venta (Principal con Override) ─── */}
            <div
                style={{
                    flex: 1,
                    minHeight: '220px',
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(0,102,255,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 300ms ease',
                    opacity: isVolumeActive ? 0.7 : 1,
                    transform: isVolumeActive ? 'scale(0.98)' : 'scale(1)',
                }}
            >
                {/* Badge Sugerido / Reset — Solo aparece si hay override */}
                <div style={{
                    height: '24px',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    marginBottom: '12px',
                }}>
                    {hasOverride ? (
                        <div style={{
                            padding: '4px 10px', borderRadius: '20px',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            fontSize: '10px', fontWeight: 700, color: '#fff',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            animation: 'fadeIn 200ms ease-out',
                        }}>
                            Sugerido: {formatCurrency(originalSuggestedPrice)}
                            <button
                                onClick={() => onManualPriceChange(null)}
                                style={{
                                    background: 'none', border: 'none', padding: 0,
                                    color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                }}
                                title="Volver al precio sugerido"
                            >
                                <RotateCcw size={12} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <p style={{
                                fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                                textTransform: 'uppercase', letterSpacing: '0.12em',
                            }}>
                                Precio de Venta Sugerido
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>$</span>
                        <input
                            type="text"
                            value={hasOverride ? inputValue : Math.round(results?.suggestedPrice ?? 0).toLocaleString('es-CO')}
                            placeholder="0"
                            disabled={isVolumeActive}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onFocus={(e) => {
                                const target = e.target;
                                if (!hasOverride) {
                                    setInputValue(Math.round(results?.suggestedPrice ?? 0).toString());
                                    onManualPriceChange(Math.round(results?.suggestedPrice ?? 0));
                                }
                                setTimeout(() => target.select(), 10);
                            }}
                            style={{
                                background: 'transparent', border: 'none',
                                outline: 'none', color: '#fff',
                                fontSize: '48px', fontWeight: 700,
                                textAlign: 'center', width: '220px',
                                letterSpacing: '-1.5px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                cursor: isVolumeActive ? 'not-allowed' : 'text',
                            }}
                        />
                    </div>

                    {hasOverride && delta !== 0 && !isVolumeActive && (
                        <div style={{
                            position: 'absolute', bottom: '-12px', left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            backgroundColor: delta > 0 ? '#059669' : '#DC2626',
                            color: '#fff', padding: '2px 8px', borderRadius: '12px',
                            fontSize: '11px', fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            animation: 'slideUp 200ms ease-out',
                        }}>
                            {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                    <div style={{
                        padding: '12px', borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                            Utilidad / Venta
                        </p>
                        <p style={{
                            fontSize: '18px', fontWeight: 700,
                            color: (results?.netProfitPerSale ?? 0) > 0 ? '#4ADE80' : '#FCA5A5',
                        }}>
                            {formatCurrency(results?.netProfitPerSale ?? 0)}
                        </p>
                    </div>
                    <div style={{
                        padding: '12px', borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                            Efectividad
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                            {results?.finalEffectivenessPercent ?? 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Volumen Erattegy Block ─── */}
            {isVolumeActive && (
                <div
                    style={{
                        padding: '18px 20px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        boxShadow: '0 6px 20px rgba(5,150,105,0.25)',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 2,
                        animation: 'slideUp 300ms ease-out',
                    }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        marginBottom: '4px',
                    }}>
                        <p style={{
                            fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            Precio por {maxUnits} unidades
                        </p>
                        {hasVolumeOverride && (
                            <button
                                onClick={() => onManualVolumePriceChange(null)}
                                style={{
                                    background: 'none', border: 'none', padding: 0,
                                    color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                <RotateCcw size={12} />
                            </button>
                        )}
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        marginBottom: '14px',
                    }}>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>$</span>
                        <input
                            type="text"
                            value={hasVolumeOverride ? volumeInputValue : Math.round(vPrice).toLocaleString('es-CO')}
                            onChange={(e) => handleVolumeInputChange(e.target.value)}
                            onFocus={(e) => {
                                if (!hasVolumeOverride) {
                                    setVolumeInputValue(Math.round(vPrice).toString());
                                    onManualVolumePriceChange(Math.round(vPrice));
                                }
                                setTimeout(() => e.target.select(), 10);
                            }}
                            style={{
                                background: 'transparent', border: 'none',
                                outline: 'none', color: '#fff',
                                fontSize: '32px', fontWeight: 700,
                                textAlign: 'center', width: '180px',
                                letterSpacing: '-0.5px',
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>Unidad</p>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{formatCurrency(vPrice / maxUnits)}</p>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>Ahorro</p>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#A7F3D0' }}>{formatCurrency(vSavingsTotal)}</p>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>Rentabilidad</p>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#A7F3D0' }}>{formatCurrency(vProfit)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Breakdown Section ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                    padding: '16px', borderRadius: '12px',
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '14px' }}>
                        Logística Real {isVolumeActive ? '(Bundle)' : ''}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Flete + Recaudo</span>
                        <span style={{ fontSize: '15px', fontWeight: 700 }}>{formatCurrency(rawFleteRecaudo)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#EF4444' }}>Devolución</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>-{formatCurrency(rawReturnLoss)}</span>
                    </div>
                </div>

                <div style={{
                    padding: '16px', borderRadius: '12px',
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '14px' }}>
                        Efectividad
                    </p>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Confirmación</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>{confirmationPct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${confirmationPct}%`, backgroundColor: '#F59E0B' }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Entrega Final</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>{finalEffectivenessPercent}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${finalEffectivenessPercent}%`, backgroundColor: '#10B981' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                padding: '16px 20px', borderRadius: '12px',
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
            }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '14px' }}>
                    Desglose {isVolumeActive ? `(${maxUnits} uds)` : '(1 ud)'}
                </p>
                <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                    {breakdownSegments.map((seg) => {
                        const pct = suggestedPrice > 0 ? (seg.value / suggestedPrice) * 100 : 0;
                        if (pct <= 2) return null;
                        return (
                            <div
                                key={seg.label}
                                style={{
                                    width: `${pct}%`, backgroundColor: seg.color,
                                    fontSize: '11px', fontWeight: 700, color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                {pct > 18 ? seg.label : ''}
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {breakdownSegments.map((seg) => (
                        <div key={seg.label}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: seg.color }}>{seg.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{suggestedPrice > 0 ? ((seg.value / suggestedPrice) * 100).toFixed(0) : 0}%</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

