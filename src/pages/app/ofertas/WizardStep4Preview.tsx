/**
 * WizardStep4Preview - Paso 4: Preview y confirmación de la oferta.
 */
import type { StrategyType, DiscountConfig, BundleConfig, GiftConfig } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import type { SavedCosteo } from '@/types/simulator';
import { TrendingDown, Check } from 'lucide-react';

interface WizardStep4Props {
    strategyType: StrategyType;
    costeo: SavedCosteo;
    discountConfig: DiscountConfig;
    bundleConfig: BundleConfig;
    giftConfig: GiftConfig;
}

export function WizardStep4Preview({
    strategyType,
    costeo,
    discountConfig,
    bundleConfig,
    giftConfig,
}: WizardStep4Props) {
    const strategy = STRATEGIES.find((s) => s.type === strategyType)!;
    const price = costeo.results.suggestedPrice;
    const profit = costeo.results.netProfitPerSale;

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (
        <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Vista previa de tu oferta
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Revisa los detalles antes de activar
            </p>

            <div
                style={{
                    padding: '24px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '28px' }}>{strategy.icon}</span>
                    <div>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {costeo.productName}
                        </p>
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: 'rgba(0,102,255,0.1)',
                                color: 'var(--color-primary)',
                            }}
                        >
                            {strategy.label}
                        </span>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    {/* Descuento preview */}
                    {strategyType === 'descuento' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <PreviewItem label="Precio original" value={formatCurrency(price)} />
                            <PreviewItem label="Descuento" value={`${discountConfig.discountPercent}%`} color="var(--color-error)" />
                            <PreviewItem label="Precio oferta" value={formatCurrency(discountConfig.offerPrice)} highlight />
                            <PreviewItem label="Ganancia estimada" value={formatCurrency(discountConfig.newProfit)} color={discountConfig.newProfit > 0 ? 'var(--color-success)' : 'var(--color-error)'} />
                        </div>
                    )}

                    {/* Bundle preview */}
                    {strategyType === 'bundle' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <PreviewItem label="Max unidades" value={`${bundleConfig.quantity}`} />
                                <PreviewItem label="% margen unidades 2+" value={`${bundleConfig.marginPercent}%`} />
                            </div>
                            <div
                                style={{
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    overflow: 'hidden',
                                }}
                            >
                                {bundleConfig.priceTable.map((row) => (
                                    <div
                                        key={row.quantity}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '10px 14px',
                                            borderBottom: '1px solid var(--border-color)',
                                            fontSize: '13px',
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{row.quantity} ud{row.quantity > 1 ? 's' : ''}</span>
                                        <span>{formatCurrency(row.totalPrice)}</span>
                                        {row.savingsPerUnit > 0 && (
                                            <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                <TrendingDown size={10} /> -{formatCurrency(row.savingsPerUnit)}/ud
                                            </span>
                                        )}
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                            {formatCurrency(row.totalProfit)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Obsequio preview */}
                    {strategyType === 'obsequio' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <PreviewItem label="Tipo" value={giftConfig.giftType.replace('_', ' ')} />
                            <PreviewItem label="Costo regalo" value={formatCurrency(giftConfig.giftCost)} color="var(--color-error)" />
                            <PreviewItem label="Valor percibido" value={formatCurrency(giftConfig.perceivedValue)} color="var(--color-primary)" highlight />
                            <PreviewItem label="Ganancia final" value={formatCurrency(giftConfig.newProfit)} color={giftConfig.newProfit > 0 ? 'var(--color-success)' : 'var(--color-error)'} />
                            {giftConfig.description && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <PreviewItem label="Descripción" value={giftConfig.description} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div
                    style={{
                        marginTop: '20px',
                        padding: '14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                        border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>
                            Oferta lista para activar
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Ganancia original: {formatCurrency(profit)} → Ganancia estimada:{' '}
                            {formatCurrency(
                                strategyType === 'descuento' ? discountConfig.newProfit
                                    : strategyType === 'bundle' ? (bundleConfig.priceTable[bundleConfig.priceTable.length - 1]?.totalProfit ?? profit)
                                        : giftConfig.newProfit
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PreviewItem({ label, value, color, highlight }: { label: string; value: string; color?: string; highlight?: boolean }) {
    return (
        <div
            style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: highlight ? 'rgba(0,102,255,0.05)' : 'transparent',
            }}
        >
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{label}</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</p>
        </div>
    );
}
