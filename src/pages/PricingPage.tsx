
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { plansService } from '../services/plansService';
import { paymentService } from '../services/paymentService';
import { Plan } from '@/types/plans.types';
import { PlanCard } from '../components/plans/PlanCard';
import { Loader2, MessageCircle } from 'lucide-react';
import { configService, GlobalConfig } from '../services/configService';
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
    const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);

    // Billing State
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'semiannual'>('monthly');
    const [isRedirecting, setIsRedirecting] = useState(false);

    const currentPlanId = user?.planId || 'plan_free';

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                // 1. Load Plans
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

                // 4. Fetch Global Config
                const config = await configService.getConfig();
                setGlobalConfig(config);
            } catch (error) {
                console.error('Error initializing pricing page:', error);
            } finally {
                setLoading(false);
            }
        };
        initialize();
    }, [user?.pais]);
    // Quitamos [user] completo para evitar re-renders innecesarios, solo dependemos del país

    const getPriceDisplay = (plan: Plan) => {
        // Price Protection: If this is the current active plan, show what they actually paid
        if (currentPlanId === plan.slug && user?.plan_precio_pagado && user.plan_periodo === billingPeriod) {
            const paidAmount = user.plan_precio_pagado;
            // plan_precio_pagado puede estar en USD si fue asignado por admin/migración.
            // Detectamos si está en USD (< 500) y convertimos igual que los demás precios.
            const paidIsUSD = paidAmount < 500;
            if (paidIsUSD && targetCurrency !== 'USD' && exchangeRates) {
                const rateTo = targetCurrency === 'USD' ? 1 : (exchangeRates[targetCurrency] ?? 1);
                return formatCurrency(paidAmount * rateTo, targetCurrency);
            }
            return formatCurrency(paidAmount, targetCurrency);
        }

        const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_semiannual;

        // Detectar si el precio almacenado es en USD o COP usando el precio del periodo actual:
        // Heuristica: precio < 500 = USD (base), precio >= 500 = COP (ya convertido en BD).
        // Usar el precio del periodo seleccionado (no siempre price_monthly) para no mezclar
        // un monthly en USD con un semiannual que ya este en COP.
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

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.slug === currentPlanId) return;

        // 1. Get current paid amount normalized to monthly
        const paidAmount = user?.plan_precio_pagado || 0;
        const paidPeriod = user?.plan_periodo || 'monthly';
        const paidMonthlyEquiv = paidPeriod === 'semiannual' ? paidAmount / 6 : paidAmount;

        // 2. Get target plan amount normalized to monthly
        const targetAmount = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_semiannual;
        const targetMonthlyEquiv = billingPeriod === 'semiannual' ? targetAmount / 6 : targetAmount;

        // 3. Block Downgrades
        if (paidMonthlyEquiv > 0) {
            if (targetMonthlyEquiv < paidMonthlyEquiv) {
                toast.warning('Cambio de Plan', 'No puedes bajar a un plan de menor costo desde la aplicación. Por favor contacta a soporte o espera a que tu suscripción actual venza.');
                return;
            }
            if (plan.slug === 'plan_free') {
                toast.info('Plan Gratuito', 'Para volver al plan gratuito, espera a que finalice tu suscripción actual.');
                return;
            }
        }

        try {
            setIsRedirecting(true);
            const initPoint = await paymentService.createCheckoutSession(plan.slug, billingPeriod);

            if (!initPoint) {
                throw new Error('No se pudo generar el link de pago.');
            }

            // console.log('Redirecting to:', initPoint);
            // Redirect to Mercado Pago
            window.location.href = initPoint;
        } catch (error: any) {
            console.error('Payment Error:', error);
            toast.error('Error al iniciar pago', error.message || 'Hubo un problema al conectar con la pasarela.');
            setIsRedirecting(false);
        }
    };

    const calculateMaxSavings = () => {
        if (!plans || plans.length === 0) return 0;
        const paidPlans = plans.filter(p => p.price_monthly > 0 && p.price_semiannual > 0);
        if (paidPlans.length === 0) return 0;

        const savingsArr = paidPlans.map(plan => {
            const costSixMonths = plan.price_monthly * 6;
            const savings = costSixMonths - plan.price_semiannual;
            return Math.round((savings / costSixMonths) * 100);
        });

        return Math.max(...savingsArr);
    };

    const maxSavings = calculateMaxSavings();

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
                        {maxSavings > 0 && (
                            <span style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '10px' }}>
                                AHORRA {maxSavings}%
                            </span>
                        )}
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
                {plans.map((plan) => {
                    const isPlanCurrent = currentPlanId === plan.slug || currentPlanId === plan.id;
                    let isDisabled = false;
                    let disabledReason = '';

                    // 1. Get current paid amount normalized to monthly (with fallback for legacy users)
                    let paidAmount = user?.plan_precio_pagado || 0;
                    let paidPeriod = user?.plan_periodo || 'monthly';

                    if (paidAmount === 0 && currentPlanId !== 'plan_free') {
                        const currentPlanObj = plans.find(p => p.slug === currentPlanId || p.id === currentPlanId);
                        if (currentPlanObj) {
                            paidAmount = currentPlanObj.price_monthly;
                            paidPeriod = 'monthly';
                        }
                    }

                    const paidMonthlyEquiv = paidPeriod === 'semiannual' ? paidAmount / 6 : paidAmount;

                    // 2. Get target plan amount normalized to monthly
                    const targetAmount = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_semiannual;
                    const targetMonthlyEquiv = billingPeriod === 'semiannual' ? targetAmount / 6 : targetAmount;

                    if (paidMonthlyEquiv > 0 && !isPlanCurrent) {
                        // Comparison with 0.01 tolerance for floating point
                        if (targetMonthlyEquiv < (paidMonthlyEquiv - 0.01)) {
                            isDisabled = true;
                            disabledReason = 'No puedes bajar a un plan de menor costo desde la aplicación.';
                        } else if (plan.slug === 'plan_free') {
                            isDisabled = true;
                            disabledReason = 'Debes esperar a que venza tu suscripción actual para volver al plan gratuito.';
                        }
                    }

                    return (
                        <div key={plan.id} style={{ display: 'flex' }}>
                            <PlanCard
                                plan={plan}
                                isCurrent={isPlanCurrent}
                                isDisabled={isDisabled}
                                disabledReason={disabledReason}
                                onSelect={handleSelectPlan}
                                displayedPrice={getPriceDisplay(plan)}
                                period={billingPeriod}
                            />
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    ¿Necesitas algo más específico? Contáctanos para soluciones Enterprise.
                </p>
                {globalConfig?.telefono && (
                    <a
                        href={`https://wa.me/${globalConfig.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola, me gustaría recibir más información sobre los planes Enterprise de DropCost.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                    >
                        <button className="dc-button-secondary" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#25D366',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            <MessageCircle size={20} />
                            Contactar por WhatsApp
                        </button>
                    </a>
                )}
            </div>
        </div>
    );
};
