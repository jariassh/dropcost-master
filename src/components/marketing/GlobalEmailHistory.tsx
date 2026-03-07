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

import { MarketingEvent } from '@/types/marketing';

const ESTADO_CONFIG: Record<string, { label: string; color: any; icon: React.ElementType }> = {
    sent: { label: 'Enviado', color: 'success', icon: CheckCircle },
    failed: { label: 'Fallido', color: 'error', icon: XCircle },
    pending: { label: 'Pendiente', color: 'warning', icon: RefreshCw },
    test: { label: 'Prueba', color: 'pill-purple', icon: Eye },
    skipped: { label: 'Omitido', color: 'pill-secondary', icon: AlertCircle },
};

function formatDate(iso: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export function GlobalEmailHistory() {
    const { data: historial = [], isLoading: loading, refetch } = useEmailHistory();
    const [filter, setFilter] = useState<'todos' | 'sent' | 'failed' | 'test'>('todos');
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<MarketingEvent | null>(null);

    const loadData = async () => {
        refetch();
    };

    const filtered = (historial as unknown as MarketingEvent[]).filter(item => {
        const matchesFilter = filter === 'todos'
            || (filter === 'test' && (item.is_test_email || item.status === 'test'))
            || (filter !== 'test' && item.status === filter);
        const matchesSearch = !search
            || item.email.toLowerCase().includes(search.toLowerCase())
            || item.event_type.toLowerCase().includes(search.toLowerCase());
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
                        placeholder="Buscar por email o evento..."
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
                    {([
                        { id: 'todos', label: 'Todos' },
                        { id: 'sent', label: 'Enviados' },
                        { id: 'failed', label: 'Fallidos' },
                        { id: 'test', label: 'Pruebas' }
                    ] as const).map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as typeof filter)}
                            style={{
                                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: filter === f.id ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                color: filter === f.id ? '#fff' : 'var(--text-secondary)',
                            }}
                        >
                            {f.label}
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
                                <th style={tableHeaderStyle}>Evento</th>
                                <th style={tableHeaderStyle}>Plantilla</th>
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
                                    const estadoConf = ESTADO_CONFIG[item.status] || { label: item.status, color: 'secondary', icon: AlertCircle };
                                    const EstadoIcon = estadoConf.icon;
                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={tdStyle}>{item.email}</td>
                                            <td style={tdStyle}>
                                                <code style={{ fontSize: '11px', backgroundColor: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {item.event_type}
                                                </code>
                                            </td>
                                            <td style={tdStyle}>
                                                {item.template?.name || 'Sistema'}
                                            </td>
                                            <td style={tdStyle}>
                                                <Badge variant={estadoConf.color} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <EstadoIcon size={12} />
                                                    {estadoConf.label}
                                                </Badge>
                                            </td>
                                            <td style={tdStyle}>{formatDate(item.created_at)}</td>
                                            <td style={tdStyle}>
                                                <button
                                                    onClick={() => setSelectedItem(item)}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'
                                                    }}
                                                >
                                                    <Eye size={14} /> Detalle
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
                title="Detalle del Evento de Marketing"
                size="lg"
            >
                {selectedItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="dc-email-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                            <DetailField label="Destinatario" value={selectedItem.email} />
                            <DetailField label="Tipo de Evento" value={selectedItem.event_type} />
                            <DetailField label="Plantilla" value={selectedItem.template?.name || 'N/A'} />
                            <DetailField label="Fecha Creación" value={formatDate(selectedItem.created_at)} />
                            <DetailField label="ID Evento" value={selectedItem.id} />
                            <DetailField label="Es Prueba" value={selectedItem.is_test_email ? 'Si' : 'No'} />
                        </div>

                        {selectedItem.error_message && (
                            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444' }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>Error:</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#EF4444' }}>{selectedItem.error_message}</p>
                            </div>
                        )}

                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Variables del Evento (JSON)</p>
                            <div style={{
                                width: '100%', maxHeight: '200px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px',
                                border: '1px solid var(--border-color)', padding: '12px', overflow: 'auto'
                            }}>
                                <pre style={{ fontSize: '12px', margin: 0 }}>
                                    {JSON.stringify(selectedItem.variables, null, 2)}
                                </pre>
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
