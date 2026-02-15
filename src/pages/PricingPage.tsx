import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { plansService } from '../services/plansService';
import { Plan } from '@/types/plans.types';
import { PlanCard } from '../components/plans/PlanCard';
import { Loader2 } from 'lucide-react';

export const PricingPage: React.FC = () => {
    const { user } = useAuthStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Default to 'plan_free' slug if user has no plan
    // Note: We need to match this against plan.slug or plan.id depeding on what's stored in user.planId
    // Currently user.planId is likely 'plan_free' (string from old constant/migration slug)
    const currentPlanId = user?.planId || 'plan_free';

    useEffect(() => {
        const loadPlans = async () => {
            try {
                // Fetch Active AND Public plans only
                const data = await plansService.getPlans(true, true);
                setPlans(data);
            } catch (error) {
                console.error('Error loading pricing plans:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPlans();
    }, []);

    const handleSelectPlan = (plan: Plan) => {
        console.log('Selected Plan:', plan.slug);

        if (plan.slug === currentPlanId || plan.id === currentPlanId) return;

        alert(`Has seleccionado el plan ${plan.name}. Integración de pago pendiente.`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
        );
    }

    return (
        <div style={{
            padding: '40px 24px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    Planes que Escalan Contigo
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Elige el plan perfecto para potenciar tu negocio de dropshipping. Sin compromisos, cancela cuando quieras.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                alignItems: 'stretch'
            }}>
                {plans.map((plan) => (
                    <div key={plan.id} style={{ display: 'flex' }}>
                        <PlanCard
                            plan={plan}
                            isCurrent={currentPlanId === plan.slug || currentPlanId === plan.id}
                            onSelect={handleSelectPlan}
                        />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '64px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    ¿Necesitas algo más específico?
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Contáctanos para soluciones personalizadas y soporte enterprise.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Chat con Ventas
                </div>
            </div>
        </div>
    );
};
