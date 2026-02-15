import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 1. Admin Bypass
    if (user?.rol === 'admin' || user?.rol === 'superadmin') {
        return <>{children}</>;
    }

    // 2. Check Subscription
    // Logic: Block if plan is 'free' OR subscription is NOT active.
    // Note: We check against 'plan_free' slug. If we change slugs later, this needs update.
    // Also handling case where planId might be null/undefined (new users).

    const isFreePlan = !user?.planId || user.planId === 'plan_free';
    const isInactive = user?.estadoSuscripcion !== 'activa' && user?.estadoSuscripcion !== 'trial'; // Allow trial if we add it

    if (isFreePlan || isInactive) {
        // User must pay. Redirect to pricing.
        return <Navigate to="/pricing" replace />;
    }

    // 3. User verifies all checks
    return <>{children}</>;
};
