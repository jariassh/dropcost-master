/**
 * SimuladorForm - All input sections visible at once.
 * Layout: [Meta (stacked) | Publicidad (stacked)] → Logística (2×2) → Volumen (full width)
 * Inputs have info tooltip icons on labels.
 * Numeric inputs auto-clear leading zeros on keystroke.
 */
import { useState } from 'react';
import { Input, Slider, Toggle } from '@/components/common';
import type { SimulatorInputs, VolumeStrategy } from '@/types/simulator';
import { Package, Truck, Megaphone, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { calculateVolumeTable } from './simulatorCalculations';

// ─── Tooltip content per field ───
const TOOLTIPS: Record<string, string> = {
    desiredMarginPercent:
        'Porcentaje de ganancia que deseas obtener por venta. En COD un margen saludable oscila entre 20% y 30%.',
    productCost:
        'Costo que se paga al proveedor por cada unidad del producto.',
    shippingCost:
        'Promedio del flete cobrado por las transportadoras. En Colombia suele estar entre $18.000 y $25.000 COP. Calcula promedios mensuales o trimestrales para mayor exactitud.',
    collectionCommissionPercent:
        'Porcentaje que algunas transportadoras cobran por recaudar dinero COD. En Colombia varía entre 1% y 3%. Algunas no lo cobran.',
    returnRatePercent:
        'Porcentaje de devoluciones sobre los pedidos enviados. En Colombia suele ser entre 15% y 20%, varía según la región de envío.',
    otherExpenses:
        'Gastos operacionales: comisiones de plataforma, empaques, seguros de envío, etc.',
    averageCpa:
        'Costo por Adquisición promedio de tus campañas en Meta Ads. En Colombia suele estar entre $15.000 y $25.000 COP.',
    preCancellationPercent:
        'Porcentaje de pedidos que se cancelan antes del envío. En COD normalmente ronda el 20%.',
};

interface SimuladorFormProps {
    inputs: SimulatorInputs;
    onChange: (inputs: SimulatorInputs) => void;
    volumeStrategy: VolumeStrategy;
    onVolumeStrategyChange: (strategy: VolumeStrategy) => void;
    maxUnits: number;
    onMaxUnitsChange: (n: number) => void;
    suggestedPrice: number;
    netProfit: number;
    productCost: number;
}

export function SimuladorForm({
    inputs, onChange,
    volumeStrategy, onVolumeStrategyChange,
    maxUnits, onMaxUnitsChange,
    suggestedPrice, netProfit, productCost,
}: SimuladorFormProps) {
    function handleNumericChange(field: keyof SimulatorInputs) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            if (raw === '' || raw === '-') {
                onChange({ ...inputs, [field]: 0 });
                return;
            }
            const cleaned = raw.replace(/^0+(?=\d)/, '');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) {
                onChange({ ...inputs, [field]: parsed });
                e.target.value = String(parsed);
            }
        };
    }

    const hasPrice = suggestedPrice > 0;

    function handleVolumeToggle(enabled: boolean) {
        const updated = { ...volumeStrategy, enabled };
        if (enabled && hasPrice) {
            updated.priceTable = calculateVolumeTable(
                suggestedPrice, productCost, netProfit,
                volumeStrategy.marginPercent, maxUnits,
            );
        }
        onVolumeStrategyChange(updated);
    }

    function handleMarginChange(marginPercent: number) {
        const priceTable = hasPrice
            ? calculateVolumeTable(suggestedPrice, productCost, netProfit, marginPercent, maxUnits)
            : [];
        onVolumeStrategyChange({ ...volumeStrategy, marginPercent, priceTable });
    }

    function handleMaxUnitsChange(n: number) {
        onMaxUnitsChange(n);
        if (hasPrice && volumeStrategy.enabled) {
            const priceTable = calculateVolumeTable(
                suggestedPrice, productCost, netProfit,
                volumeStrategy.marginPercent, n,
            );
            onVolumeStrategyChange({ ...volumeStrategy, priceTable });
        }
    }

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Only the X-units row (skip 1 ud, already shown in price card)
    const rowN = volumeStrategy.priceTable.find((r) => r.quantity === maxUnits);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ─── Row 1: Meta y Producto (stacked) | Publicidad (stacked) ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="meta-publi-row">
                <FormSection icon={<Package size={16} />} title="Meta y Producto" color="#0066FF">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormInput
                            label="Costo producto ($)"
                            tooltip={TOOLTIPS.productCost}
                            type="number"
                            value={inputs.productCost}
                            onChange={handleNumericChange('productCost')}
                        />
                        <FormInput
                            label="Margen neto deseado (%)"
                            tooltip={TOOLTIPS.desiredMarginPercent}
                            type="number"
                            value={inputs.desiredMarginPercent}
                            onChange={handleNumericChange('desiredMarginPercent')}
                        />
                    </div>
                </FormSection>

                <FormSection icon={<Megaphone size={16} />} title="Publicidad (Meta Ads)" color="#EF4444">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FormInput
                            label="CPA por pedido ($)"
                            tooltip={TOOLTIPS.averageCpa}
                            type="number"
                            value={inputs.averageCpa}
                            onChange={handleNumericChange('averageCpa')}
                        />
                        <FormInput
                            label="Cancelación pre-envío (%)"
                            tooltip={TOOLTIPS.preCancellationPercent}
                            type="number"
                            value={inputs.preCancellationPercent}
                            onChange={handleNumericChange('preCancellationPercent')}
                        />
                    </div>
                </FormSection>
            </div>

            {/* ─── Row 2: Logística y Recaudo (full width, 2×2) ─── */}
            <FormSection icon={<Truck size={16} />} title="Logística y Recaudo" color="#F59E0B">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <FormInput
                        label="Flete base ($)"
                        tooltip={TOOLTIPS.shippingCost}
                        type="number"
                        value={inputs.shippingCost}
                        onChange={handleNumericChange('shippingCost')}
                    />
                    <FormInput
                        label="Comisión recaudo (%)"
                        tooltip={TOOLTIPS.collectionCommissionPercent}
                        type="number"
                        value={inputs.collectionCommissionPercent}
                        onChange={handleNumericChange('collectionCommissionPercent')}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                    <FormInput
                        label="Tasa devolución (%)"
                        tooltip={TOOLTIPS.returnRatePercent}
                        type="number"
                        value={inputs.returnRatePercent}
                        onChange={handleNumericChange('returnRatePercent')}
                    />
                    <FormInput
                        label="Otros (Empaque/Plat)"
                        tooltip={TOOLTIPS.otherExpenses}
                        type="number"
                        value={inputs.otherExpenses}
                        onChange={handleNumericChange('otherExpenses')}
                    />
                </div>
            </FormSection>

            {/* ─── Row 3: Estrategia de Volumen (full width) ─── */}
            <div
                style={{
                    padding: '20px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                }}
            >
                {/* Header: title + toggle */}
                <div
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: volumeStrategy.enabled ? '16px' : '0',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <TrendingUp size={16} />
                        Estrategia de Volumen
                    </div>
                    <Toggle
                        checked={volumeStrategy.enabled}
                        onChange={handleVolumeToggle}
                    />
                </div>

                {volumeStrategy.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Sliders row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="volume-sliders">
                            {/* Margin slider */}
                            <Slider
                                label="Margen unidades 2+"
                                min={10}
                                max={100}
                                value={volumeStrategy.marginPercent}
                                onChange={handleMarginChange}
                                suffix="%"
                                minLabel="10%"
                                midLabel="50%"
                                maxLabel="100%"
                            />

                            {/* Units slider (2–20) */}
                            <Slider
                                label="Unidades"
                                min={2}
                                max={20}
                                value={maxUnits}
                                onChange={handleMaxUnitsChange}
                                suffix=" uds"
                                minLabel="2"
                                midLabel="10"
                                maxLabel="20"
                            />
                        </div>

                        {/* Result: full width below sliders */}
                        {hasPrice && rowN ? (
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '13px',
                                }}
                            >
                                <span style={{ fontWeight: 700 }}>{maxUnits} uds</span>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    {formatCurrency(rowN.totalPrice)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                    <TrendingDown size={12} />
                                    {formatCurrency(rowN.savingsPerUnit * maxUnits)}
                                </span>
                                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                                    {formatCurrency(rowN.totalProfit)}
                                </span>
                            </div>
                        ) : (
                            <div style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                                Ingresa datos para ver resultado
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Responsive */}
            <style>{`
                @media (max-width: 768px) {
                    .meta-publi-row { grid-template-columns: 1fr !important; }
                    .volume-sliders { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}

/* ─── Sub-components ─── */

function FormSection({ icon, title, color, children }: {
    icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
    return (
        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {icon}
                {title}
            </div>
            {children}
        </div>
    );
}

function FormInput({ label, tooltip, ...inputProps }: {
    label: string; tooltip?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {label}
                </span>
                {tooltip && <InfoTooltip text={tooltip} />}
            </div>
            <Input {...inputProps} />
        </div>
    );
}

function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);

    return (
        <span
            style={{ position: 'relative', display: 'inline-flex', cursor: 'help' }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <Info size={14} style={{ color: 'var(--text-tertiary)' }} />
            {show && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        backgroundColor: 'var(--tooltip-bg, #1e293b)',
                        color: '#e2e8f0',
                        width: '240px',
                        zIndex: 50,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        pointerEvents: 'none',
                    }}
                >
                    {text}
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid var(--tooltip-bg, #1e293b)',
                        }}
                    />
                </div>
            )}
        </span>
    );
}
