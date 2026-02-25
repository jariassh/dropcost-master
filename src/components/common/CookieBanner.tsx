import React, { useState, useEffect } from 'react';
import { cookieService, CookiePreferences } from '@/services/cookieService';
import { Shield, Settings, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

    useEffect(() => {
        const prefs = cookieService.getPreferences();
        if (!prefs) {
            // Mostrar banner con un pequeño delay para efecto premium
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
        setPreferences(prefs);
    }, []);

    const handleAcceptAll = () => {
        cookieService.acceptAll();
        setIsVisible(false);
    };

    const handleRejectAll = () => {
        cookieService.rejectAll();
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 48px)',
            maxWidth: '1000px',
            backgroundColor: 'var(--bg-primary)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '24px',
            animation: 'slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            opacity: 0.98
        }} className="cookie-banner">
            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @media (max-width: 768px) {
                    .cookie-banner {
                        flex-direction: column !important;
                        text-align: center;
                        padding: 20px !important;
                        bottom: 16px !important;
                    }
                    .cookie-actions {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

            <div style={{
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                padding: '12px',
                borderRadius: '12px',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Shield size={24} />
            </div>

            <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}>Tu privacidad es Master</h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Usamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico.
                    Consulta nuestra <Link to="/cookies" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Política de Cookies</Link>.
                </p>
            </div>

            <div className="cookie-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleRejectAll}
                    style={{
                        padding: '10px 18px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                >
                    Rechazar
                </button>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))}
                    style={{
                        padding: '10px 18px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                >
                    <Settings size={16} />
                    Personalizar
                </button>
                <button
                    onClick={handleAcceptAll}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Aceptar Todas
                </button>
            </div>
        </div>
    );
}
