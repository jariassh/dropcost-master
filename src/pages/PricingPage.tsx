
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { plansService } from '../services/plansService';
import { paymentService } from '../services/paymentService';
import { Plan } from '@/types/plans.types';
import { PlanCard } from '../components/plans/PlanCard';
import { Loader2 } from 'lucide-react';
import { obtenerPaisPorCodigo } from '@/services/paisesService';
import { fetchExchangeRates, getDisplayCurrency } from '@/utils/currencyUtils';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/common';

export const PricingPage: React.FC = () => {
    const { user } = useAuthStore();
    const toast = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [targetCurrency, setTargetCurrency] = useState('COP');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

    // Billing State
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'semiannual'>('monthly');
    const [isRedirecting, setIsRedirecting] = useState(false);

    const currentPlanId = user?.planId || 'plan_free';

    useEffect(() => {
        const loadPlans = async () => {
            try {
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

    // Detect Currency & Rates (Simplified from previous version)
    useEffect(() => {
        const initCurrency = async () => {
            if (user?.pais) {
                try {
                    const paisInfo = await obtenerPaisPorCodigo(user.pais);
                    if (paisInfo) {
                        const currency = getDisplayCurrency(user.pais, paisInfo.moneda_codigo);
                        setTargetCurrency(currency);
                    }
                } catch (e) { console.error(e); }
            }
            // Fetch rates base USD
            const rates = await fetchExchangeRates('USD');
            setExchangeRates(rates);
        };
        initCurrency();
    }, [user]);

    const getPriceDisplay = (plan: Plan) => {
        const baseCurrency = plan.currency || 'COP';
        const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_semiannual;

        if (baseCurrency === targetCurrency) {
            return formatCurrency(price, targetCurrency);
        }

        if (!exchangeRates) return formatCurrency(price, baseCurrency);

        const rateFrom = baseCurrency === 'USD' ? 1 : exchangeRates[baseCurrency];
        const rateTo = targetCurrency === 'USD' ? 1 : exchangeRates[targetCurrency];

        if (!rateFrom || !rateTo) return formatCurrency(price, baseCurrency);

        const priceInUSD = price / rateFrom;
        const priceInTarget = priceInUSD * rateTo;

        return formatCurrency(priceInTarget, targetCurrency);
    };

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.slug === currentPlanId) return;

        if (plan.slug === 'plan_free') {
            toast.info('Plan Gratuito', 'Para cambiar al plan gratuito, por favor espera a que finalice tu suscripción actual.');
            return;
        }

        try {
            setIsRedirecting(true);
            const initPoint = await paymentService.createCheckoutSession(plan.slug, billingPeriod);

            if (!initPoint) {
                throw new Error('No se pudo generar el link de pago.');
            }

            console.log('Redirecting to:', initPoint);
            // Redirect to Mercado Pago
            window.location.href = initPoint;
        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error('Error al iniciar pago', error.message || 'Hubo un problema al conectar con la pasarela.');
            setIsRedirecting(false);
        }
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
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    Planes que Escalan Contigo
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px' }}>
                    Sin contratos forzosos. Cancela cuando quieras.
                </p>

                {/* Billing Toggle */}
                <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '16px' }}>
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: billingPeriod === 'monthly' ? 'var(--card-bg)' : 'transparent',
                            color: billingPeriod === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            boxShadow: billingPeriod === 'monthly' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Pago Mensual
                    </button>
                    <button
                        onClick={() => setBillingPeriod('semiannual')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: billingPeriod === 'semiannual' ? 'var(--card-bg)' : 'transparent',
                            color: billingPeriod === 'semiannual' ? 'var(--color-primary)' : 'var(--text-secondary)', // Highlight semiannual
                            boxShadow: billingPeriod === 'semiannual' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        Semestral
                        <span style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '10px' }}>
                            AHORRA 15%
                        </span>
                    </button>
                </div>
            </div>

            {/* Loading Overlay for Redirect */}
            {isRedirecting && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 100,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
                    <p style={{ marginTop: '16px', fontSize: '18px', fontWeight: 600 }}>Redirigiendo a Mercado Pago...</p>
                </div>
            )}

            {/* Plans Grid */}
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
                            displayedPrice={getPriceDisplay(plan)}
                            period={billingPeriod}
                        />
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '64px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    ¿Necesitas algo más específico? Contáctanos para soluciones Enterprise.
                </p>
            </div>
        </div>
    );
};
