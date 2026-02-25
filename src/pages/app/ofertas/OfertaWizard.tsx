import { useState, useCallback } from 'react';
import { Modal, StepIndicator, useToast, Spinner } from '@/components/common';
import { WizardStep1Strategy } from './WizardStep1Strategy';
import { WizardStep2Costeo } from './WizardStep2Costeo';
import { WizardStep3Builder } from './WizardStep3Builder';
import { WizardStep4Preview } from './WizardStep4Preview';
import { calculateDiscount, calculateBundle, calculateGift } from './ofertasCalculations';
import type { StrategyType, DiscountConfig, BundleConfig, GiftConfig, Oferta } from '@/types/ofertas';
import type { SavedCosteo } from '@/types/simulator';
import { ChevronLeft, ChevronRight, Sparkles, X, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { ofertaService } from '@/services/ofertaService';

const STEPS = ['Estrategia', 'Costeo', 'Configurar', 'Confirmar'];

const DEFAULT_DISCOUNT: DiscountConfig = { discountPercent: 10, offerPrice: 0, newProfit: 0, newMarginPercent: 0 };
const DEFAULT_BUNDLE: BundleConfig = { quantity: 5, marginPercent: 50, usePredefinedTable: false, priceTable: [] };
const DEFAULT_GIFT: GiftConfig = { giftType: 'muestra_gratis', giftCost: 0, description: '', perceivedValue: 0, newProfit: 0 };

interface OfertaWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OfertaWizard({ isOpen, onClose }: OfertaWizardProps) {
    const toast = useToast();

    const [step, setStep] = useState(1);
    const [strategyType, setStrategyType] = useState<StrategyType | null>(null);
    const [selectedCosteo, setSelectedCosteo] = useState<SavedCosteo | null>(null);
    const [discountConfig, setDiscountConfig] = useState<DiscountConfig>(DEFAULT_DISCOUNT);
    const [bundleConfig, setBundleConfig] = useState<BundleConfig>(DEFAULT_BUNDLE);
    const [giftConfig, setGiftConfig] = useState<GiftConfig>(DEFAULT_GIFT);

    const { user } = useAuthStore();
    const tiendaActual = useStoreStore((state) => state.tiendaActual);
    const [isActivating, setIsActivating] = useState(false);

    const canGoNext = useCallback((): boolean => {
        if (step === 1) return strategyType !== null;
        if (step === 2) return selectedCosteo !== null;
        return true;
    }, [step, strategyType, selectedCosteo]);

    function handleNext() {
        if (!canGoNext()) return;

        if (step === 2 && selectedCosteo) {
            const price = selectedCosteo.results_json?.suggestedPrice ?? 0;
            const profit = selectedCosteo.results_json?.netProfitPerSale ?? 0;
            const supplierCost = selectedCosteo.inputs_json?.productCost ?? 0;

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

    async function handleActivate() {
        if (!strategyType || !selectedCosteo || !user?.id || !tiendaActual?.id) return;

        setIsActivating(true);
        try {
            const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
            const offersLimit = user?.plan?.limits?.offers_limit ?? 5;

            // Check Quota
            if (!isAdmin && offersLimit !== -1) {
                const currentCount = await ofertaService.getOfertasCount(user.id);
                if (currentCount >= offersLimit) {
                    toast.warning('Límite de Ofertas', `Tu plan actual permite un máximo de ${offersLimit} ofertas. Mejora tu plan para habilitar más.`);
                    setIsActivating(false);
                    return;
                }
            }

            let estimatedProfit = 0;
            let estimatedMargin = 0;

            if (strategyType === 'descuento') {
                estimatedProfit = discountConfig.newProfit;
                estimatedMargin = discountConfig.newMarginPercent;
            } else if (strategyType === 'bundle') {
                const lastRow = bundleConfig.priceTable[bundleConfig.priceTable.length - 1];
                estimatedProfit = lastRow?.totalProfit ?? 0;
                estimatedMargin = selectedCosteo.inputs_json?.desiredMarginPercent ?? 0;
            } else {
                const suggestedPrice = selectedCosteo.results_json?.suggestedPrice ?? 0;
                estimatedProfit = giftConfig.newProfit;
                estimatedMargin = suggestedPrice > 0
                    ? (giftConfig.newProfit / suggestedPrice) * 100
                    : 0;
            }

            await ofertaService.createOferta({
                userId: user.id,
                storeId: tiendaActual.id,
                costeoId: selectedCosteo.id,
                productName: selectedCosteo.nombre_producto,
                strategyType,
                discountConfig: strategyType === 'descuento' ? discountConfig : undefined,
                bundleConfig: strategyType === 'bundle' ? bundleConfig : undefined,
                giftConfig: strategyType === 'obsequio' ? giftConfig : undefined,
                estimatedProfit: Math.round(estimatedProfit * 100) / 100,
                estimatedMarginPercent: Math.round(estimatedMargin * 100) / 100
            });

            toast.success('¡Oferta activada!', `${selectedCosteo.nombre_producto} con estrategia ${strategyType}`);
            onClose();
        } catch (error) {
            toast.error('Error al activar oferta');
        } finally {
            setIsActivating(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px', height: '32px',
                        backgroundColor: 'rgba(0,102,255,0.1)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)'
                    }}>
                        <Gift size={18} />
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Crear Nueva Oferta
                    </span>
                </div>
            }
        >
            <div style={{ padding: '8px 0' }}>
                <StepIndicator steps={STEPS} currentStep={step} />

                <div
                    style={{
                        padding: '24px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        marginTop: '24px',
                        minHeight: '380px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ flex: 1 }}>
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

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '32px',
                            paddingTop: '20px',
                            borderTop: '1px solid var(--border-color)'
                        }}
                    >
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', fontSize: '13px', fontWeight: 700,
                                color: step === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                cursor: step === 1 ? 'not-allowed' : 'pointer',
                                opacity: step === 1 ? 0.4 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ChevronLeft size={16} /> Anterior
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                disabled={!canGoNext()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 24px', fontSize: '13px', fontWeight: 700,
                                    color: '#fff',
                                    backgroundColor: canGoNext() ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                    border: 'none', borderRadius: '10px',
                                    cursor: canGoNext() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                    boxShadow: canGoNext() ? '0 4px 12px rgba(0, 102, 255, 0.2)' : 'none'
                                }}
                            >
                                Siguiente <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleActivate}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 24px', fontSize: '13px', fontWeight: 700,
                                    color: '#fff',
                                    background: 'var(--color-success)',
                                    border: 'none', borderRadius: '10px',
                                    cursor: 'pointer', transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                }}
                            >
                                <Sparkles size={16} /> Activar Oferta
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
