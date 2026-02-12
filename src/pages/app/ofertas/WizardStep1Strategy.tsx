/**
 * WizardStep1Strategy - Paso 1: Elegir estrategia de oferta.
 * 3 cards seleccionables: Descuento, Bundle (recomendado), Obsequio.
 */
import type { StrategyType } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';

interface WizardStep1Props {
    selected: StrategyType | null;
    onChange: (type: StrategyType) => void;
}

export function WizardStep1Strategy({ selected, onChange }: WizardStep1Props) {
    return (
        <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Elige tu estrategia
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Selecciona el tipo de oferta que quieres crear
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {STRATEGIES.map((s) => {
                    const isSelected = selected === s.type;

                    return (
                        <button
                            key={s.type}
                            onClick={() => onChange(s.type)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '20px',
                                borderRadius: '12px',
                                border: isSelected
                                    ? '2px solid var(--color-primary)'
                                    : '1px solid var(--border-color)',
                                backgroundColor: isSelected ? 'rgba(0,102,255,0.04)' : 'var(--card-bg)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 150ms ease',
                                boxShadow: isSelected ? '0 0 0 3px rgba(0,102,255,0.1)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            <span style={{ fontSize: '32px', flexShrink: 0 }}>{s.icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {s.label}
                                    </span>
                                    {s.recommended && (
                                        <span
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                backgroundColor: 'var(--color-primary)',
                                                color: '#fff',
                                            }}
                                        >
                                            ⭐ Recomendado
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {s.description}
                                </span>
                            </div>
                            {/* Radio indicator */}
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: isSelected
                                        ? '6px solid var(--color-primary)'
                                        : '2px solid var(--border-color)',
                                    flexShrink: 0,
                                    transition: 'border 150ms ease',
                                }}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
