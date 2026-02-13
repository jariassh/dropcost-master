/**
 * SimuladorPage - Layout principal del simulador.
 * Header: Nombre producto + Guardar + Mis Costeos
 * 2 paneles: formulario (izq) + resultados sticky (der)
 * Cálculo en TIEMPO REAL.
 */
import { useState, useCallback, useEffect } from 'react';
import { SimuladorForm } from './SimuladorForm';
import { SimuladorResults } from './SimuladorResults';
import { calculateSuggestedPrice, calculateVolumeTable } from './simulatorCalculations';
import { useToast } from '@/components/common';
import type { SimulatorInputs, SimulatorResults as Results, VolumeStrategy, SavedCosteo } from '@/types/simulator';
import { useNavigate } from 'react-router-dom';
import { Calculator, History, Save } from 'lucide-react';

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

    const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
    const [results, setResults] = useState<Results | null>(null);
    const [volumeStrategy, setVolumeStrategy] = useState<VolumeStrategy>(DEFAULT_VOLUME);
    const [maxUnits, setMaxUnits] = useState(5);

    // ─── Auto-calculate in real time ───
    useEffect(() => {
        const calc = calculateSuggestedPrice(inputs);
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
    }, [inputs, volumeStrategy.enabled, volumeStrategy.marginPercent, maxUnits]);

    const handleSave = useCallback(() => {
        if (!results || results.suggestedPrice <= 0) {
            toast.warning('Ingresa datos para calcular antes de guardar');
            return;
        }
        if (!inputs.productName.trim()) {
            toast.warning('Ingresa un nombre para el producto');
            return;
        }

        const costeo: SavedCosteo = {
            id: crypto.randomUUID(),
            storeId: 'default',
            productName: inputs.productName,
            inputs,
            results,
            volumeStrategy: volumeStrategy.enabled ? volumeStrategy : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem('dropcost_costeos') || '[]') as SavedCosteo[];
        existing.unshift(costeo);
        localStorage.setItem('dropcost_costeos', JSON.stringify(existing));

        toast.success('Costeo guardado correctamente');
    }, [inputs, results, volumeStrategy, toast]);

    const isActive = results != null && results.suggestedPrice > 0;

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
                    shippingCost={inputs.shippingCost}
                    collectionCommissionPercent={inputs.collectionCommissionPercent}
                    volumeStrategy={volumeStrategy}
                    maxUnits={maxUnits}
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
