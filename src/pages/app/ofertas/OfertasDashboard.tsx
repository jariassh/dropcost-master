/**
 * OfertasDashboard - Dashboard "Mis Ofertas" con tabla desktop / cards mobile.
 * Filtros por estrategia y estado.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, EmptyState, useToast, ConfirmDialog, Spinner } from '@/components/common';
import { Card } from '@/components/common/Card';
import { OfertaDetailPanel } from './components/OfertaDetailPanel';
import type { Oferta, StrategyType } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import { Plus, Eye, Trash2, Gift, Filter, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { ofertaService } from '@/services/ofertaService';

interface OfertasDashboardProps {
    onCreateNew: () => void;
}

export function OfertasDashboard({ onCreateNew }: OfertasDashboardProps) {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuthStore();
    const tiendaActual = useStoreStore((state) => state.tiendaActual);

    const [ofertas, setOfertas] = useState<Oferta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [filterStrategy, setFilterStrategy] = useState<StrategyType | 'todas'>('todas');
    const [detailOferta, setDetailOferta] = useState<Oferta | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [quota, setQuota] = useState({ used: 0, limit: 0 });

    const fetchOfertas = useCallback(async () => {
        if (!tiendaActual?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await ofertaService.getOfertas(tiendaActual.id);
            setOfertas(data);

            const limit = user?.plan?.limits?.offers_limit ?? 0;
            setQuota({ used: data.length, limit });

            // Check for ID in URL to open detail
            const id = searchParams.get('id');
            if (id) {
                const found = data.find((o) => o.id === id);
                if (found) setDetailOferta(found);
            }
        } catch (error) {
            toast.error('Error al cargar ofertas');
        } finally {
            setIsLoading(false);
        }
    }, [tiendaActual?.id, user?.plan?.limits?.offers_limit, searchParams, toast]);

    useEffect(() => {
        fetchOfertas();
    }, [fetchOfertas]);

    // Migración de localStorage a Supabase
    useEffect(() => {
        const doMigration = async () => {
            if (!tiendaActual?.id || !user?.id) return;

            const legacyData = localStorage.getItem('dropcost_ofertas');
            if (!legacyData) return;

            try {
                const localOfertas = JSON.parse(legacyData) as any[];
                if (Array.isArray(localOfertas) && localOfertas.length > 0) {
                    // Solo migrar si no hay ofertas en DB
                    const dbOfertas = await ofertaService.getOfertas(tiendaActual.id);
                    if (dbOfertas.length === 0) {
                        toast.info('Detectamos ofertas locales. Migrando a la nube...');
                        for (const o of localOfertas) {
                            await ofertaService.createOferta({
                                userId: user.id,
                                storeId: tiendaActual.id,
                                costeoId: o.costeoId,
                                productName: o.productName,
                                strategyType: o.strategyType,
                                discountConfig: o.discountConfig,
                                bundleConfig: o.bundleConfig,
                                giftConfig: o.giftConfig,
                                estimatedProfit: o.estimatedProfit,
                                estimatedMarginPercent: o.estimatedMarginPercent
                            });
                        }
                        toast.success('Migración completada');
                        fetchOfertas();
                    }
                }
                localStorage.removeItem('dropcost_ofertas');
            } catch (error) {
                console.error('Error migrando ofertas:', error);
            }
        };

        doMigration();
    }, [tiendaActual?.id, user?.id, toast, fetchOfertas]);

    const filtered = ofertas.filter((o) => {
        if (filterStrategy !== 'todas' && o.strategyType !== filterStrategy) return false;
        return true;
    });

    async function handleDuplicate(oferta: Oferta) {
        if (!user?.id || !tiendaActual?.id) return;

        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const canDuplicate = user?.plan?.limits?.can_duplicate_offers;

        if (!isAdmin && !canDuplicate) {
            toast.warning('Función Premium', 'La duplicación de ofertas no está habilitada en tu plan actual.');
            return;
        }

        if (!isAdmin && quota.limit !== -1 && quota.used >= quota.limit) {
            toast.warning('Límite de Ofertas', `Has alcanzado el máximo de ${quota.limit} ofertas permitidas en tu plan.`);
            return;
        }

        try {
            await ofertaService.createOferta({
                userId: user.id,
                storeId: tiendaActual.id,
                costeoId: oferta.costeoId,
                productName: `${oferta.productName} (copia)`,
                strategyType: oferta.strategyType,
                discountConfig: oferta.discountConfig,
                bundleConfig: oferta.bundleConfig,
                giftConfig: oferta.giftConfig,
                estimatedProfit: oferta.estimatedProfit,
                estimatedMarginPercent: oferta.estimatedMarginPercent
            });
            toast.success('Oferta duplicada');
            fetchOfertas();
        } catch (error) {
            toast.error('Error al duplicar oferta');
        }
    }

    async function handleDelete(id: string) {
        try {
            await ofertaService.deleteOferta(id);
            setDeleteConfirm(null);
            toast.info('Oferta eliminada');
            fetchOfertas();
        } catch (error) {
            toast.error('Error al eliminar oferta');
        }
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

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

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
            {/* Filters & Quota */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                </div>

            </div>


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
                                {['Producto', 'Estrategia', 'Ganancia Est.', 'Acciones'].map((col) => (
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
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <ActionBtn icon={<Eye size={14} />} title="Ver" onClick={() => setDetailOferta(o)} />
                                                <ActionBtn icon={<Copy size={14} />} title="Duplicar" onClick={() => handleDuplicate(o)} />
                                                {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_offers) && (
                                                    <ActionBtn icon={<Trash2 size={14} />} title="Eliminar" onClick={() => checkDelete(o.id)} danger />
                                                )}
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
