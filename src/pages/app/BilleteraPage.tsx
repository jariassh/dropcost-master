import React, { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export function BilleteraPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirigir a comisiones si entra exactamente a /billetera
    useEffect(() => {
        if (location.pathname === '/billetera' || location.pathname === '/billetera/') {
            navigate('/billetera/comisiones', { replace: true });
        }
    }, [location.pathname, navigate]);

    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: isMobile ? '12px' : '20px', boxSizing: 'border-box' }}>
            <Outlet />
        </div>
    );
}
