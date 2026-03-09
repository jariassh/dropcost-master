import { type StrategicProfile, STRATEGY_CONFIG } from './simulatorCalculations';

interface StrategySelectorProps {
    selected: StrategicProfile;
    onSelect: (profile: StrategicProfile) => void;
    maxCpas: Record<StrategicProfile, number>;
    currency: string;
}

export function StrategySelector({ selected, onSelect, maxCpas, currency }: StrategySelectorProps) {
    const profiles: StrategicProfile[] = ['conservative', 'balanced', 'scaling'];

    const formatShortCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
                display: 'flex',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                position: 'relative'
            }}>
                {profiles.map((id) => {
                    const isActive = selected === id;
                    const config = STRATEGY_CONFIG[id];
                    return (
                        <button
                            key={id}
                            onClick={() => onSelect(id)}
                            style={{
                                flex: 1,
                                padding: '12px 8px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: isActive ? '#6366F1' : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-tertiary)',
                                cursor: 'pointer',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                                zIndex: isActive ? 2 : 1
                            }}
                        >
                            <span style={{ fontSize: '12px', fontWeight: 650, letterSpacing: '0.02em' }}>{config.label}</span>
                            <span style={{ fontSize: '10px', opacity: isActive ? 0.9 : 0.6, fontWeight: 500 }}>
                                {formatShortCurrency(maxCpas[id])}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '4px' }}>
                <div style={{ width: '4px', height: '14px', borderRadius: '2px', backgroundColor: '#6366F1' }} />
                <p style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    margin: 0
                }}>
                    {STRATEGY_CONFIG[selected].description}
                </p>
            </div>
        </div>
    );
}
