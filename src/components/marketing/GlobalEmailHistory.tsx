import React, { useState } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Search,
    Eye,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { useEmailHistory } from '@/hooks/useMarketing';

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

export function GlobalEmailHistory() {
    const { data: historial = [], isLoading: loading, refetch } = useEmailHistory();
    const [filter, setFilter] = useState<'todos' | 'enviado' | 'fallido' | 'prueba'>('todos');
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<EmailHistorial | null>(null);

    const loadData = async () => {
        refetch();
    };

    const filtered = (historial as EmailHistorial[]).filter(item => {
        const matchesFilter = filter === 'todos'
            || (filter === 'prueba' && item.tipo_envio === 'prueba')
            || (filter !== 'prueba' && item.estado === filter);
        const matchesSearch = !search
            || item.usuario_email.toLowerCase().includes(search.toLowerCase())
            || item.asunto_enviado?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 300ms ease-out' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por email o asunto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 40px',
                            backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                            borderRadius: '10px', fontSize: '14px', color: 'var(--text-primary)',
                            outline: 'none', transition: 'border-color 0.2s',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(['todos', 'enviado', 'fallido', 'prueba'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: filter === f ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                color: filter === f ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}s
                        </button>
                    ))}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="dc-historial-refresh"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                            backgroundColor: 'transparent', border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Table */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={tableHeaderStyle}>Destinatario</th>
                                <th style={tableHeaderStyle}>Asunto</th>
                                <th style={tableHeaderStyle}>Origen / Trigger</th>
                                <th style={tableHeaderStyle}>Estado</th>
                                <th style={tableHeaderStyle}>Fecha</th>
                                <th style={tableHeaderStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}><Spinner /></td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No hay actividad reciente</td>
                                </tr>
                            ) : (
                                filtered.map(item => {
                                    const estadoConf = ESTADO_CONFIG[item.estado];
                                    const EstadoIcon = estadoConf.icon;
                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={tdStyle}>{item.usuario_email}</td>
                                            <td style={{ ...tdStyle, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.asunto_enviado}
                                            </td>
                                            <td style={tdStyle}>
                                                {item.trigger?.nombre_trigger || (item.tipo_envio === 'prueba' ? '🧪 Prueba' : 'Manual / Campaña')}
                                            </td>
                                            <td style={tdStyle}>
                                                <Badge variant={estadoConf.color as any} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <EstadoIcon size={12} />
                                                    {estadoConf.label}
                                                </Badge>
                                            </td>
                                            <td style={tdStyle}>{formatDate(item.fecha_envio)}</td>
                                            <td style={tdStyle}>
                                                <button
                                                    onClick={() => setSelectedItem(item)}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'
                                                    }}
                                                >
                                                    <Eye size={14} /> Ver
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Detalle */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title="Detalle del Envío"
                size="lg"
            >
                {selectedItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="dc-email-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                            <DetailField label="Destinatario" value={selectedItem.usuario_email} />
                            <DetailField label="Asunto" value={selectedItem.asunto_enviado} />
                            <DetailField label="Remitente" value={`${selectedItem.from_name} <${selectedItem.from_email}>`} />
                            <DetailField label="Fecha" value={formatDate(selectedItem.fecha_envio)} />
                            <DetailField label="ID Seguimiento" value={selectedItem.id} />
                            <DetailField label="Tipo" value={selectedItem.tipo_envio === 'prueba' ? 'Manual (Prueba)' : 'Automático / Trigger'} />
                        </div>

                        {selectedItem.razon_error && (
                            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444' }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>Error de envío:</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#EF4444' }}>{selectedItem.razon_error}</p>
                            </div>
                        )}

                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Vista previa del contenido</p>
                            <div style={{
                                width: '100%', height: '400px', backgroundColor: '#fff', borderRadius: '12px',
                                border: '1px solid var(--border-color)', overflow: 'hidden'
                            }}>
                                <iframe
                                    srcDoc={selectedItem.contenido_html_enviado}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="Email Preview"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

const tableHeaderStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
    color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)'
};

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, wordBreak: 'break-all' }}>{value}</p>
        </div>
    );
}
