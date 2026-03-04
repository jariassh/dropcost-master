import React, { useEffect, useState } from 'react';
import { Spinner } from '@/components/common';
import { plansService } from '@/services/plansService';
import { useAuthStore } from '@/store/authStore';
import { Plan } from '@/types/plans.types';
import { PlanCard } from '@/components/plans/PlanCard';
import { obtenerPaisPorCodigo } from '@/services/paisesService';
import { fetchExchangeRates, getDisplayCurrency } from '@/utils/currencyUtils';
import { formatCurrency } from '@/lib/format';

interface StepPlanSelectionProps {
    onComplete: () => void;
}

export function StepPlanSelection({ onComplete }: StepPlanSelectionProps) {
    const { user } = useAuthStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [targetCurrency, setTargetCurrency] = useState('COP');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

    const currentPlanId = user?.planId || 'plan_free';
    const hasActivePlan = user?.estadoSuscripcion === 'activa' || (currentPlanId !== 'plan_free');

    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Plans
                const data = await plansService.getPlans(true, true);
                setPlans(data);

                // 2. Detect User Currency
                if (user?.pais) {
                    const paisInfo = await obtenerPaisPorCodigo(user.pais);
                    if (paisInfo) {
                        const currency = getDisplayCurrency(user.pais, paisInfo.moneda_codigo);
                        setTargetCurrency(currency);
                    }
                }

                // 3. Fetch Exchange Rates
                const rates = await fetchExchangeRates('USD');
                setExchangeRates(rates);
            } catch (error) {
                console.error('Error initializing plan selection:', error);
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, [user?.pais]);

    const handleSelectPlan = async (plan: Plan) => {
        onComplete();
    };

    const getPriceDisplay = (plan: Plan) => {
        const price = plan.price_monthly;

        // Detection Logic (Heuristic: price < 500 = USD base)
        const isStoredInCOP = price >= 500;
        const baseCurrency = isStoredInCOP ? (plan.currency || 'COP') : 'USD';

        if (baseCurrency === targetCurrency) {
            return formatCurrency(price, targetCurrency);
        }

        if (!exchangeRates) return formatCurrency(price, baseCurrency);

        const rateFrom = baseCurrency === 'USD' ? 1 : (exchangeRates[baseCurrency] ?? 1);
        const rateTo = targetCurrency === 'USD' ? 1 : (exchangeRates[targetCurrency] ?? 1);

        if (!rateFrom || !rateTo) return formatCurrency(price, baseCurrency);

        const priceInUSD = price / rateFrom;
        const priceInTarget = priceInUSD * rateTo;

        return formatCurrency(priceInTarget, targetCurrency);
    };

    if (isLoading) {
        return (
            <div style={{
                padding: '100px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
            }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ padding: '0 8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    Selecciona tu Plan
                </h2>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px',
                alignItems: 'stretch',
                opacity: hasActivePlan ? 0.7 : 1,
                pointerEvents: hasActivePlan ? 'none' : 'auto'
            }}>
                {plans.map((plan) => (
                    <div key={plan.id} style={{ display: 'flex' }}>
                        <PlanCard
                            plan={plan}
                            isCurrent={currentPlanId === plan.slug || currentPlanId === plan.id}
                            onSelect={handleSelectPlan}
                            displayedPrice={getPriceDisplay(plan)}
                            period="monthly"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
