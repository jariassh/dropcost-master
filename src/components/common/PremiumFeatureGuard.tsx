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

    const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
    const hasAccess = user?.plan?.limits?.[featureKey];

    // Grant access if admin or if plan includes the feature
    if (isAdmin || hasAccess) {
        return <>{children}</>;
    }

    if (customFallback) {
        return <>{customFallback}</>;
    }

    return (
        <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
            <div style={{
                width: '80px', height: '80px', margin: '0 auto 24px',
                borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f59e0b'
            }}>
                <Lock size={40} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>{title}</h1>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
                {description}
            </p>
            <button
                onClick={() => navigate('/pricing')}
                style={{
                    padding: '14px 32px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                Ver Planes Disponibles
            </button>
        </div>
    );
};
