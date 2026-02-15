import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { plansService } from '../services/plansService';
import { Plan } from '@/types/plans.types';
import { PlanCard } from '../components/plans/PlanCard';
import { Loader2 } from 'lucide-react';
import { obtenerPaisPorCodigo } from '@/services/paisesService';
import { fetchExchangeRates, convertPrice, getDisplayCurrency } from '@/utils/currencyUtils';
import { formatCurrency } from '@/lib/format';

export const PricingPage: React.FC = () => {
    const { user } = useAuthStore();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [targetCurrency, setTargetCurrency] = useState('COP');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

    // Default to 'plan_free' slug if user has no plan
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

    // Detect User Currency
    useEffect(() => {
        const detectCurrency = async () => {
            if (user?.pais) {
                try {
                    const paisInfo = await obtenerPaisPorCodigo(user.pais);
                    if (paisInfo) {
                        const currency = getDisplayCurrency(user.pais, paisInfo.moneda_codigo);
                        setTargetCurrency(currency);
                    }
                } catch (error) {
                    console.error('Error detecting currency:', error);
                }
            }
        };
        detectCurrency();
    }, [user]);

    // Fetch Exchange Rates when targetCurrency changes
    useEffect(() => {
        const loadRates = async () => {
            // We fetch rates based on the TARGET currency to easily convert FROM any base
            // actually open exchange rates free tier usually gives rates relative to USD.
            // convertPrice util handles logic given rates relative to USD? 
            // Wait, fetchExchangeRates(base) gets rates relative to base.
            // If we have plans in COP and USD, and target is MXN.
            // We ideally want rates relative to... wait.
            // The free API usually defaults to USD base.
            // let's assume fetchExchangeRates('USD') gives us USD -> XXX.

            // To convert COP -> MXN using USD rates:
            // COP -> USD (divide by COP rate) -> MXN (multiply by MXN rate)
            // My convertPrice util in previous step was: amount * rates[target]
            // This assumes 'rates' are relative to the 'amount' currency.
            // But if plans have DIFFERENT base currencies, we need different rate sets?
            // Or we just fetch USD rates and do cross-calculation.

            // Optimization: Fetch rates for USD. 
            // Then Convert(Amount, From, To) = Amount / Rate(From) * Rate(To)

            // Let's check currencyUtils.ts content again in my thought process...
            // I implemented: fetchExchangeRates(base).
            // If I call fetchExchangeRates('USD'), I get { COP: 4000, MXN: 17 ... }
            // To convert 10000 COP to MXN:
            // 10000 / 4000 (USD value) * 17 (MXN value).

            // So I should fetch USD rates once.
            const rates = await fetchExchangeRates('USD');
            setExchangeRates(rates);
        };
        loadRates();
    }, []);

    const getPriceDisplay = (plan: Plan) => {
        const baseCurrency = plan.currency || 'COP'; // Default from DB might be empty implies COP? Or we enforce it.
        const price = plan.price_monthly;

        if (baseCurrency === targetCurrency) {
            return formatCurrency(price, targetCurrency);
        }

        if (!exchangeRates) return formatCurrency(price, baseCurrency);

        // Cross conversion using USD rates
        const rateFrom = baseCurrency === 'USD' ? 1 : exchangeRates[baseCurrency];
        const rateTo = targetCurrency === 'USD' ? 1 : exchangeRates[targetCurrency];

        if (!rateFrom || !rateTo) return formatCurrency(price, baseCurrency);

        const priceInUSD = price / rateFrom;
        const priceInTarget = priceInUSD * rateTo;

        return formatCurrency(priceInTarget, targetCurrency);
    };

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
                <span style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    backgroundColor: 'rgba(0, 102, 255, 0.1)',
                    color: 'var(--color-primary)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    marginBottom: '16px'
                }}>
                    Precios en {targetCurrency}
                </span>
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
                            displayedPrice={getPriceDisplay(plan)}
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
