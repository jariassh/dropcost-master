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

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    Configuración del Sistema
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-tertiary)' }}>
                    Gestiona tus datos personales, tiendas, integraciones y seguridad desde un solo lugar.
                </p>
            </div>

            <main>
                <Outlet />
            </main>
        </div>
    );
}
