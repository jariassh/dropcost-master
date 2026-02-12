/**
 * OfertaWizard - Container del wizard de 4 pasos.
 * Maneja estado global del wizard y navegación entre pasos.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepIndicator, useToast } from '@/components/common';
import { WizardStep1Strategy } from './WizardStep1Strategy';
import { WizardStep2Costeo } from './WizardStep2Costeo';
import { WizardStep3Builder } from './WizardStep3Builder';
import { WizardStep4Preview } from './WizardStep4Preview';
import { calculateDiscount, calculateBundle, calculateGift } from './ofertasCalculations';
import type { StrategyType, DiscountConfig, BundleConfig, GiftConfig, Oferta } from '@/types/ofertas';
import type { SavedCosteo } from '@/types/simulator';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

const STEPS = ['Estrategia', 'Costeo', 'Configurar', 'Confirmar'];

const DEFAULT_DISCOUNT: DiscountConfig = { discountPercent: 10, offerPrice: 0, newProfit: 0, newMarginPercent: 0 };
const DEFAULT_BUNDLE: BundleConfig = { quantity: 5, marginPercent: 50, usePredefinedTable: false, priceTable: [] };
const DEFAULT_GIFT: GiftConfig = { giftType: 'muestra_gratis', giftCost: 0, description: '', perceivedValue: 0, newProfit: 0 };

export function OfertaWizard() {
    const navigate = useNavigate();
    const toast = useToast();

    const [step, setStep] = useState(1);
    const [strategyType, setStrategyType] = useState<StrategyType | null>(null);
    const [selectedCosteo, setSelectedCosteo] = useState<SavedCosteo | null>(null);
    const [discountConfig, setDiscountConfig] = useState<DiscountConfig>(DEFAULT_DISCOUNT);
    const [bundleConfig, setBundleConfig] = useState<BundleConfig>(DEFAULT_BUNDLE);
    const [giftConfig, setGiftConfig] = useState<GiftConfig>(DEFAULT_GIFT);

    const canGoNext = useCallback((): boolean => {
        if (step === 1) return strategyType !== null;
        if (step === 2) return selectedCosteo !== null;
        if (step === 3) return true;
        return true;
    }, [step, strategyType, selectedCosteo]);

    function handleNext() {
        if (!canGoNext()) return;

        // Initialize configs when entering step 3
        if (step === 2 && selectedCosteo) {
            const price = selectedCosteo.results.suggestedPrice;
            const profit = selectedCosteo.results.netProfitPerSale;
            const supplierCost = selectedCosteo.inputs.productCost;

            if (strategyType === 'descuento') {
                const res = calculateDiscount(price, profit, 10);
                setDiscountConfig({ discountPercent: 10, offerPrice: res.offerPrice, newProfit: res.newProfit, newMarginPercent: res.newMarginPercent });
            } else if (strategyType === 'bundle') {
                const table = calculateBundle(price, supplierCost, profit, 50, 5);
                setBundleConfig({ quantity: 5, marginPercent: 50, usePredefinedTable: false, priceTable: table });
            } else {
                setGiftConfig({ giftType: 'muestra_gratis', giftCost: 0, description: '', perceivedValue: price, newProfit: profit });
            }
        }

        setStep(Math.min(4, step + 1));
    }

    function handleBack() {
        setStep(Math.max(1, step - 1));
    }

    function handleActivate() {
        if (!strategyType || !selectedCosteo) return;

        let estimatedProfit = 0;
        let estimatedMargin = 0;

        if (strategyType === 'descuento') {
            estimatedProfit = discountConfig.newProfit;
            estimatedMargin = discountConfig.newMarginPercent;
        } else if (strategyType === 'bundle') {
            const lastRow = bundleConfig.priceTable[bundleConfig.priceTable.length - 1];
            estimatedProfit = lastRow?.totalProfit ?? 0;
            estimatedMargin = selectedCosteo.inputs.desiredMarginPercent;
        } else {
            estimatedProfit = giftConfig.newProfit;
            estimatedMargin = selectedCosteo.results.suggestedPrice > 0
                ? (giftConfig.newProfit / selectedCosteo.results.suggestedPrice) * 100
                : 0;
        }

        const oferta: Oferta = {
            id: crypto.randomUUID(),
            userId: 'default',
            storeId: 'default',
            costeoId: selectedCosteo.id,
            productName: selectedCosteo.productName,
            strategyType,
            discountConfig: strategyType === 'descuento' ? discountConfig : undefined,
            bundleConfig: strategyType === 'bundle' ? bundleConfig : undefined,
            giftConfig: strategyType === 'obsequio' ? giftConfig : undefined,
            estimatedProfit: Math.round(estimatedProfit * 100) / 100,
            estimatedMarginPercent: Math.round(estimatedMargin * 100) / 100,
            status: 'activa',
            createdAt: new Date().toISOString(),
            activatedAt: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem('dropcost_ofertas') || '[]') as Oferta[];
        existing.unshift(oferta);
        localStorage.setItem('dropcost_ofertas', JSON.stringify(existing));

        toast.success('¡Oferta activada!', `${selectedCosteo.productName} con estrategia ${strategyType}`);
        navigate('/ofertas');
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/ofertas')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px', borderRadius: '8px',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
                            cursor: 'pointer', color: 'var(--text-primary)',
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Crear Oferta
                    </h1>
                </div>
                <button
                    onClick={() => navigate('/ofertas')}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Step Indicator */}
            <StepIndicator steps={STEPS} currentStep={step} />

            {/* Step Content */}
            <div
                style={{
                    padding: '28px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-sm)',
                    marginTop: '16px',
                    animation: 'fadeIn 200ms ease',
                }}
            >
                {step === 1 && (
                    <WizardStep1Strategy selected={strategyType} onChange={setStrategyType} />
                )}
                {step === 2 && (
                    <WizardStep2Costeo
                        selectedCosteoId={selectedCosteo?.id ?? ''}
                        onSelect={setSelectedCosteo}
                    />
                )}
                {step === 3 && selectedCosteo && strategyType && (
                    <WizardStep3Builder
                        strategyType={strategyType}
                        costeo={selectedCosteo}
                        discountConfig={discountConfig}
                        bundleConfig={bundleConfig}
                        giftConfig={giftConfig}
                        onDiscountChange={setDiscountConfig}
                        onBundleChange={setBundleConfig}
                        onGiftChange={setGiftConfig}
                    />
                )}
                {step === 4 && selectedCosteo && strategyType && (
                    <WizardStep4Preview
                        strategyType={strategyType}
                        costeo={selectedCosteo}
                        discountConfig={discountConfig}
                        bundleConfig={bundleConfig}
                        giftConfig={giftConfig}
                    />
                )}
            </div>

            {/* Navigation buttons */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                    gap: '12px',
                }}
            >
                <button
                    onClick={handleBack}
                    disabled={step === 1}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '12px 20px', fontSize: '14px', fontWeight: 600,
                        color: step === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: step === 1 ? 'not-allowed' : 'pointer',
                        opacity: step === 1 ? 0.5 : 1,
                    }}
                >
                    <ChevronLeft size={16} /> Anterior
                </button>

                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        disabled={!canGoNext()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                            color: '#fff',
                            backgroundColor: canGoNext() ? 'var(--color-primary)' : 'var(--text-tertiary)',
                            border: 'none', borderRadius: '8px',
                            cursor: canGoNext() ? 'pointer' : 'not-allowed',
                            transition: 'all 150ms ease',
                        }}
                    >
                        Siguiente <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleActivate}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 28px', fontSize: '14px', fontWeight: 700,
                            color: '#fff',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            border: 'none', borderRadius: '8px',
                            cursor: 'pointer', transition: 'all 150ms ease',
                            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)';
                        }}
                    >
                        <Sparkles size={16} /> Activar Oferta
                    </button>
                )}
            </div>
        </div>
    );
}
