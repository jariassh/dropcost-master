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

        const costeos = await costeoService.listCosteos(tiendaActual.id);
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
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <div>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <Gift size={24} style={{ color: 'var(--color-primary)' }} />
                            Ofertas Irresistibles
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Crea ofertas estratégicas para aumentar conversión y ticket promedio
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Indicador de Cuota */}
                        <div style={{
                            padding: '8px 16px', backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '12px', border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Cuota: <span style={{ color: quota.limit !== -1 && quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)' }}>
                                    {quota.used}/{quota.limit === -1 ? '∞' : quota.limit} Ofertas
                                </span>
                            </div>
                            <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${quota.limit === -1 ? 0 : Math.min((quota.used / quota.limit) * 100, 100)}%`,
                                    height: '100%',
                                    backgroundColor: quota.limit !== -1 && quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)'
                                }} />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowEducation(true)}
                            title="Ver tutorial"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--card-bg)',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <HelpCircle size={18} />
                        </button>

                        <button
                            onClick={handleCreateNew}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#fff',
                                backgroundColor: 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-dark, #003D99)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <Plus size={16} /> Crear Oferta
                        </button>
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
