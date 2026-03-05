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
import { useToast, PageHeader, Button } from '@/components/common';
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            title="Creador de Ofertas"
            description="La creación de ofertas estratégicas es una funcionalidad avanzada. Mejora tu plan para aumentar tus conversiones y el ticket promedio de tus ventas."
        >
            <div>
                <PageHeader
                    title="Creador de"
                    highlight="Ofertas"
                    description="Configura estrategias de venta para maximizar tu rentabilidad y escala tu negocio rápidamente."
                    icon={Gift}
                    isMobile={isMobile}
                    actions={
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flexWrap: 'wrap',
                            justifyContent: isMobile ? 'stretch' : 'flex-end',
                            width: isMobile ? '100%' : 'auto'
                        }}>
                            {/* Indicador de Cuota Estandarizado */}
                            <div style={{
                                padding: '8px 16px', backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                flex: isMobile ? 1 : 'none',
                                justifyContent: isMobile ? 'space-between' : 'flex-start'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Cuota: <span style={{ color: (quota.limit !== -1 && quota.used >= quota.limit) ? 'var(--color-error)' : 'var(--color-primary)' }}>
                                        {quota.used}/{quota.limit === -1 ? '∞' : quota.limit} Ofertas
                                    </span>
                                </div>
                                <div style={{ width: isMobile ? '40%' : '60px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${quota.limit === -1 ? 0 : Math.min((quota.used / Math.max(1, quota.limit)) * 100, 100)}%`,
                                        height: '100%',
                                        backgroundColor: (quota.limit !== -1 && quota.used >= quota.limit) ? 'var(--color-error)' : 'var(--color-primary)'
                                    }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                                <button
                                    onClick={() => setShowEducation(true)}
                                    title="Ver tutorial"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        flexShrink: 0
                                    }}
                                >
                                    <HelpCircle size={18} />
                                </button>

                                <Button
                                    variant="primary"
                                    onClick={handleCreateNew}
                                    leftIcon={<Plus size={16} />}
                                    fullWidth={isMobile}
                                >
                                    Nueva Oferta
                                </Button>
                            </div>
                        </div>
                    }
                />

                <OfertasDashboard key={refreshKey} onCreateNew={handleCreateNew} />

                <OfertaWizard
                    isOpen={isWizardOpen}
                    onClose={() => {
                        setIsWizardOpen(false);
                        setRefreshKey(p => p + 1);
                    }}
                />

                <style>{`
                    @media (max-width: 767px) {
                        .ofertas-page-header {
                            flex-direction: column !important;
                            gap: 20px !important;
                            margin-bottom: 24px !important;
                        }
                        .ofertas-title-section {
                            flex: 1 1 auto !important;
                            text-align: center !important;
                        }
                        .ofertas-title-section h1 {
                            justify-content: center !important;
                        }
                        .ofertas-actions-section {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: 12px !important;
                            width: 100% !important;
                            align-items: stretch !important;
                        }
                        .quota-indicator-card {
                            width: 100% !important;
                            justify-content: center !important;
                        }
                        .header-buttons-group {
                            display: flex !important;
                            width: 100% !important;
                            gap: 12px !important;
                        }
                        .create-oferta-btn {
                            flex: 1 !important;
                        }
                    }
                `}</style>
            </div>
        </PremiumFeatureGuard>
    );
}
