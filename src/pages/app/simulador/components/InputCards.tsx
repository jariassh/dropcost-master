import type { SimulatorInputs } from '@/types/simulator';
import { Package, Truck, Megaphone, Info, Sparkles } from 'lucide-react';

interface InputCardsProps {
    inputs: SimulatorInputs;
    onChange: (newInputs: SimulatorInputs) => void;
}

export function InputCards({ inputs, onChange }: InputCardsProps) {
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
                    label="Costo Unitario (USD)"
                    value={inputs.productCost}
                    onChange={(v) => handleInputChange('productCost', v)}
                    hint="Precio de compra al proveedor"
                />
                <InputField
                    label="Margen Objetivo (%)"
                    value={inputs.desiredMarginPercent}
                    onChange={(v) => handleInputChange('desiredMarginPercent', v)}
                    hint="Porcentaje de ganancia deseado"
                    suffix="%"
                />
                <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Nivel de Ambición
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['Suave', 'Moderado', 'Ambicioso'].map(level => {
                            const isSelected = (level === 'Suave' && inputs.desiredMarginPercent <= 25) ||
                                (level === 'Moderado' && inputs.desiredMarginPercent > 25 && inputs.desiredMarginPercent <= 42) ||
                                (level === 'Ambicioso' && inputs.desiredMarginPercent > 42);

                            // Map levels to target margins if they click
                            const setLevel = (l: string) => {
                                let target = inputs.desiredMarginPercent;
                                if (l === 'Suave') target = 20;
                                if (l === 'Moderado') target = 35;
                                if (l === 'Ambicioso') target = 50;
                                handleInputChange('desiredMarginPercent', target);
                            };

                            return (
                                <button
                                    key={level}
                                    onClick={() => setLevel(level)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 4px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                                        backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {level}
                                </button>
                            );
                        })}
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
                    label="CPA Esperado (USD)"
                    value={inputs.averageCpa}
                    onChange={(v) => handleInputChange('averageCpa', v)}
                    hint="Costo máximo por adquisición"
                />
                <InputField
                    label="% de Cancelación"
                    value={inputs.preCancellationPercent}
                    onChange={(v) => handleInputChange('preCancellationPercent', v)}
                    hint="Antes del envío"
                    suffix="%"
                />
                <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    border: '1px solid var(--card-border)'
                }}>
                    <Sparkles size={14} color="var(--color-error)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontSize: '10px', color: 'var(--color-error)', fontWeight: 500, lineHeight: '1.5' }}>
                        El CPA se puede optimizar configurando correctamente en Meta. <strong>Consulta a Drop Analyst</strong> para recibir una guía paso a paso.
                    </span>
                </div>
            </Card>

            {/* Card 🚚 LOGÍSTICA */}
            <Card
                title="Logística de Envío"
                icon={<Truck size={18} />}
                color="var(--color-success)"
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField
                        label="Flete (USD)"
                        value={inputs.shippingCost}
                        onChange={(v) => handleInputChange('shippingCost', v)}
                        hint="Envío promedio"
                    />
                    <InputField
                        label="Recaudo (%)"
                        value={inputs.collectionCommissionPercent}
                        onChange={(v) => handleInputChange('collectionCommissionPercent', v)}
                        hint="Comisión COD"
                        suffix="%"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField
                        label="% Devolución"
                        value={inputs.returnRatePercent}
                        onChange={(v) => handleInputChange('returnRatePercent', v)}
                        hint="Efectividad"
                        suffix="%"
                    />
                    <InputField
                        label="Otros (USD)"
                        value={inputs.otherExpenses}
                        onChange={(v) => handleInputChange('otherExpenses', v)}
                        hint="Costos extra"
                    />
                </div>

                <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={12} color="var(--color-success)" />
                    <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: 500 }}>
                        Recuerda: El transportista cobra flete de retorno (50%).
                    </span>
                </div>
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
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    backgroundColor: `${color}15`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, value, onChange, hint, suffix }: { label: string; value: number; onChange: (v: number) => void; hint: string; suffix?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
                />
                {suffix && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {suffix}
                    </span>
                )}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>{hint}</span>
        </div>
    );
}
