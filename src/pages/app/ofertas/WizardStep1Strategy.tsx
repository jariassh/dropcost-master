/**
 * WizardStep1Strategy - Paso 1: Elegir estrategia de oferta.
 * 3 cards seleccionables: Descuento, Bundle (recomendado), Obsequio.
 */
import type { StrategyType } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import { Sparkles } from 'lucide-react';

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {STRATEGIES.map((s) => {
                    const isSelected = selected === s.type;

                    return (
                        <button
                            key={s.type}
                            onClick={() => onChange(s.type)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '16px',
                                padding: '32px 24px',
                                borderRadius: '28px',
                                border: isSelected
                                    ? '2.5px solid var(--color-primary)'
                                    : '1px solid var(--border-color)',
                                backgroundColor: isSelected ? 'rgba(0,102,255,0.04)' : 'var(--card-bg)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected ? '0 12px 24px rgba(0,102,255,0.1)' : '0 2px 4px rgba(0,0,0,0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.08)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                                }
                            }}
                        >
                            {/* Recommended Badge */}
                            {s.recommended && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        padding: '5px 12px',
                                        borderRadius: '10px',
                                        fontSize: '9px',
                                        fontWeight: 900,
                                        backgroundColor: 'var(--color-primary)',
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        boxShadow: '0 4px 8px rgba(0, 102, 255, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Sparkles size={10} fill="white" /> Recomendado
                                </div>
                            )}

                            {/* Selection indicator - More discrete */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: '20px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: isSelected
                                        ? '5px solid var(--color-primary)'
                                        : '2px solid var(--border-color)',
                                    backgroundColor: 'var(--card-bg)',
                                    transition: 'all 0.2s',
                                }}
                            />

                            <div style={{
                                width: '80px', height: '80px',
                                borderRadius: '24px',
                                backgroundColor: isSelected ? 'rgba(0,102,255,0.1)' : 'var(--bg-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '44px',
                                transition: 'all 0.3s',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
                                marginTop: '12px' // Baja el icono para dar aire al badge
                            }}>
                                {s.icon}
                            </div>

                            <div style={{ flex: 1, width: '100%' }}>
                                <h4 style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                    {s.label}
                                </h4>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '320px', margin: '0 auto' }}>
                                    {s.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
