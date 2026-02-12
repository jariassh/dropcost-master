/**
 * OfertasDashboard - Dashboard "Mis Ofertas" con tabla desktop / cards mobile.
 * Filtros por estrategia y estado.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, EmptyState, useToast } from '@/components/common';
import { Modal } from '@/components/common';
import type { Oferta, StrategyType, OfertaStatus } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import { Plus, Eye, Pause, Play, Trash2, Gift, Filter } from 'lucide-react';

interface OfertasDashboardProps {
    onCreateNew: () => void;
}

export function OfertasDashboard({ onCreateNew }: OfertasDashboardProps) {
    const navigate = useNavigate();
    const toast = useToast();
    const [ofertas, setOfertas] = useState<Oferta[]>([]);
    const [filterStrategy, setFilterStrategy] = useState<StrategyType | 'todas'>('todas');
    const [filterStatus, setFilterStatus] = useState<OfertaStatus | 'todas'>('todas');
    const [detailOferta, setDetailOferta] = useState<Oferta | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('dropcost_ofertas');
        if (stored) setOfertas(JSON.parse(stored));
    }, []);

    function saveOfertas(updated: Oferta[]) {
        setOfertas(updated);
        localStorage.setItem('dropcost_ofertas', JSON.stringify(updated));
    }

    const filtered = ofertas.filter((o) => {
        if (filterStrategy !== 'todas' && o.strategyType !== filterStrategy) return false;
        if (filterStatus !== 'todas' && o.status !== filterStatus) return false;
        return true;
    });

    function handleToggleStatus(id: string) {
        const updated = ofertas.map((o) =>
            o.id === id ? { ...o, status: (o.status === 'activa' ? 'pausada' : 'activa') as OfertaStatus } : o,
        );
        saveOfertas(updated);
        toast.success('Estado actualizado');
    }

    function handleDelete(id: string) {
        const updated = ofertas.filter((o) => o.id !== id);
        saveOfertas(updated);
        setDeleteConfirm(null);
        toast.info('Oferta eliminada');
    }

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const getStrategyInfo = (type: StrategyType) => STRATEGIES.find((s) => s.type === type)!;

    if (ofertas.length === 0) {
        return (
            <EmptyState
                icon={<Gift size={48} />}
                title="Aún no tienes ofertas"
                description="Crea tu primera oferta irresistible para aumentar tus ventas"
                action={{ label: '+ Crear Oferta', onClick: onCreateNew }}
            />
        );
    }

    return (
        <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
                {['todas', 'descuento', 'bundle', 'obsequio'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterStrategy(s as StrategyType | 'todas')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid var(--border-color)',
                            backgroundColor: filterStrategy === s ? 'var(--color-primary)' : 'var(--card-bg)',
                            color: filterStrategy === s ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 100ms',
                        }}
                    >
                        {s === 'todas' ? 'Todas' : getStrategyInfo(s as StrategyType).icon + ' ' + getStrategyInfo(s as StrategyType).label}
                    </button>
                ))}

                <span style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

                {['todas', 'activa', 'pausada'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s as OfertaStatus | 'todas')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            border: '1px solid var(--border-color)',
                            backgroundColor: filterStatus === s ? 'var(--bg-secondary)' : 'transparent',
                            color: filterStatus === s ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            cursor: 'pointer',
                        }}
                    >
                        {s === 'todas' ? 'Todos' : s === 'activa' ? '🟢 Activas' : '⏸️ Pausadas'}
                    </button>
                ))}
            </div>

            {/* Table (desktop) */}
            <div
                style={{
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                {['Producto', 'Estrategia', 'Ganancia Est.', 'Estado', 'Acciones'].map((col) => (
                                    <th
                                        key={col}
                                        style={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            borderBottom: '1px solid var(--border-color)',
                                        }}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((o) => {
                                const info = getStrategyInfo(o.strategyType);
                                return (
                                    <tr
                                        key={o.id}
                                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 100ms' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{o.productName}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {info.icon} {info.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-success)' }}>
                                            {formatCurrency(o.estimatedProfit)}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <Badge variant={o.status === 'activa' ? 'success' : 'warning'}>
                                                {o.status === 'activa' ? '🟢 Activa' : '⏸️ Pausada'}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <ActionBtn icon={<Eye size={14} />} title="Ver" onClick={() => setDetailOferta(o)} />
                                                <ActionBtn
                                                    icon={o.status === 'activa' ? <Pause size={14} /> : <Play size={14} />}
                                                    title={o.status === 'activa' ? 'Pausar' : 'Reanudar'}
                                                    onClick={() => handleToggleStatus(o.id)}
                                                />
                                                <ActionBtn icon={<Trash2 size={14} />} title="Eliminar" onClick={() => setDeleteConfirm(o.id)} danger />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filtered.length === 0 && ofertas.length > 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No hay ofertas con estos filtros
                </div>
            )}

            {/* Detail modal */}
            {detailOferta && (
                <Modal
                    isOpen={true}
                    onClose={() => setDetailOferta(null)}
                    title={`Detalle: ${detailOferta.productName}`}
                >
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <InfoItem label="Estrategia" value={`${getStrategyInfo(detailOferta.strategyType).icon} ${getStrategyInfo(detailOferta.strategyType).label}`} />
                            <InfoItem label="Estado" value={detailOferta.status === 'activa' ? '🟢 Activa' : '⏸️ Pausada'} />
                            <InfoItem label="Ganancia estimada" value={formatCurrency(detailOferta.estimatedProfit)} />
                            <InfoItem label="Margen estimado" value={`${detailOferta.estimatedMarginPercent}%`} />
                            <InfoItem label="Creada" value={new Date(detailOferta.createdAt).toLocaleDateString('es-CO')} />
                            <InfoItem label="Activada" value={new Date(detailOferta.activatedAt).toLocaleDateString('es-CO')} />
                        </div>

                        {detailOferta.discountConfig && (
                            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                                <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Descuento aplicado</p>
                                <p style={{ fontSize: '14px' }}>
                                    {detailOferta.discountConfig.discountPercent}% → Precio: {formatCurrency(detailOferta.discountConfig.offerPrice)}
                                </p>
                            </div>
                        )}

                        {detailOferta.bundleConfig && (
                            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                                <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Bundle configurado</p>
                                <p style={{ fontSize: '14px' }}>
                                    Hasta {detailOferta.bundleConfig.quantity} uds · {detailOferta.bundleConfig.marginPercent}% margen 2+
                                </p>
                            </div>
                        )}

                        {detailOferta.giftConfig && (
                            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                                <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Obsequio</p>
                                <p style={{ fontSize: '14px' }}>
                                    {detailOferta.giftConfig.description || detailOferta.giftConfig.giftType} · Costo: {formatCurrency(detailOferta.giftConfig.giftCost)}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button
                                onClick={() => { handleToggleStatus(detailOferta.id); setDetailOferta(null); }}
                                style={{
                                    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                                    color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                                }}
                            >
                                {detailOferta.status === 'activa' ? '⏸️ Pausar' : '▶️ Reanudar'}
                            </button>
                            <button
                                onClick={() => { setDeleteConfirm(detailOferta.id); setDetailOferta(null); }}
                                style={{
                                    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                                    color: 'var(--color-error)', backgroundColor: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer',
                                }}
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <Modal isOpen={true} onClose={() => setDeleteConfirm(null)} title="Eliminar oferta">
                    <div style={{ padding: '16px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            ¿Estás seguro de eliminar esta oferta? Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                                    color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                style={{
                                    padding: '10px 16px', fontSize: '13px', fontWeight: 600,
                                    color: '#fff', backgroundColor: 'var(--color-error)',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                                }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function ActionBtn({ icon, title, onClick, danger = false }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
                cursor: 'pointer', color: danger ? 'var(--color-error)' : 'var(--text-secondary)',
                transition: 'all 100ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = danger ? 'var(--color-error)' : 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
        >
            {icon}
        </button>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{label}</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
        </div>
    );
}
