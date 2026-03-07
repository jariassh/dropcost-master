import React, { useState } from 'react';
import {
    Zap,
    Users,
    CreditCard,
    UserCheck,
    ChevronDown,
    ChevronRight,
    Search,
    X,
    Save
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { useEmailTriggers, useMarketingTemplates, useUpdateEmailTrigger } from '@/hooks/useMarketing';

import { MarketingEventMapping, EmailTemplate } from '@/types/marketing';

// ============================================================
// HELPERS
// ============================================================
const EVENT_ICON_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    user_registered: { icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    referral_registered: { icon: UserCheck, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    password_reset: { icon: Zap, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    password_changed: { icon: UserCheck, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    email_changed: { icon: Zap, color: '#EAB308', bg: 'rgba(234,179,8,0.1)' },
    profile_updated: { icon: Users, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
    commission_approved: { icon: CreditCard, color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
    verification_code: { icon: Zap, color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
    '2fa_enabled': { icon: UserCheck, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
    default: { icon: Zap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
};

// ============================================================
// COMPONENTE: TriggerCard
// ============================================================
function TriggerCard({ mapping, onConfig }: { mapping: MarketingEventMapping, onConfig: (m: MarketingEventMapping) => void }) {
    const config = EVENT_ICON_CONFIG[mapping.event_type] || EVENT_ICON_CONFIG.default;
    const Icon = config.icon;

    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
            transition: 'all 0.2s',
            opacity: mapping.enabled ? 1 : 0.6
        }}>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon size={20} color={config.color} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {mapping.event_type.replace(/_/g, ' ').toUpperCase()}
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            Plantilla: <strong>{mapping.template_name}</strong>
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Badge variant={mapping.enabled ? 'success' : 'pill-secondary'}>
                        {mapping.enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                </div>
            </div>

            <div style={{
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Actualizado: {new Date(mapping.updated_at).toLocaleDateString()}
                </span>
                <button
                    style={{
                        fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600
                    }}
                    onClick={() => onConfig(mapping)}
                >
                    Configurar
                </button>
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function EmailTriggersManager() {
    const { data: mappings = [], isLoading: loading } = useEmailTriggers();
    const { data: templates = [] } = useMarketingTemplates();
    const saveMutation = useUpdateEmailTrigger();

    const [search, setSearch] = useState('');
    const [selectedMapping, setSelectedMapping] = useState<MarketingEventMapping | null>(null);
    const [editTemplateId, setEditTemplateId] = useState<string>('');
    const [editEnabled, setEditEnabled] = useState<boolean>(true);

    const filtered = (mappings as MarketingEventMapping[]).filter(m =>
        m.event_type.toLowerCase().includes(search.toLowerCase()) ||
        m.template_name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleConfigClick = (mapping: MarketingEventMapping) => {
        setSelectedMapping(mapping);
        setEditTemplateId(mapping.template_id || '');
        setEditEnabled(mapping.enabled);
    };

    const handleSave = () => {
        if (!selectedMapping) return;
        saveMutation.mutate(
            { event_type: selectedMapping.event_type, template_id: editTemplateId, enabled: editEnabled },
            {
                onSuccess: () => {
                    setSelectedMapping(null);
                }
            }
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 300ms ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de evento o plantilla..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 40px',
                            backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                            borderRadius: '10px', fontSize: '14px', color: 'var(--text-primary)',
                            outline: 'none',
                        }}
                    />
                </div>
                <Badge variant="info">{mappings.length} Eventos Mapeados</Badge>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner /></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)' }}>
                    No se encontraron mapeos de eventos.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                    {filtered.map(m => (
                        <TriggerCard key={m.id} mapping={m} onConfig={handleConfigClick} />
                    ))}
                </div>
            )}

            {/* MODAL DE CONFIGURACIÓN */}
            {selectedMapping && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '16px',
                        width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--border-color)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Configurar Evento</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>{selectedMapping.event_type.replace(/_/g, ' ').toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSelectedMapping(null)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', borderRadius: '8px', padding: '8px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Plantilla */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Plantilla a Enviar</label>
                                <select
                                    value={editTemplateId}
                                    onChange={(e) => setEditTemplateId(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px',
                                        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                        borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)',
                                        outline: 'none', appearance: 'none'
                                    }}
                                >
                                    <option value="" disabled>Selecciona una plantilla...</option>
                                    {(templates as EmailTemplate[]).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Estado (Activo/Inactivo) */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Activación</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>¿Disparar email cuando suceda este evento?</p>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={editEnabled} onChange={(e) => setEditEnabled(e.target.checked)} />
                                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: editEnabled ? 'var(--color-primary)' : 'var(--bg-tertiary)', transition: '.4s', borderRadius: '34px' }}></span>
                                    <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: editEnabled ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                            <button
                                onClick={() => setSelectedMapping(null)}
                                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveMutation.isPending || !editTemplateId}
                                style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', opacity: (saveMutation.isPending || !editTemplateId) ? 0.7 : 1 }}
                            >
                                {saveMutation.isPending ? <Spinner size="sm" /> : <><Save size={18} /> Guardar Cambios</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
