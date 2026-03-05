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
                    className="ofertas-page-header"
                >
                    <div style={{ flex: '1 1 300px' }} className="ofertas-title-section">
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
                        justifyContent: 'flex-end'
                    }} className="ofertas-actions-section">
                        {/* Indicador de Cuota Refinado como en Costeos */}
                        <div style={{
                            padding: '6px 16px',
                            backgroundColor: 'transparent',
                            borderRadius: '40px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }} className="quota-indicator-card">
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cuota:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: quota.limit !== -1 && quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)' }}>
                                {quota.used}/{quota.limit === -1 ? '∞' : quota.limit} Ofertas
                            </span>
                            <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${quota.limit === -1 ? 0 : Math.min((quota.used / quota.limit) * 100, 100)}%`,
                                    height: '100%',
                                    backgroundColor: quota.limit !== -1 && quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="header-buttons-group">
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
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                            >
                                <HelpCircle size={18} />
                            </button>

                            <button
                                onClick={handleCreateNew}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    backgroundColor: 'var(--color-primary)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    boxShadow: '0 4px 6px rgba(0, 102, 255, 0.2)',
                                    whiteSpace: 'nowrap'
                                }}
                                className="create-oferta-btn"
                            >
                                <Plus size={18} strokeWidth={2.5} /> Crear Oferta
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
