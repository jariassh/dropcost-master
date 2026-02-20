import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { PlanLimits } from '@/types/plans.types';

interface PremiumFeatureGuardProps {
    featureKey: keyof PlanLimits;
    title?: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    customFallback?: React.ReactNode;
}

export const PremiumFeatureGuard: React.FC<PremiumFeatureGuardProps> = ({
    featureKey,
    title = 'Funcionalidad Premium',
    description = 'Esta funcionalidad es exclusiva para planes superiores.',
    children,
    customFallback
}) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // 1. Resolve role and plan
    const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
    const isSuperAdmin = user?.rol === 'superadmin';
    const hasPlanDetails = !!user?.plan?.limits;
    const limits = user?.plan?.limits;
    const limitValue = limits?.[featureKey];

    // 2. Access Decision Logic
    let hasAccess = false;

    // A. If we have explicit plan details, follow them strictly
    if (hasPlanDetails) {
        if (limitValue === true) {
            hasAccess = true;
        } else if (typeof limitValue === 'number') {
            hasAccess = limitValue > 0 || limitValue === -1;
        } else if (typeof limitValue === 'string') {
            const val = (limitValue as string).toLowerCase();
            if (val === 'true') hasAccess = true;
            else {
                const n = parseInt(val, 10);
                if (!isNaN(n) && (n > 0 || n === -1)) hasAccess = true;
            }
        }
    }

    // B. SuperAdmin/Admin Bypass
    // - SuperAdmins always bypass.
    // - Admins ONLY bypass if they don't have a plan assigned (managing from DB)
    //   AND if they were not explicitly blocked in step A.
    if (!hasAccess) {
        if (isSuperAdmin) {
            hasAccess = true;
        } else if (isAdmin) {
            // Si el admin no tiene plan asignado, le damos paso por defecto para gestión
            if (!user?.planId || user?.planId === '') {
                hasAccess = true;
            }
            // Si tiene planId (incluyendo 'plan_free'), y no tiene detalles que den permiso,
            // se queda bloqueado. Esto permite a los desarrolladores testear el paywall.
        }
    }

    // Grant access if confirmed
    if (hasAccess) {
        return <>{children}</>;
    }

    if (customFallback) {
        return <>{customFallback}</>;
    }

    return (
        <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
            <div style={{
                width: '64px', height: '64px', margin: '0 auto 24px',
                borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f59e0b'
            }}>
                <Lock size={32} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>{title}</h2>
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
                {description}
            </div>
            <button
                onClick={() => navigate('/pricing')}
                style={{
                    padding: '12px 24px', borderRadius: '10px', border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 102, 255, 0.35)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 255, 0.25)';
                }}
            >
                Ver Planes Disponibles
            </button>
        </div>
    );
};
