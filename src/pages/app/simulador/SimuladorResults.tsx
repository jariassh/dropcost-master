import { useState, useEffect } from 'react';
import type { SimulatorResults as Results, VolumeStrategy } from '@/types/simulator';
import { Package, RotateCcw, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip } from '@/components/common';

interface SimuladorResultsProps {
    results: Results | null;
    shippingCost: number;
    collectionCommissionPercent: number;
    volumeStrategy: VolumeStrategy;
    maxUnits: number;
    manualPrice: number | null;
    onManualPriceChange: (val: number | null) => void;
}

export function SimuladorResults({
    results,
    shippingCost,
    collectionCommissionPercent,
    volumeStrategy,
    maxUnits,
    manualPrice,
    onManualPriceChange
}: SimuladorResultsProps) {
    const [inputValue, setInputValue] = useState('');

    const formatCurrency = (val: number) =>
        '$' + Math.round(val).toLocaleString('es-CO');

    const r = results ?? {
        suggestedPrice: 0,
        originalSuggestedPrice: 0,
        netProfitPerSale: 0,
        finalEffectivenessPercent: 0,
        costBreakdown: { productCost: 0, shippingCost: 0, collectionCommission: 0, returnCost: 0, otherExpenses: 0, cpa: 0, netMargin: 0, totalPrice: 0 },
        effectivenessFunnel: { totalOrders: 100, afterPreCancellation: 0, afterReturns: 0, effectiveOrders: 0 },
    };

    const { suggestedPrice, originalSuggestedPrice = suggestedPrice, netProfitPerSale, finalEffectivenessPercent, costBreakdown, effectivenessFunnel } = r;

    // Sync input with results
    useEffect(() => {
        if (manualPrice === null) {
            setInputValue('');
        } else {
            setInputValue(Math.round(manualPrice).toString());
        }
    }, [manualPrice]);

    // Raw display values (per-event, not amortized)
    const rawCommission = suggestedPrice * (collectionCommissionPercent / 100);
    const rawFleteRecaudo = shippingCost + rawCommission;
    const rawReturnLoss = shippingCost * 1.5;

    // Delta calculation
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
            {/* ─── Precio de Venta (Principal con Override) ─── */}
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
                    position: 'relative',
                }}
            >
                {/* Badge Sugerido / Reset — Solo aparece si hay override */}
                <div style={{
                    height: '24px', // Altura fija para evitar saltos de layout
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
                            <div style={{ width: '16px' }}>
                                <Tooltip
                                    position="top"
                                    content="Calculado sumando costos, CPA, fletes y comisiones, integrando el riesgo de devolución para proteger tu utilidad neta."
                                >
                                    <Info
                                        size={14}
                                        color="rgba(255,255,255,0.5)"
                                        style={{ cursor: 'help', display: 'block' }}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Price Display / Input */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    {hasOverride && (
                        <p style={{
                            fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px',
                            position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)'
                        }}>
                            Precio Personalizado
                        </p>
                    )}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}>
                        <span style={{ fontSize: '32px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>$</span>
                        <input
                            type="text"
                            value={hasOverride ? inputValue : Math.round(suggestedPrice).toLocaleString('es-CO')}
                            placeholder="0"
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                // Si es el primer número que escribe después de entrar al modo manual
                                // y el contenido es exactamente el sugerido, limpiamos y dejamos solo la nueva tecla
                                if (!hasOverride && /^\d$/.test(e.key)) {
                                    e.preventDefault();
                                    const val = e.key;
                                    setInputValue(val);
                                    onManualPriceChange(parseInt(val));
                                }
                            }}
                            onFocus={(e) => {
                                const target = e.target;
                                if (!hasOverride) {
                                    setInputValue(Math.round(suggestedPrice).toString());
                                    onManualPriceChange(Math.round(suggestedPrice));
                                }
                                // Pequeño timeout para asegurar que el valor ya esté en el DOM antes de seleccionar
                                setTimeout(() => target.select(), 10);
                            }}
                            style={{
                                background: 'transparent', border: 'none',
                                outline: 'none', color: '#fff',
                                fontSize: '48px', fontWeight: 700,
                                textAlign: 'center', width: '220px',
                                letterSpacing: '-1.5px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                cursor: 'text',
                            }}
                        />
                    </div>

                    {/* Delta indicator */}
                    {hasOverride && delta !== 0 && (
                        <div style={{
                            position: 'absolute', bottom: '-12px', left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            backgroundColor: delta > 0 ? '#059669' : '#DC2626',
                            color: '#fff', padding: '2px 8px', borderRadius: '12px',
                            fontSize: '11px', fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            whiteSpace: 'nowrap',
                            animation: 'slideUp 200ms ease-out',
                        }}>
                            {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {delta > 0 ? '+' : ''}{formatCurrency(delta)} ({deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
                        </div>
                    )}
                </div>

                {/* Sub-results row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                    <div style={{
                        padding: '12px', borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
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
                        padding: '12px', borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
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
