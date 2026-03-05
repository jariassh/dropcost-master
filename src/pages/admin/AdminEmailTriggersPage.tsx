import React, { useState, useEffect } from 'react';
import {
    Zap,
    Users,
    CreditCard,
    UserCheck,
    Clock,
    ChevronDown,
    ChevronRight,
    Mail,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Filter,
    Search,
    Calendar,
    ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/components/common/Toast';
import { supabase } from '@/lib/supabase';

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

interface EmailHistorial {
    id: string;
    usuario_email: string;
    asunto_enviado: string;
    contenido_html_enviado?: string;
    from_email: string;
    from_name: string;
    estado: 'enviado' | 'fallido' | 'rebote';
    tipo_envio: 'automatico' | 'prueba';
    razon_error: string | null;
    fecha_envio: string;
    plantilla?: { name: string };
    trigger?: { nombre_trigger: string; codigo_evento: string };
}

// ============================================================
// HELPERS
// ============================================================
const CATEGORIA_CONFIG = {
    usuario: { label: 'Usuario', icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    referido: { label: 'Referidos', icon: UserCheck, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    pago: { label: 'Pagos', icon: CreditCard, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
};

const ESTADO_CONFIG = {
    enviado: { label: 'Enviado', color: 'success', icon: CheckCircle },
    fallido: { label: 'Fallido', color: 'danger', icon: XCircle },
    rebote: { label: 'Rebote', color: 'warning', icon: AlertCircle },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

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
            {/* Header */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{
                    width: '100%',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <CatIcon size={18} color={cat.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {trigger.nombre_trigger}
                        </span>
                        <code style={{
                            fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                            backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                        }}>
                            {trigger.codigo_evento}
                        </code>
                        {trigger.tipo_disparador === 'cron' && (
                            <span style={{
                                fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                                backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B',
                                fontWeight: 600,
                            }}>
                                CRON
                            </span>
                        )}
                        {!trigger.activo && (
                            <Badge variant="warning">Inactivo</Badge>
                        )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                        {trigger.descripcion}
                    </p>
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

            {/* Expanded Details */}
            {expanded && (
                <div style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px',
                }}>
                    <div className="dc-trigger-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Variables */}
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Variables disponibles
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {trigger.variables_disponibles.map(v => (
                                    <code key={v} style={{
                                        fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                                        backgroundColor: 'rgba(59,130,246,0.08)', color: '#3B82F6',
                                        fontFamily: 'monospace',
                                    }}>
                                        {v}
                                    </code>
                                ))}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Configuración
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <strong>Tabla:</strong> {trigger.tabla_origen}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <strong>Evento:</strong> {trigger.evento_tipo}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <strong>Condición:</strong> {trigger.condicion}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// COMPONENTE: HistorialRow
// ============================================================
function HistorialRow({ item, onView }: { item: EmailHistorial; onView: (item: EmailHistorial) => void }) {
    const estadoConf = ESTADO_CONFIG[item.estado];
    const EstadoIcon = estadoConf.icon;

    return (
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>
                {item.usuario_email}
            </td>
            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.asunto_enviado}
            </td>
            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {item.trigger?.codigo_evento || (item.tipo_envio === 'prueba' ? '🧪 Prueba' : '—')}
            </td>
            <td style={{ padding: '12px 16px' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', padding: '3px 8px', borderRadius: '20px',
                    backgroundColor: item.estado === 'enviado' ? 'rgba(16,185,129,0.1)' : item.estado === 'fallido' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: item.estado === 'enviado' ? '#10B981' : item.estado === 'fallido' ? '#EF4444' : '#F59E0B',
                    fontWeight: 600,
                }}>
                    <EstadoIcon size={12} />
                    {estadoConf.label}
                </span>
            </td>
            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatDate(item.fecha_envio)}
            </td>
            <td style={{ padding: '12px 16px' }}>
                <button
                    onClick={() => onView(item)}
                    style={{
                        padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', color: 'var(--text-secondary)',
                    }}
                >
                    <Eye size={12} /> Ver
                </button>
            </td>
        </tr>
    );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export const AdminEmailTriggersPage: React.FC = () => {
    const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
    const [historial, setHistorial] = useState<EmailHistorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [activeTab, setActiveTab] = useState<'triggers' | 'historial'>('triggers');
    const [selectedHistorialItem, setSelectedHistorialItem] = useState<EmailHistorial | null>(null);
    const [historialFilter, setHistorialFilter] = useState<'todos' | 'enviado' | 'fallido' | 'prueba'>('todos');
    const [historialSearch, setHistorialSearch] = useState('');
    const toast = useToast();

    // Cargar triggers
    const loadTriggers = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('email_triggers')
                .select('*')
                .order('categoria')
                .order('nombre_trigger');

            if (error) throw error;

            // Contar plantillas asociadas por trigger
            const { data: asociaciones } = await (supabase as any)
                .from('email_plantillas_triggers')
                .select('trigger_id')
                .eq('activo', true);

            const countMap: Record<string, number> = {};
            (asociaciones || []).forEach((a: any) => {
                countMap[a.trigger_id] = (countMap[a.trigger_id] || 0) + 1;
            });

            const enriched = (data || []).map((t: any) => ({
                ...t,
                variables_disponibles: Array.isArray(t.variables_disponibles) ? t.variables_disponibles : JSON.parse(t.variables_disponibles || '[]'),
                plantillas_count: countMap[t.id] || 0,
            }));

            setTriggers(enriched);
        } catch (err) {
            console.error('Error cargando triggers:', err);
            toast.error('Error', 'No se pudo cargar la lista de triggers');
        } finally {
            setLoading(false);
        }
    };

    // Cargar historial
    const loadHistorial = async () => {
        setLoadingHistorial(true);
        try {
            const { data, error } = await (supabase as any)
                .from('email_historial')
                .select(`
                    *,
                    plantilla:plantilla_id (name),
                    trigger:trigger_id (nombre_trigger, codigo_evento)
                `)
                .order('fecha_envio', { ascending: false })
                .limit(200);

            if (error) throw error;
            setHistorial((data || []) as EmailHistorial[]);
        } catch (err) {
            console.error('Error cargando historial:', err);
            toast.error('Error', 'No se pudo cargar el historial de emails');
        } finally {
            setLoadingHistorial(false);
        }
    };

    useEffect(() => {
        loadTriggers();
    }, []);

    useEffect(() => {
        if (activeTab === 'historial' && historial.length === 0) {
            loadHistorial();
        }
    }, [activeTab]);

    // Agrupar triggers por categoría
    const triggersByCategory = triggers.reduce((acc, t) => {
        if (!acc[t.categoria]) acc[t.categoria] = [];
        acc[t.categoria].push(t);
        return acc;
    }, {} as Record<string, EmailTrigger[]>);

    // Filtrar historial
    const filteredHistorial = historial.filter(item => {
        const matchesFilter = historialFilter === 'todos'
            || (historialFilter === 'prueba' && item.tipo_envio === 'prueba')
            || (historialFilter !== 'prueba' && item.estado === historialFilter);
        const matchesSearch = !historialSearch
            || item.usuario_email.toLowerCase().includes(historialSearch.toLowerCase())
            || item.asunto_enviado?.toLowerCase().includes(historialSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Stats
    const stats = {
        total: triggers.length,
        conPlantilla: triggers.filter(t => (t.plantillas_count || 0) > 0).length,
        cron: triggers.filter(t => t.tipo_disparador === 'cron').length,
        historialTotal: historial.length,
        historialFallidos: historial.filter(h => h.estado === 'fallido').length,
    };

    return (
        <>
            <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '32px' }} className="dc-admin-container">
                {/* Header */}
                <div className="dc-admin-header-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Triggers de Email
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
                        Gestiona los 19 eventos automáticos que envían emails en DropCost Master.
                    </p>
                </div>

                {/* Stats */}
                <div className="dc-email-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {[
                        { label: 'Total Triggers', value: stats.total, icon: Zap, color: '#3B82F6' },
                        { label: 'Con Plantilla', value: stats.conPlantilla, icon: Mail, color: '#10B981' },
                        { label: 'Tipo CRON', value: stats.cron, icon: Clock, color: '#F59E0B' },
                        { label: 'Emails Enviados', value: stats.historialTotal, icon: CheckCircle, color: '#8B5CF6' },
                        { label: 'Fallidos', value: stats.historialFallidos, icon: XCircle, color: '#EF4444' },
                    ].map(s => {
                        const Icon = s.icon;
                        return (
                            <Card key={s.label} style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={18} color={s.color} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>{s.value}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0 0 0', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="dc-admin-tabs-row" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[
                        { key: 'triggers', label: 'Triggers', icon: Zap },
                        { key: 'historial', label: 'Historial', icon: Calendar },
                    ].map(tab => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                    borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    marginBottom: '-1px'
                                }}
                            >
                                <TabIcon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB: TRIGGERS */}
                {activeTab === 'triggers' && (
                    <>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                                <Spinner />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {(Object.keys(CATEGORIA_CONFIG) as Array<keyof typeof CATEGORIA_CONFIG>).map(cat => {
                                    const items = triggersByCategory[cat] || [];
                                    if (items.length === 0) return null;
                                    const catConf = CATEGORIA_CONFIG[cat];
                                    const CatIcon = catConf.icon;

                                    return (
                                        <div key={cat} id={`cat-${cat}`}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: catConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CatIcon size={16} color={catConf.color} />
                                                </div>
                                                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                    {catConf.label}
                                                </h2>
                                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-tertiary)', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>
                                                    {items.length}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {items.map(trigger => (
                                                    <TriggerCard key={trigger.id} trigger={trigger} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* TAB: HISTORIAL */}
                {activeTab === 'historial' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Filtros */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }} className="dc-historial-search">
                                <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por email o asunto..."
                                    value={historialSearch}
                                    onChange={e => setHistorialSearch(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 40px',
                                        border: '1px solid var(--border-color)', borderRadius: '12px',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        fontSize: '14px', boxSizing: 'border-box', outline: 'none'
                                    }}
                                />
                            </div>
                            <div className="dc-historial-filters" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {[
                                    { key: 'todos', label: 'Todos' },
                                    { key: 'enviado', label: 'Enviados' },
                                    { key: 'fallido', label: 'Fallidos' },
                                    { key: 'prueba', label: 'Pruebas' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setHistorialFilter(f.key as any)}
                                        style={{
                                            padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                            backgroundColor: historialFilter === f.key ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                            color: historialFilter === f.key ? '#fff' : 'var(--text-secondary)',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={loadHistorial}
                                disabled={loadingHistorial}
                                className="dc-historial-refresh"
                                style={{
                                    padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
                                    fontWeight: 600
                                }}
                            >
                                <RefreshCw size={16} style={{ animation: loadingHistorial ? 'spin 1s linear infinite' : 'none' }} />
                                <span className="refresh-text">Actualizar</span>
                            </button>
                        </div>

                        {/* Tabla historial */}
                        <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                            {loadingHistorial ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                                    <Spinner />
                                </div>
                            ) : filteredHistorial.length === 0 ? (
                                <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    <Mail size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                    <p style={{ fontSize: '16px', fontWeight: 600 }}>No hay registros de emails enviados</p>
                                    <p style={{ fontSize: '14px' }}>Intenta ajustando los filtros de búsqueda</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                                <th style={tableHeaderStyle}>Destinatario</th>
                                                <th style={tableHeaderStyle}>Asunto</th>
                                                <th style={tableHeaderStyle}>Trigger</th>
                                                <th style={tableHeaderStyle}>Estado</th>
                                                <th style={tableHeaderStyle}>Fecha</th>
                                                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHistorial.map(item => (
                                                <HistorialRow key={item.id} item={item} onView={setSelectedHistorialItem} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            {/* Modal: Detalle de email enviado */}
            {selectedHistorialItem && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedHistorialItem(null)}
                    title="Detalle del Email Enviado"
                    size="lg"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px' }}>
                        <div className="dc-email-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Destinatario</p>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{selectedHistorialItem.usuario_email}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Remitente</p>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{selectedHistorialItem.from_name} &lt;{selectedHistorialItem.from_email}&gt;</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Trigger</p>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                    {selectedHistorialItem.trigger?.codigo_evento || (selectedHistorialItem.tipo_envio === 'prueba' ? '🧪 Prueba manual' : '—')}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Fecha de Envío</p>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{formatDate(selectedHistorialItem.fecha_envio)}</p>
                            </div>
                        </div>

                        <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>Asunto</p>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selectedHistorialItem.asunto_enviado}</p>
                        </div>

                        {selectedHistorialItem.razon_error && (
                            <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', marginBottom: '8px' }}>
                                    <AlertCircle size={18} />
                                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Error detectado</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#EF4444', margin: 0, lineHeight: 1.5 }}>{selectedHistorialItem.razon_error}</p>
                            </div>
                        )}

                        {selectedHistorialItem.contenido_html_enviado && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: 0 }}>Vista Previa del Contenido</p>
                                <div style={{
                                    border: '1px solid var(--border-color)', borderRadius: '12px',
                                    overflow: 'hidden', maxHeight: '400px', overflowY: 'auto',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <iframe
                                        srcDoc={selectedHistorialItem.contenido_html_enviado}
                                        style={{ width: '100%', minHeight: '300px', border: 'none', backgroundColor: '#fff' }}
                                        title="Email preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};

const tableHeaderStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap'
};

const styles = `
    @media (max-width: 767px) {
        .dc-admin-header-row {
            text-align: center !important;
            margin-bottom: 8px;
        }
        .dc-admin-header-row h1 {
            font-size: 22px !important;
        }
        .dc-email-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
        }
        .dc-trigger-details-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
        }
        .dc-admin-tabs-row::-webkit-scrollbar,
        .dc-historial-filters::-webkit-scrollbar {
            display: none;
        }
        .dc-historial-refresh {
            width: 100% !important;
            justify-content: center !important;
        }
        .dc-historial-refresh .refresh-text {
            display: block !important;
        }
        .dc-email-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
        }
        
        /* Table Mobile Optimization */
        table th:nth-child(2),
        table th:nth-child(3),
        table th:nth-child(5),
        table td:nth-child(2),
        table td:nth-child(3),
        table td:nth-child(5) {
            display: none !important;
        }
        table th, table td {
            padding: 12px 16px !important;
        }
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleId = 'admin-email-triggers-styles';
    if (!document.getElementById(styleId)) {
        const styleTag = document.createElement('style');
        styleTag.id = styleId;
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
    }
}

export default AdminEmailTriggersPage;
