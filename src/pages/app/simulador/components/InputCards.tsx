import { useState, useEffect } from "react";
import type { SimulatorInputs } from '@/types/simulator';
import { Package, Truck, Megaphone, Info, Sparkles, ChevronDown } from 'lucide-react';

interface InputCardsProps {
    inputs: SimulatorInputs & { country?: string };
    currency?: string;
    country?: string;
    onChange: (newInputs: SimulatorInputs) => void;
}

export function InputCards({ inputs, onChange, currency = "USD", country = "US" }: InputCardsProps) {
    const handleInputChange = (field: keyof SimulatorInputs, value: any) => {
        onChange({ ...inputs, [field]: value });
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '0'
        }}>
            {/* Card 📦 PRODUCTO */}
            <Card
                title="Configuración de Producto"
                icon={<Package size={18} />}
                color="var(--color-primary)"
            >
                <InputField
                    label={`Costo Unitario (${currency})`} tooltip="Costo que se paga al proveedor por cada unidad del producto."
                    value={inputs.productCost}
                    onChange={(v) => handleInputChange('productCost', v)}
                    hint="Precio de compra al proveedor"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField
                        label="Margen (%)" tooltip="Porcentaje de ganancia deseado."
                        value={inputs.desiredMarginPercent}
                        onChange={(v) => handleInputChange('desiredMarginPercent', v)}
                        hint="Ganancia deseada"
                        suffix="%"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0, fontFamily: 'var(--font-body)' }}>
                                Ambición
                            </label>
                            <InfoTooltip text="Nivel de agresividad en el precio." />
                        </div>
                        <div style={{ position: 'relative', height: '40px' }}>
                            <select
                                value={inputs.desiredMarginPercent <= 25 ? 'Suave' : inputs.desiredMarginPercent <= 42 ? 'Moderado' : 'Ambicioso'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'Suave') handleInputChange('desiredMarginPercent', 20);
                                    if (val === 'Moderado') handleInputChange('desiredMarginPercent', 35);
                                    if (val === 'Ambicioso') handleInputChange('desiredMarginPercent', 50);
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '10px',
                                    padding: '0 32px 0 12px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: 'var(--color-primary)',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: 'var(--font-headings)'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
                            >
                                <option value="Suave">Suave (20%)</option>
                                <option value="Moderado">Moderado (35%)</option>
                                <option value="Ambicioso">Ambicioso (50%)</option>
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-primary)' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Ajuste rápido</span>
                    </div>
                </div>
            </Card>

            {/* Card 📢 PUBLICIDAD (Middle Card) */}
            <Card
                title="Configuración Publicidad"
                icon={<Megaphone size={18} />}
                color="var(--color-error)"
            >
                <InputField
                    label={`CPA Esperado (${currency})`} tooltip="Costo por Adquisición promedio en Meta Ads. En Colombia suele estar entre $15.000 y $25.000 COP."
                    value={inputs.averageCpa}
                    onChange={(v) => handleInputChange('averageCpa', v)}
                    hint="Costo máximo por adquisición"
                />
                <InputField
                    label="% de Cancelación" tooltip="Porcentaje de pedidos que se cancelan antes del envío. En COD normalmente ronda el 20%."
                    value={inputs.preCancellationPercent}
                    onChange={(v) => handleInputChange('preCancellationPercent', v)}
                    hint="Antes del envío"
                    suffix="%"
                />
                <div style={{ height: '24px' }} /> {/* Espaciador para igualar tamaño */}
            </Card>

            {/* Card 🚚 LOGÍSTICA */}
            <Card
                title="Logística de Envío"
                icon={<Truck size={18} />}
                color="var(--color-success)"
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField
                        label={`Flete (${currency})`} tooltip="Promedio del flete cobrado por las transportadoras. En Colombia suele estar entre $18.000 y $25.000 COP."
                        value={inputs.shippingCost}
                        onChange={(v) => handleInputChange('shippingCost', v)}
                        hint="Envío promedio"
                    />
                    <InputField
                        label="Recaudo (%)" tooltip="Porcentaje que las transportadoras cobran por recaudar dinero COD. En Colombia varía entre 1% y 3%."
                        value={inputs.collectionCommissionPercent}
                        onChange={(v) => handleInputChange('collectionCommissionPercent', v)}
                        hint="Comisión COD"
                        suffix="%"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField
                        label="% Devolución" tooltip="Porcentaje de devoluciones sobre pedidos enviados. En Colombia suele ser entre 15% y 20%."
                        value={inputs.returnRatePercent}
                        onChange={(v) => handleInputChange('returnRatePercent', v)}
                        hint="Efectividad"
                        suffix="%"
                    />
                    <InputField
                        label={`Otros (${currency})`} tooltip="Gastos operacionales: comisiones de plataforma, empaques, seguros de envío, etc."
                        value={inputs.otherExpenses}
                        onChange={(v) => handleInputChange('otherExpenses', v)}
                        hint="Costos extra"
                    />
                </div>
                <div style={{ height: '24px' }} /> {/* Espaciador para igualar tamaño */}
            </Card>
        </div>
    );
}

function Card({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid var(--card-border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    backgroundColor: `${color}15`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, value, onChange, hint, suffix, tooltip }: { label: string; value: number; onChange: (v: number) => void; hint: string; suffix?: string; tooltip?: string }) {
    const formatValue = (num: number) => {
        if (num === 0) return '';
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts.length > 1 ? `${parts[0]},${parts[1].padEnd(2, '0').slice(0, 2)}` : parts[0];
    };

    const [displayValue, setDisplayValue] = useState(formatValue(value));

    // Sincronizar con cambios externos (e.g. reseteos o cambios en otros campos)
    useEffect(() => {
        setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // Solo permitir dígitos, puntos y comas
        val = val.replace(/[^\d.,]/g, '');

        // Normalizar comas y puntos: tratamos ambos como decimales para ser flexibles
        // pero mostramos punto como miles y coma como decimal
        const cleanVal = val.replace(/\./g, '').replace(',', '.');
        const numeric = parseFloat(cleanVal) || 0;

        // Formateo visual inmediato
        const parts = val.replace(/\./g, '').split(',');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const formatted = parts.length > 1 ? `${parts[0]},${parts[1].slice(0, 2)}` : parts[0];

        setDisplayValue(formatted);
        onChange(numeric);
    };

    const handleBlur = () => {
        // Al salir, aseguramos los 2 decimales fijos si hay valor
        if (value > 0) {
            setDisplayValue(formatValue(value));
        } else {
            setDisplayValue('');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0, fontFamily: 'var(--font-body)' }}>
                    {label}
                </label>
                {tooltip && <InfoTooltip text={tooltip} />}
            </div>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0,00"
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all 0.2s',
                        fontFamily: 'var(--font-headings)'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                />
                {suffix && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {suffix}
                    </span>
                )}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{hint}</span>
        </div>
    );
}

function InfoTooltip({ text }: { text: string }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <span onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Info size={12} style={{ color: isHovered ? 'var(--color-primary)' : 'var(--text-tertiary)', cursor: 'help' }} />
            {isHovered && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)', backgroundColor: '#1E293B', color: 'white', padding: '10px 14px', borderRadius: '8px', width: '220px', fontSize: '12px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-body)' }}>
                    {text}
                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1E293B' }} />
                </div>
            )}
        </span>
    );
}