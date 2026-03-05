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
import { Plus, Eye, Trash2, Gift, Filter, Copy, ArrowRight, X, Settings, Check } from 'lucide-react';
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
            const data = await ofertaService.getOfertas(tiendaActual.id, user!.id);
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
                    const dbOfertas = await ofertaService.getOfertas(tiendaActual.id, user.id);
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
                                estimatedMarginPercent: o.estimatedMarginPercent,
                                status: 'active'
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
                estimatedMarginPercent: oferta.estimatedMarginPercent,
                status: 'active'
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
            {/* Filters Section */}
            <div style={{
                marginBottom: '32px',
                padding: '0 4px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '8px 14px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    width: 'fit-content',
                    marginBottom: '16px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <Filter size={14} style={{ color: 'var(--color-primary)', strokeWidth: 3 }} />
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filtrar por Estrategia</span>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    maskImage: 'linear-gradient(to right, black 90%, transparent 100%)'
                }}>
                    {['todas', 'descuento', 'bundle', 'obsequio'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStrategy(s as StrategyType | 'todas')}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '14px',
                                fontSize: '13px',
                                fontWeight: 800,
                                border: '1px solid',
                                borderColor: filterStrategy === s ? 'var(--color-primary)' : 'var(--border-color)',
                                backgroundColor: filterStrategy === s ? 'rgba(0,102,255,0.08)' : 'var(--card-bg)',
                                color: filterStrategy === s ? 'var(--color-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: filterStrategy === s ? '0 4px 12px rgba(0, 102, 255, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>
                                {s === 'todas' ? '🚀' : getStrategyInfo(s as StrategyType).icon}
                            </span>
                            {s === 'todas' ? 'Todas las Estrategias' : getStrategyInfo(s as StrategyType).label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '24px'
            }}>
                {filtered.map((o) => {
                    const strategyInfo = getStrategyInfo(o.strategyType);
                    return (
                        <div
                            key={o.id}
                            onClick={() => setDetailOferta(o)}
                            style={{
                                padding: '20px',
                                borderRadius: '18px',
                                backgroundColor: 'var(--card-bg)',
                                border: detailOferta?.id === o.id
                                    ? '2px solid var(--color-primary)'
                                    : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                position: 'relative',
                                boxShadow: detailOferta?.id === o.id ? '0 8px 20px rgba(0,102,255,0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                            }}
                            onMouseEnter={(e) => {
                                if (detailOferta?.id !== o.id) {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.06)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (detailOferta?.id !== o.id) {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                                }
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '28px'
                                    }}>
                                        {strategyInfo.icon}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                            {o.productName}
                                        </h4>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            backgroundColor: 'rgba(0,102,255,0.06)',
                                            color: 'var(--color-primary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em'
                                        }}>
                                            {strategyInfo.label}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    backgroundColor: o.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                    color: o.status === 'active' ? 'var(--color-success)' : 'var(--text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}>
                                    {o.status === 'active' ? 'Activa' : 'Pausa'}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                padding: '16px',
                                borderRadius: '14px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Ganancia</p>
                                    <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-success)' }}>{formatCurrency(o.estimatedProfit)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Margen</p>
                                    <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{o.estimatedMarginPercent}%</p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '4px'
                            }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <ActionBtn
                                        icon={<Eye size={16} />}
                                        title="Ver detalles"
                                        onClick={(e) => { e.stopPropagation(); setDetailOferta(o); }}
                                    />
                                    <ActionBtn
                                        icon={<Copy size={16} />}
                                        title="Duplicar"
                                        onClick={(e) => { e.stopPropagation(); handleDuplicate(o); }}
                                    />
                                </div>
                                {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_offers) && (
                                    <ActionBtn
                                        icon={<Trash2 size={16} />}
                                        title="Eliminar"
                                        onClick={(e) => { e.stopPropagation(); checkDelete(o.id); }}
                                        danger
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {
                filtered.length === 0 && ofertas.length > 0 && (
                    <div style={{
                        padding: '80px 24px',
                        textAlign: 'center',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '24px',
                        border: '1px dashed var(--border-color)',
                        marginTop: '24px'
                    }}>
                        <Filter size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px', opacity: 0.5 }} />
                        <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            No hay ofertas con estos filtros
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Prueba seleccionando otra categoría o crea una nueva oferta.
                        </p>
                    </div>
                )
            }

            {/* Detail Panel */}
            {detailOferta && (
                <OfertaDetailPanel
                    oferta={detailOferta as Oferta}
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
                description="¿Estás seguro de eliminar esta oferta? Esta acción no se puede deshacer y se perderán los datos vinculados."
                confirmLabel="Sí, eliminar"
                variant="danger"
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
}

function ActionBtn({ icon, title, onClick, danger = false }: { icon: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
                cursor: 'pointer', color: danger ? 'var(--color-error)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = danger ? 'var(--color-error)' : 'var(--color-primary)';
                e.currentTarget.style.color = danger ? 'var(--color-error)' : 'var(--color-primary)';
                e.currentTarget.style.backgroundColor = danger ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0, 102, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = danger ? 'var(--color-error)' : 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
        >
            {icon}
        </button>
    );
}
