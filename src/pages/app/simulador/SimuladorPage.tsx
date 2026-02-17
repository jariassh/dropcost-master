/**
 * SimuladorPage - Layout principal del simulador.
 * Header: Nombre producto + Guardar + Mis Costeos
 * 2 paneles: formulario (izq) + resultados sticky (der)
 * Cálculo en TIEMPO REAL.
 */
import { useState, useCallback, useEffect } from 'react';
import { SimuladorForm } from './SimuladorForm';
import { SimuladorResults } from './SimuladorResults';
import { calculateSuggestedPrice, calculateVolumeTable, calculateVolumeMetrics } from './simulatorCalculations';
import { useToast, Spinner } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import type { SimulatorInputs, SimulatorResults as Results, VolumeStrategy, SavedCosteo } from '@/types/simulator';
import { useNavigate } from 'react-router-dom';
import { Calculator, History, Save, Store, PlusCircle } from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore'; // Import store
import { CreateStoreModal } from '@/components/layout/CreateStoreModal'; // Import modal

const DEFAULT_INPUTS: SimulatorInputs = {
    productName: '',
    desiredMarginPercent: 0,
    productCost: 0,
    shippingCost: 0,
    collectionCommissionPercent: 0,
    returnRatePercent: 0,
    otherExpenses: 0,
    averageCpa: 0,
    preCancellationPercent: 0,
};

const DEFAULT_VOLUME: VolumeStrategy = {
    enabled: false,
    marginPercent: 50,
    priceTable: [],
};

export function SimuladorPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { tiendas, isLoading: storesLoading, fetchTiendas } = useStoreStore(); // Get store state
    const { user } = useAuthStore();
    const [isCreateStoreOpen, setCreateStoreOpen] = useState(false); // Modal state

    const handleOpenCreateStore = () => {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const storeLimit = user?.plan?.limits?.stores ?? 0;

        if (!isAdmin && tiendas.length >= storeLimit) {
            toast.warning(
                'Límite alcanzado',
                `Tu plan actual permite un máximo de ${storeLimit} ${storeLimit === 1 ? 'tienda' : 'tiendas'}. Mejora tu plan para agregar más.`
            );
            return;
        }
        setCreateStoreOpen(true);
    };

    // Fetch stores if empty on mount (safety check)
    useEffect(() => {
        fetchTiendas();
    }, [fetchTiendas]);

    const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
    const [results, setResults] = useState<Results | null>(null);
    const [volumeStrategy, setVolumeStrategy] = useState<VolumeStrategy>(DEFAULT_VOLUME);
    const [maxUnits, setMaxUnits] = useState(5);
    const [manualPrice, setManualPrice] = useState<number | null>(null);
    const [manualVolumePrice, setManualVolumePrice] = useState<number | null>(null); // New state

    // ─── Auto-calculate in real time ───
    useEffect(() => {
        const calc = calculateSuggestedPrice(inputs, manualPrice);
        setResults(calc);

        if (volumeStrategy.enabled && calc.suggestedPrice > 0) {
            const table = calculateVolumeTable(
                calc.suggestedPrice,
                inputs.productCost,
                calc.netProfitPerSale,
                volumeStrategy.marginPercent,
                maxUnits,
            );
            setVolumeStrategy((prev) => ({ ...prev, priceTable: table }));
        }
    }, [inputs, volumeStrategy.enabled, volumeStrategy.marginPercent, maxUnits, manualPrice]);

    // Reset manual volume price when units change
    useEffect(() => {
        setManualVolumePrice(null);
    }, [maxUnits]);

    const handleSave = useCallback(() => {
        if (!results || results.suggestedPrice <= 0) {
            toast.warning('Ingresa datos para calcular antes de guardar');
            return;
        }
        if (!inputs.productName.trim()) {
            toast.warning('Ingresa un nombre para el producto');
            return;
        }

        let finalVolumeStrategy = volumeStrategy.enabled ? { ...volumeStrategy } : undefined;

        // If there's a manual volume price, we update the table row for maxUnits
        if (finalVolumeStrategy && manualVolumePrice && manualVolumePrice > 0) {
            const rowIdx = finalVolumeStrategy.priceTable.findIndex(r => r.quantity === maxUnits);
            if (rowIdx > -1) {
                // We update this row with manual values
                const vResults = calculateVolumeMetrics(inputs, maxUnits, manualVolumePrice);
                if (vResults) {
                    finalVolumeStrategy.priceTable[rowIdx] = {
                        quantity: maxUnits,
                        totalPrice: vResults.suggestedPrice,
                        pricePerUnit: vResults.suggestedPrice / maxUnits,
                        savingsPerUnit: (results.suggestedPrice - (vResults.suggestedPrice / maxUnits)),
                        totalProfit: vResults.netProfitPerSale
                    };
                }
            }
        }

        const costeo: SavedCosteo = {
            id: crypto.randomUUID(),
            storeId: 'default',
            productName: inputs.productName,
            inputs,
            results,
            volumeStrategy: finalVolumeStrategy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem('dropcost_costeos') || '[]') as SavedCosteo[];
        existing.unshift(costeo);
        localStorage.setItem('dropcost_costeos', JSON.stringify(existing));

        // --- NEW: Automatically create an Offer if Volume Strategy is enabled ---
        if (finalVolumeStrategy) {
            const newOffer = {
                id: crypto.randomUUID(),
                userId: 'user_123', // Placeholder until real auth
                storeId: 'default',
                costeoId: costeo.id,
                productName: costeo.productName,
                strategyType: 'bundle',
                bundleConfig: {
                    quantity: maxUnits,
                    marginPercent: finalVolumeStrategy.marginPercent,
                    usePredefinedTable: true,
                    priceTable: finalVolumeStrategy.priceTable.map(row => ({
                        quantity: row.quantity,
                        totalPrice: row.totalPrice,
                        pricePerUnit: row.pricePerUnit,
                        savingsPerUnit: row.savingsPerUnit,
                        totalProfit: row.totalProfit
                    }))
                },
                estimatedProfit: finalVolumeStrategy.priceTable.find(r => r.quantity === maxUnits)?.totalProfit || results.netProfitPerSale,
                estimatedMarginPercent: inputs.desiredMarginPercent, // approximation
                status: 'activa',
                createdAt: new Date().toISOString(),
                activatedAt: new Date().toISOString()
            };

            const existingOffers = JSON.parse(localStorage.getItem('dropcost_ofertas') || '[]');
            existingOffers.unshift(newOffer);
            localStorage.setItem('dropcost_ofertas', JSON.stringify(existingOffers));

            toast.success(`Costeo y Oferta "${costeo.productName}" guardados`);
        } else {
            toast.success('Costeo guardado correctamente');
        }

        // Reset form after saving
        setInputs(DEFAULT_INPUTS);
        setVolumeStrategy(DEFAULT_VOLUME);
        setManualPrice(null);
        setManualVolumePrice(null);
    }, [inputs, results, volumeStrategy, manualPrice, manualVolumePrice, maxUnits, toast]);

    const isActive = results != null && results.suggestedPrice > 0;

    // ─── EMPTY STATE: NO STORES ───
    if (storesLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (tiendas.length === 0) {
        return (
            <div style={{
                maxWidth: '640px', margin: '60px auto', textAlign: 'center',
                padding: '48px 40px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                animation: 'scaleIn 400ms ease-out'
            }}>
                <div style={{
                    width: '96px', height: '96px', borderRadius: '28px',
                    backgroundColor: 'rgba(0,102,255,0.08)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    border: '1px solid rgba(0,102,255,0.1)'
                }}>
                    <Store size={48} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                    ¡Bienvenido a DropCost Master!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: 1.7, fontSize: '16px' }}>
                    Para comenzar a simular precios y calcular márgenes con precisión, primero necesitamos configurar tu tienda.
                    Esto nos permitirá guardar tu historial y personalizar los cálculos para tu país.
                </p>
                <button
                    onClick={handleOpenCreateStore}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '14px 32px',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        margin: '0 auto',
                        boxShadow: '0 10px 15px -3px rgba(0, 102, 255, 0.3), 0 4px 6px -2px rgba(0, 102, 255, 0.05)',
                        transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 102, 255, 0.4), 0 10px 10px -5px rgba(0, 102, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 102, 255, 0.3), 0 4px 6px -2px rgba(0, 102, 255, 0.05)';
                    }}
                >
                    <PlusCircle size={20} />
                    Crear mi Primera Tienda
                </button>

                <CreateStoreModal
                    isOpen={isCreateStoreOpen}
                    onClose={() => setCreateStoreOpen(false)}
                />
            </div>
        );
    }

    // ─── Calculate Volume Results (for breakdown & manual override) ───
    const currentVolumePrice = manualVolumePrice ?? (
        volumeStrategy.enabled
            ? volumeStrategy.priceTable.find(r => r.quantity === maxUnits)?.totalPrice
            : null
    ) ?? null;

    const volumeResults = (volumeStrategy.enabled && maxUnits > 1 && results && results.suggestedPrice > 0 && currentVolumePrice)
        ? calculateVolumeMetrics(inputs, maxUnits, currentVolumePrice)
        : null;

    return (
        <div>
            {/* ─── Page Header ─── */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calculator size={24} style={{ color: 'var(--color-primary)' }} />
                        Simulador Financiero COD
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Calculamos el precio ideal basándonos en tu margen deseado y las fugas operativas
                    </p>
                </div>
                <button
                    onClick={() => navigate('/simulador/mis-costeos')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', fontSize: '14px', fontWeight: 600,
                        color: 'var(--color-primary)', backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)', borderRadius: '8px',
                        cursor: 'pointer', transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                    <History size={16} /> Mis Costeos
                </button>
            </div>

            {/* ─── Product Name + Save Bar ─── */}
            <div
                style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'stretch' }}
                className="save-bar"
            >
                <div style={{ flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Nombre del producto — Ej: Crema facial, Faja reductora..."
                        value={inputs.productName}
                        onChange={(e) => setInputs((prev) => ({ ...prev, productName: e.target.value }))}
                        style={{
                            width: '100%', height: '100%', minHeight: '48px',
                            padding: '0 16px', fontSize: '14px',
                            color: 'var(--text-primary)', backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--card-border)', borderRadius: '10px',
                            outline: 'none', transition: 'border-color 150ms',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)'; }}
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={!isActive}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                        whiteSpace: 'nowrap',
                        ...(isActive
                            ? {
                                color: '#fff',
                                background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
                            }
                            : {
                                color: 'var(--text-tertiary)',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                cursor: 'not-allowed',
                                boxShadow: 'none',
                            }
                        ),
                        borderRadius: '10px',
                        transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                        if (isActive) e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                    <Save size={16} /> Guardar Costeo
                </button>
            </div>

            {/* ─── Two-panel layout ─── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(340px, 1fr)',
                    gap: '24px',
                    alignItems: 'start',
                }}
                className="simulator-layout"
            >
                <SimuladorForm
                    inputs={inputs}
                    onChange={setInputs}
                    volumeStrategy={volumeStrategy}
                    onVolumeStrategyChange={setVolumeStrategy}
                    maxUnits={maxUnits}
                    onMaxUnitsChange={setMaxUnits}
                    suggestedPrice={results?.suggestedPrice ?? 0}
                    netProfit={results?.netProfitPerSale ?? 0}
                    productCost={inputs.productCost}
                />

                <SimuladorResults
                    results={results}
                    volumeResults={volumeResults}
                    shippingCost={inputs.shippingCost}
                    collectionCommissionPercent={inputs.collectionCommissionPercent}
                    volumeStrategy={volumeStrategy}
                    maxUnits={maxUnits}
                    manualPrice={manualPrice}
                    onManualPriceChange={setManualPrice}
                    manualVolumePrice={manualVolumePrice}
                    onManualVolumePriceChange={setManualVolumePrice}
                />
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    .simulator-layout { grid-template-columns: 1fr !important; }
                    .save-bar { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
