import React from 'react';
import { LeadList } from '../../components/admin/LeadList';
import { LayoutGrid, RefreshCcw } from 'lucide-react';

export const AdminLeadsPage: React.FC = () => {
    const [period, setPeriod] = React.useState<'today' | '7d' | '30d' | 'all'>('all');
    const leadListRef = React.useRef<{ refresh: () => void }>(null);

    const periodLabels = {
        today: 'Hoy',
        '7d': 'los últimos 7 días',
        '30d': 'los últimos 30 días',
        all: 'todo el tiempo'
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="dc-admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        backgroundColor: '#0061FF', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(0, 97, 255, 0.3)'
                    }}>
                        <LayoutGrid size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                            Gestión de <span style={{ color: '#3182ce' }}>Leads</span>
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', margin: 0 }}>
                            Datos de {periodLabels[period]}
                        </p>
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    {[
                        { key: 'today' as const, label: 'Hoy' },
                        { key: '7d' as const, label: '7D' },
                        { key: '30d' as const, label: '30D' },
                        { key: 'all' as const, label: 'Todo' },
                    ].map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                backgroundColor: period === p.key ? 'var(--bg-tertiary)' : 'transparent',
                                color: period === p.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                boxShadow: period === p.key ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                    <button
                        onClick={() => leadListRef.current?.refresh()}
                        style={{
                            padding: '10px', 
                            borderRadius: '10px', 
                            border: 'none',
                            backgroundColor: 'transparent', 
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            transition: 'color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        title="Actualizar"
                    >
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            <LeadList 
                period={period} 
                ref={leadListRef}
            />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1s linear infinite; }
                
                @media (max-width: 767px) {
                    .dc-admin-header-row {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
};
