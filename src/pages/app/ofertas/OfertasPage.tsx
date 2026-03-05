/**
 * OfertasPage - Página principal del módulo Ofertas Irresistibles.
 * Muestra carousel educativo (primera vez) o dashboard de ofertas.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfertasEducation } from './OfertasEducation';
import { OfertasDashboard } from './OfertasDashboard';
import { OfertaWizard } from './OfertaWizard';
import { Gift, Plus, HelpCircle } from 'lucide-react';
import { PremiumFeatureGuard } from '@/components/common/PremiumFeatureGuard';
import { costeoService } from '@/services/costeoService';
import { useStoreStore } from '@/store/useStoreStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common';
import { ofertaService } from '@/services/ofertaService';

const EDUCATION_KEY = 'dropcost_ofertas_education_seen';

export function OfertasPage() {
    const navigate = useNavigate();
    const { tiendaActual } = useStoreStore();
    const toast = useToast();

    const [showEducation, setShowEducation] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [quota, setQuota] = useState({ used: 0, limit: 0 });
    const { user } = useAuthStore();

    useEffect(() => {
        const seen = localStorage.getItem(EDUCATION_KEY);
        if (!seen) {
            setShowEducation(true);
        }
        setLoaded(true);

        // Actualizar cuota
        const updateQuota = async () => {
            if (user?.id) {
                const count = await ofertaService.getOfertasCount(user.id);
                const limit = user?.plan?.limits?.offers_limit ?? 0;
                setQuota({ used: count, limit });
            }
        };

        updateQuota();
    }, [user?.id, user?.plan?.limits?.offers_limit, refreshKey]);

    function handleEducationComplete() {
        localStorage.setItem(EDUCATION_KEY, 'true');
        setShowEducation(false);
    }

    async function handleCreateNew() {
        if (!tiendaActual?.id) {
            toast.error('Tienda no seleccionada', 'Por favor selecciona una tienda para continuar.');
            return;
        }

        const costeos = await costeoService.listCosteos(tiendaActual.id, user?.id || '');
        if (costeos.length === 0) {
            toast.info('Sin costeos guardados', 'Primero debes crear un costeo en el simulador para basar tu oferta en él.');
            navigate('/mis-costeos');
            return;
        }

        setIsWizardOpen(true);
    }

    if (!loaded) return null;

    if (showEducation) {
        return <OfertasEducation onComplete={handleEducationComplete} />;
    }

    return (
        <PremiumFeatureGuard
            featureKey="offers_limit"
            title="Ofertas Irresistibles"
            description="La creación de ofertas estratégicas es una funcionalidad avanzada. Mejora tu plan para aumentar tus conversiones y el ticket promedio de tus ventas."
        >
            <div>
                {/* Page header */}
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '40px',
                        gap: '24px',
                    }}
                >
                    <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h1 style={{
                                fontSize: 'clamp(22px, 5vw, 28px)',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.04em'
                            }}>
                                <Gift size={32} style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
                                Ofertas Irresistibles
                            </h1>
                        </div>
                        <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', marginTop: '8px', maxWidth: '500px', lineHeight: 1.5 }}>
                            Configura estrategias de venta para maximizar tu rentabilidad y escala tu negocio rápidamente.
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                        flex: '1 1 auto',
                        justifyContent: 'flex-end'
                    }}>
                        {/* Indicador de Cuota Refinado */}
                        <div style={{
                            padding: '12px 18px',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            minWidth: '160px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            flex: '1 1 160px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cuota de Plan</span>
                                <span style={{ fontSize: '13px', fontWeight: 900, color: quota.limit !== -1 && quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)' }}>
                                    {quota.used} / {quota.limit === -1 ? '∞' : quota.limit}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${quota.limit === -1 ? 0 : Math.min((quota.used / quota.limit) * 100, 100)}%`,
                                    height: '100%',
                                    backgroundColor: quota.limit !== -1 && quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)',
                                    borderRadius: '10px'
                                }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto' }}>
                            <button
                                onClick={() => setShowEducation(true)}
                                title="Ver tutorial"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '18px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--card-bg)',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                            >
                                <HelpCircle size={22} />
                            </button>

                            <button
                                onClick={handleCreateNew}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    padding: '12px 28px',
                                    fontSize: '16px',
                                    fontWeight: 800,
                                    color: '#fff',
                                    backgroundColor: 'var(--color-primary)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 10px 25px rgba(0, 102, 255, 0.25)',
                                    flex: 1
                                }}
                            >
                                <Plus size={22} strokeWidth={3} /> Crear Oferta
                            </button>
                        </div>
                    </div>
                </div>

                <OfertasDashboard key={refreshKey} onCreateNew={handleCreateNew} />

                <OfertaWizard
                    isOpen={isWizardOpen}
                    onClose={() => {
                        setIsWizardOpen(false);
                        setRefreshKey(p => p + 1);
                    }}
                />
            </div>
        </PremiumFeatureGuard>
    );
}
