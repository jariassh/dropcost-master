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
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Revisa los detalles antes de activar
            </p>

            <div
                style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
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

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <PreviewItem label="Max unidades" value={`${bundleConfig.quantity}`} />
                                <PreviewItem label="Beneficio cliente" value={`Hasta ${bundleConfig.marginPercent}% OFF 2+ uds`} highlight />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {/* Min purchase */}
                                <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Compra Mínima (1 ud)</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Precio:</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(price)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ganancia:</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(profit)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Max purchase */}
                                <div style={{ padding: '12px', border: '1px solid var(--color-primary)', borderRadius: '8px', backgroundColor: 'rgba(0,102,255,0.03)' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Mejor Oferta ({bundleConfig.quantity} uds)</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Precio/u:</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                                {formatCurrency(bundleConfig.priceTable[bundleConfig.priceTable.length - 1]?.pricePerUnit || 0)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ganancia Total:</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>
                                                {formatCurrency(bundleConfig.priceTable[bundleConfig.priceTable.length - 1]?.totalProfit || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
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
                        marginTop: '12px',
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
