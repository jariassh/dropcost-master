import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

/**
 * Guardian de Suscripción: Protege las rutas que requieren un plan activo.
 * Permite el paso libre a administradores y evita bucles en la página de planes.
 */
export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    // 1. Si no está logueado, al login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Bypass para Administradores
    const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
    if (isAdmin) {
        return <>{children}</>;
    }

    // 3. Definir rutas que SIEMPRE deben ser accesibles (evitar bucles)
    const publicAppPaths = ['/pricing', '/configuracion', '/soporte'];
    if (publicAppPaths.includes(location.pathname)) {
        return <>{children}</>;
    }

    // 4. Verificación de Suscripción
    // El usuario debe tener un planID y su estado debe ser activo o trial
    const hasNoPlan = !user?.planId || user.planId === 'plan_free';
    const isSubscriptionInactive = user?.estadoSuscripcion !== 'activa' && user?.estadoSuscripcion !== 'trial';

    if (hasNoPlan || isSubscriptionInactive) {
        // Redirigir a pricing solo si no cumple los requisitos
        return <Navigate to="/pricing" replace />;
    }

    // 5. Todo en orden, mostrar contenido protegido
    return <>{children}</>;
};
