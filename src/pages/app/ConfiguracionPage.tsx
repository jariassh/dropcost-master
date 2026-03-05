import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export function ConfiguracionPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to profile if exactly on /configuracion
    useEffect(() => {
        if (location.pathname === '/configuracion' || location.pathname === '/configuracion/') {
            navigate('/configuracion/perfil', { replace: true });
        }
    }, [location.pathname, navigate]);

    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Redirect to profile if exactly on /configuracion
    useEffect(() => {
        if (location.pathname === '/configuracion' || location.pathname === '/configuracion/') {
            navigate('/configuracion/perfil', { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: isMobile ? '12px' : '20px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
                <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    Configuración del Sistema
                </h1>
                <p style={{ margin: 0, fontSize: isMobile ? '12px' : '14px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    Gestiona tus datos personales, tiendas, integraciones y seguridad desde un solo lugar.
                </p>
            </div>

            <main>
                <Outlet />
            </main>
        </div>
    );
}
