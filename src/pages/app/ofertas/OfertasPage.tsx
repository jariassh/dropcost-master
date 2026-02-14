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

const EDUCATION_KEY = 'dropcost_ofertas_education_seen';

export function OfertasPage() {
    const navigate = useNavigate();
    const [showEducation, setShowEducation] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const seen = localStorage.getItem(EDUCATION_KEY);
        if (!seen) {
            setShowEducation(true);
        }
        setLoaded(true);
    }, []);

    function handleEducationComplete() {
        localStorage.setItem(EDUCATION_KEY, 'true');
        setShowEducation(false);
    }

    function handleCreateNew() {
        setIsWizardOpen(true);
    }

    if (!loaded) return null;

    if (showEducation) {
        return <OfertasEducation onComplete={handleEducationComplete} />;
    }

    return (
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

                <div style={{ display: 'flex', gap: '8px' }}>
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
    );
}
