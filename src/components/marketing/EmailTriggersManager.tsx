import React, { useState } from 'react';
import {
    Zap,
    Users,
    CreditCard,
    UserCheck,
    ChevronDown,
    ChevronRight,
    Search,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { useEmailTriggers } from '@/hooks/useMarketing';

// ============================================================
// TIPOS
// ============================================================
interface EmailTrigger {
    id: string;
    nombre_trigger: string;
    descripcion: string;
    codigo_evento: string;
    categoria: 'usuario' | 'referido' | 'pago';
    variables_disponibles: string[];
    tipo_disparador: 'automatico' | 'cron';
    tabla_origen: string;
    evento_tipo: string;
    condicion: string;
    activo: boolean;
    plantillas_count?: number;
}

// ============================================================
// HELPERS
// ============================================================
const CATEGORIA_CONFIG = {
    usuario: { label: 'Usuario', icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    referido: { label: 'Referidos', icon: UserCheck, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    pago: { label: 'Pagos', icon: CreditCard, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
};

// ============================================================
// COMPONENTE: TriggerCard
// ============================================================
function TriggerCard({ trigger }: { trigger: EmailTrigger }) {
    const [expanded, setExpanded] = useState(false);
    const cat = CATEGORIA_CONFIG[trigger.categoria];
    const CatIcon = cat.icon;

    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
            transition: 'box-shadow 0.2s',
        }}>
            <button
                onClick={() => setExpanded(e => !e)}
                style={{
                    width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CatIcon size={20} color={cat.color} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{trigger.nombre_trigger}</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>{trigger.descripcion}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {trigger.plantillas_count !== undefined && (
                        <span style={{
                            fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
                            backgroundColor: trigger.plantillas_count > 0 ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)',
                            color: trigger.plantillas_count > 0 ? '#10B981' : 'var(--text-secondary)',
                            fontWeight: 600,
                        }}>
                            {trigger.plantillas_count} plantilla{trigger.plantillas_count !== 1 ? 's' : ''}
                        </span>
                    )}
                    {expanded ? <ChevronDown size={16} color="var(--text-secondary)" /> : <ChevronRight size={16} color="var(--text-secondary)" />}
                </div>
            </button>

            {expanded && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Variables disponibles</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(Array.isArray(trigger.variables_disponibles) ? trigger.variables_disponibles : []).map(v => (
                                    <code key={v} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>{v}</code>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Configuración</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Tabla:</strong> {trigger.tabla_origen}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Evento:</strong> {trigger.evento_tipo}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Condición:</strong> {trigger.condicion}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function EmailTriggersManager() {
    const { data: triggers = [], isLoading: loading } = useEmailTriggers();
    const [search, setSearch] = useState('');

    const filtered = (triggers as EmailTrigger[]).filter(t =>
        t.nombre_trigger.toLowerCase().includes(search.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(search.toLowerCase())
    );

    const triggersByCategory = filtered.reduce((acc, t) => {
        if (!acc[t.categoria]) acc[t.categoria] = [];
        acc[t.categoria].push(t);
        return acc;
    }, {} as Record<string, EmailTrigger[]>);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 300ms ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar trigger por nombre..."
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
                <Badge variant="info">{triggers.length} Triggers definidos</Badge>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner /></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {(Object.keys(CATEGORIA_CONFIG) as Array<keyof typeof CATEGORIA_CONFIG>).map(cat => {
                        const items = triggersByCategory[cat] || [];
                        if (items.length === 0) return null;
                        return (
                            <div key={cat}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {CATEGORIA_CONFIG[cat].label}
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>({items.length})</span>
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                                    {items.map(t => <TriggerCard key={t.id} trigger={t} />)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
