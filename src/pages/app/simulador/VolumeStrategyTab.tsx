/**
 * VolumeStrategyTab - Volume pricing table with margin slider + unit count selector.
 * Shows inside a card below the main grid when toggle is active.
 */
import { Slider } from '@/components/common';
import { calculateVolumeTable } from './simulatorCalculations';
import type { VolumeStrategy } from '@/types/simulator';
import { TrendingDown, Info } from 'lucide-react';

interface VolumeStrategyTabProps {
    suggestedPrice: number;
    supplierCost: number;
    originalMargin: number;
    strategy: VolumeStrategy;
    onChange: (strategy: VolumeStrategy) => void;
    maxUnits: number;
    onMaxUnitsChange: (n: number) => void;
}

const UNIT_OPTIONS = [3, 5, 7, 10, 15, 20];

export function VolumeStrategyTab({
    suggestedPrice,
    supplierCost,
    originalMargin,
    strategy,
    onChange,
    maxUnits,
    onMaxUnitsChange,
}: VolumeStrategyTabProps) {
    const hasPrice = suggestedPrice > 0;

    function handleMarginChange(marginPercent: number) {
        const priceTable = hasPrice
            ? calculateVolumeTable(suggestedPrice, supplierCost, originalMargin, marginPercent, maxUnits)
            : [];
        onChange({ ...strategy, marginPercent, priceTable });
    }

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    if (!hasPrice) {
        return (
            <div style={{ padding: '32px', textAlign: 'center' }}>
                <Info size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Ingresa los datos del producto para configurar la estrategia de volumen
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                    📊 Tabla de Precios en Tiempo Real
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Precios decrecientes por volumen. Ajusta el margen y la cantidad máxima.
                </p>
            </div>

            {/* Controls row: margin slider + unit count */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '20px',
                    alignItems: 'end',
                    marginBottom: '24px',
                }}
                className="volume-controls"
            >
                <Slider
                    label="¿Qué % de tu margen asignas a unidades 2+?"
                    min={10}
                    max={100}
                    value={strategy.marginPercent}
                    onChange={handleMarginChange}
                    suffix="%"
                    minLabel="10% Mín"
                    midLabel="50% Recomendado"
                    maxLabel="100% Sin ahorro"
                />

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Unidades máx.
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {UNIT_OPTIONS.map((n) => (
                            <button
                                key={n}
                                onClick={() => onMaxUnitsChange(n)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                    backgroundColor: maxUnits === n ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                    color: maxUnits === n ? '#fff' : 'var(--text-secondary)',
                                    boxShadow: maxUnits === n ? '0 2px 8px rgba(0,102,255,0.3)' : 'none',
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Price table */}
            {strategy.priceTable.length > 0 && (
                <div
                    style={{
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                    }}
                >
                    {strategy.priceTable.map((row, i) => (
                        <div
                            key={row.quantity}
                            style={{
                                padding: '14px 20px',
                                borderBottom: i < strategy.priceTable.length - 1 ? '1px solid var(--border-color)' : 'none',
                                transition: 'background-color 150ms',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                                    {row.quantity} {row.quantity === 1 ? 'UNIDAD' : 'UNIDADES'}
                                </span>
                                <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '14px' }}>
                                    {formatCurrency(row.totalProfit)} ✅
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span>Total: {formatCurrency(row.totalPrice)}</span>
                                {row.quantity > 1 && (
                                    <>
                                        <span>Por unidad: {formatCurrency(row.pricePerUnit)}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                                            <TrendingDown size={12} />
                                            Ahorro: {formatCurrency(row.savingsPerUnit)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    <div
                        style={{
                            padding: '12px 20px',
                            borderTop: '1px solid var(--border-color)',
                            backgroundColor: 'var(--color-primary-light, rgba(0,102,255,0.08))',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        💡 Esta tabla se guarda con tu costeo y puedes usarla después en Ofertas
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .volume-controls { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
