/**
 * WizardStep3Builder - Paso 3: Builder dinámico según estrategia.
 * Descuento: slider %, Bundle: qty + slider, Obsequio: tipo + costo + descripción.
 */
import { Slider, Input, Select } from '@/components/common';
import { calculateDiscount, calculateBundle, calculateGift } from './ofertasCalculations';
import type { StrategyType, DiscountConfig, BundleConfig, GiftConfig, GiftType } from '@/types/ofertas';
import type { SavedCosteo } from '@/types/simulator';
import { AlertTriangle, TrendingDown } from 'lucide-react';

interface WizardStep3Props {
    strategyType: StrategyType;
    costeo: SavedCosteo;
    discountConfig: DiscountConfig;
    bundleConfig: BundleConfig;
    giftConfig: GiftConfig;
    onDiscountChange: (config: DiscountConfig) => void;
    onBundleChange: (config: BundleConfig) => void;
    onGiftChange: (config: GiftConfig) => void;
}

const GIFT_OPTIONS = [
    { value: 'muestra_gratis', label: 'Muestra gratis' },
    { value: 'complemento', label: 'Complemento' },
    { value: 'otro_producto', label: 'Otro producto' },
    { value: 'cupon_descuento', label: 'Cupón descuento' },
];

export function WizardStep3Builder({
    strategyType,
    costeo,
    discountConfig,
    bundleConfig,
    giftConfig,
    onDiscountChange,
    onBundleChange,
    onGiftChange,
}: WizardStep3Props) {
    const price = costeo.results_json?.suggestedPrice ?? 0;
    const profit = costeo.results_json?.netProfitPerSale ?? 0;
    const supplierCost = costeo.inputs_json?.productCost ?? 0;

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // ─── Descuento ───
    if (strategyType === 'descuento') {
        const result = calculateDiscount(price, profit, discountConfig.discountPercent);

        function handleDiscountSlider(val: number) {
            const res = calculateDiscount(price, profit, val);
            onDiscountChange({
                discountPercent: val,
                offerPrice: res.offerPrice,
                newProfit: res.newProfit,
                newMarginPercent: res.newMarginPercent,
            });
        }

        return (
            <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    💰 Configura tu Descuento
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Precio base: {formatCurrency(price)} · Ganancia actual: {formatCurrency(profit)}
                </p>

                <Slider
                    label="Porcentaje de descuento"
                    min={0}
                    max={50}
                    value={discountConfig.discountPercent}
                    onChange={handleDiscountSlider}
                    suffix="%"
                    minLabel="0%"
                    midLabel="25%"
                    maxLabel="50% Máx"
                />

                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <ResultBox label="Precio oferta" value={formatCurrency(result.offerPrice)} />
                    <ResultBox label="Descuento" value={`-${formatCurrency(result.discountAmount)}`} color="var(--color-error)" />
                    <ResultBox
                        label="Nueva ganancia"
                        value={formatCurrency(result.newProfit)}
                        color={result.newProfit > 0 ? 'var(--color-success)' : 'var(--color-error)'}
                    />
                    <ResultBox
                        label="Nuevo margen"
                        value={`${result.newMarginPercent}%`}
                        color={result.newMarginPercent >= 5 ? 'var(--text-primary)' : 'var(--color-error)'}
                    />
                </div>

                {result.isLowMargin && (
                    <Warning message="Margen menor al 5%. Considera un descuento menor o usar Bundle." />
                )}
            </div>
        );
    }

    // ─── Bundle ───
    if (strategyType === 'bundle') {
        const table = calculateBundle(price, supplierCost, profit, bundleConfig.marginPercent, bundleConfig.quantity);

        function handleMargin(val: number) {
            const newTable = calculateBundle(price, supplierCost, profit, val, bundleConfig.quantity);
            onBundleChange({ ...bundleConfig, marginPercent: val, priceTable: newTable });
        }

        function handleQuantity(e: React.ChangeEvent<HTMLInputElement>) {
            const qty = Math.min(10, Math.max(2, parseInt(e.target.value) || 2));
            const newTable = calculateBundle(price, supplierCost, profit, bundleConfig.marginPercent, qty);
            onBundleChange({ ...bundleConfig, quantity: qty, priceTable: newTable });
        }

        return (
            <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    📦 Configura tu Bundle
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Precio unitario: {formatCurrency(price)} · Costo proveedor: {formatCurrency(supplierCost)}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
                    <Input
                        label="Max unidades"
                        type="number"
                        value={bundleConfig.quantity}
                        onChange={handleQuantity}
                        helperText="2-10 unidades"
                    />
                    <Slider
                        label="% margen unidades 2+"
                        min={10}
                        max={100}
                        value={bundleConfig.marginPercent}
                        onChange={handleMargin}
                        suffix="%"
                        minLabel="10% (máx descuento)"
                        maxLabel="100% (sin descuento)"
                    />
                </div>

                {/* Table */}
                <div
                    style={{
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        overflowY: 'auto',
                        maxHeight: '190px',
                    }}
                >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr>
                                {['Uds', 'Total', 'P/U', 'Ahorro/U', 'Tu Ganancia'].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: '10px 12px',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            borderBottom: '1px solid var(--border-color)',
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10,
                                            backgroundColor: 'var(--bg-secondary)',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {table.map((row) => (
                                <tr
                                    key={row.quantity}
                                    style={{ borderBottom: '1px solid var(--border-color)' }}
                                >
                                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                                        {row.quantity}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        {formatCurrency(row.totalPrice)}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        {formatCurrency(row.pricePerUnit)}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-primary)' }}>
                                        {row.savingsPerUnit > 0 && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                <TrendingDown size={10} /> {formatCurrency(row.savingsPerUnit)}
                                            </span>
                                        )}
                                        {row.savingsPerUnit === 0 && '-'}
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>
                                        {formatCurrency(row.totalProfit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // ─── Obsequio ───
    const giftResult = calculateGift(price, profit, giftConfig.giftCost);

    function handleGiftType(val: string) {
        onGiftChange({ ...giftConfig, giftType: val as GiftType });
    }

    function handleGiftCost(e: React.ChangeEvent<HTMLInputElement>) {
        const cost = parseFloat(e.target.value) || 0;
        const res = calculateGift(price, profit, cost);
        onGiftChange({
            ...giftConfig,
            giftCost: cost,
            perceivedValue: res.perceivedValue,
            newProfit: res.newProfit,
        });
    }

    return (
        <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                🎁 Configura tu Obsequio
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Precio: {formatCurrency(price)} · Ganancia actual: {formatCurrency(profit)}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Select
                    label="Tipo de obsequio"
                    options={GIFT_OPTIONS}
                    value={giftConfig.giftType}
                    onChange={handleGiftType}
                />

                <Input
                    label="Costo del obsequio ($)"
                    type="number"
                    value={giftConfig.giftCost || ''}
                    onChange={handleGiftCost}
                    helperText="Lo que te cuesta a ti el regalo"
                    placeholder="Ej: 2000"
                />

                <div>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                        }}
                    >
                        Descripción del obsequio
                    </label>
                    <textarea
                        value={giftConfig.description}
                        onChange={(e) => onGiftChange({ ...giftConfig, description: e.target.value.slice(0, 100) })}
                        placeholder="Ej: Muestra de crema anti-edad de 15ml"
                        maxLength={100}
                        rows={2}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                        }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        {giftConfig.description.length}/100 caracteres
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ResultBox label="Valor percibido" value={formatCurrency(giftResult.perceivedValue)} color="var(--color-primary)" />
                <ResultBox label="Costo regalo" value={`-${formatCurrency(giftResult.giftCost)}`} color="var(--color-error)" />
                <ResultBox
                    label="Nueva ganancia"
                    value={formatCurrency(giftResult.newProfit)}
                    color={giftResult.newProfit > 0 ? 'var(--color-success)' : 'var(--color-error)'}
                />
                <ResultBox
                    label="Reducción ganancia"
                    value={formatCurrency(giftResult.profitReduction)}
                    color="var(--text-secondary)"
                />
            </div>

            {giftResult.exceedsMargin && (
                <Warning message="El costo del obsequio supera tu margen. Perderías dinero con esta oferta." />
            )}
        </div>
    );
}

function ResultBox({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div
            style={{
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                textAlign: 'center',
            }}
        >
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</p>
        </div>
    );
}

function Warning({ message }: { message: string }) {
    return (
        <div
            style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--color-error)',
            }}
        >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            {message}
        </div>
    );
}
