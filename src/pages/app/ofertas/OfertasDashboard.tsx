/**
 * OfertasDashboard - Dashboard "Mis Ofertas" con tabla desktop / cards mobile.
 * Filtros por estrategia y estado.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, EmptyState, useToast, ConfirmDialog } from '@/components/common';
import { Card } from '@/components/common/Card';
import { OfertaDetailPanel } from './components/OfertaDetailPanel';
import type { Oferta, StrategyType, OfertaStatus } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import { Plus, Eye, Pause, Play, Trash2, Gift, Filter } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface OfertasDashboardProps {
    onCreateNew: () => void;
}

export function OfertasDashboard({ onCreateNew }: OfertasDashboardProps) {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuthStore();
    const [ofertas, setOfertas] = useState<Oferta[]>([]);
    const [searchParams] = useSearchParams();
    const [filterStrategy, setFilterStrategy] = useState<StrategyType | 'todas'>('todas');
    const [filterStatus, setFilterStatus] = useState<OfertaStatus | 'todas'>('todas');
    const [detailOferta, setDetailOferta] = useState<Oferta | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('dropcost_ofertas');
        if (stored) {
            const parsed = JSON.parse(stored) as Oferta[];
            setOfertas(parsed);

            // Check for ID in URL to open detail
            const id = searchParams.get('id');
            if (id) {
                const found = parsed.find(o => o.id === id);
                if (found) setDetailOferta(found);
            }
        }
    }, [searchParams]);

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

    function checkDelete(id: string) {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const canDelete = user?.plan?.limits?.can_delete_offers;

        if (!isAdmin && !canDelete) {
            toast.warning('Restricción de Plan', 'Tu plan actual no permite eliminar ofertas.');
            return;
        }
        setDeleteConfirm(id);
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

            import {Card} from '@/components/common/Card';

            // ... (imports remain)

            // ... inside the component ...

            {/* Table (desktop) */}
            <Card noPadding style={{
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                {['Producto', 'Estrategia', 'Ganancia Est.', 'Estado', 'Acciones'].map((col) => (
                                    <th
                                        key={col}
                                        style={{
                                            padding: '16px 24px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
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
                                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>{o.productName}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {info.icon} {info.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-success)' }}>
                                            {formatCurrency(o.estimatedProfit)}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <Badge variant={o.status === 'activa' ? 'modern-success' : 'modern-warning'}>
                                                {o.status === 'activa' ? 'Activa' : 'Pausada'}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <ActionBtn icon={<Eye size={14} />} title="Ver" onClick={() => setDetailOferta(o)} />
                                                <ActionBtn
                                                    icon={o.status === 'activa' ? <Pause size={14} /> : <Play size={14} />}
                                                    title={o.status === 'activa' ? 'Pausar' : 'Reanudar'}
                                                    onClick={() => handleToggleStatus(o.id)}
                                                />
                                                <ActionBtn icon={<Trash2 size={14} />} title="Eliminar" onClick={() => checkDelete(o.id)} danger />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {filtered.length === 0 && ofertas.length > 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No hay ofertas con estos filtros
                </div>
            )}

            {/* Detail Panel */}
            {detailOferta && (
                <OfertaDetailPanel
                    oferta={detailOferta}
                    onClose={() => setDetailOferta(null)}
                    onToggleStatus={handleToggleStatus}
                    onDelete={(id: string) => {
                        setDetailOferta(null);
                        setDeleteConfirm(id);
                    }}
                />
            )}


            {/* Delete confirmation modal */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                title="Eliminar oferta"
                description="¿Estás seguro de eliminar esta oferta? Esta acción no se puede deshacer."
                confirmLabel="Sí, eliminar"
                variant="danger"
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
            />

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
