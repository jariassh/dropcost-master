/**
 * SimuladorPage - Editor persistente para costeos individuales.
 * Carga datos desde Supabase por ID.
 * Protege cambios no guardados.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimuladorForm } from './SimuladorForm';
import { SimuladorResults } from './SimuladorResults';
import { calculateSuggestedPrice, calculateVolumeTable, calculateVolumeMetrics } from './simulatorCalculations';
import { useToast, Spinner, ConfirmDialog, Tooltip } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import type { SimulatorInputs, SimulatorResults as Results, VolumeStrategy, SavedCosteo } from '@/types/simulator';
import { Calculator, History, Save, X, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { costeoService } from '@/services/costeoService';

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
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuthStore();

    // --- Estado del Costeo ---
    const [costeoPadre, setCosteoPadre] = useState<SavedCosteo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
    const [results, setResults] = useState<Results | null>(null);
    const [volumeStrategy, setVolumeStrategy] = useState<VolumeStrategy>(DEFAULT_VOLUME);
    const [maxUnits, setMaxUnits] = useState(5);
    const [manualPrice, setManualPrice] = useState<number | null>(null);
    const [manualVolumePrice, setManualVolumePrice] = useState<number | null>(null);

    // --- Control de Cambios ---
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const pendingPath = useRef<string | null>(null);

    // Carga inicial
    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const data = await costeoService.getCosteo(id);
                setCosteoPadre(data);

                // Mapear datos si existen (si no es 'vacio')
                if (data.estado === 'guardado') {
                    setInputs(data.inputs_json || {
                        ...DEFAULT_INPUTS,
                        productName: data.nombre_producto,
                        productCost: data.costo_producto || 0,
                        shippingCost: data.costo_flete || 0,
                        desiredMarginPercent: data.margen ?? 0,
                        averageCpa: data.cpa ?? 0,
                        otherExpenses: data.gastos_adicionales ?? 0,
                        returnRatePercent: data.devoluciones ?? 0,
                        collectionCommissionPercent: data.comision_recaudo_porcentaje ?? 0,
                        preCancellationPercent: data.cancelacion_pre_envio_porcentaje ?? 0
                    });
                    if (data.volume_strategy) {
                        setVolumeStrategy(data.volume_strategy);
                        setMaxUnits(data.volume_strategy.priceTable?.length ? data.volume_strategy.priceTable[data.volume_strategy.priceTable.length - 1].quantity : 5);
                    }
                    if (data.results_json) {
                        setResults(data.results_json);
                        setManualPrice(data.results_json.manualPrice || null);
                    }
                } else {
                    // Si está vacío, solo seteamos el nombre del producto
                    setInputs(prev => ({ ...prev, productName: data.nombre_producto }));
                }
                setIsDirty(false); // Reset dirty on load
            } catch (error) {
                toast.error('No se pudo cargar el costeo');
                navigate('/simulador');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id, navigate, toast]);

    // Detectar cambios
    useEffect(() => {
        if (!isLoading) setIsDirty(true);
    }, [inputs, volumeStrategy, maxUnits, manualPrice, manualVolumePrice]);

    // Prevenir salida accidental del navegador (Refresh / Close Tab)
    // NOTA: Los navegadores modernos OBLIGAN a usar su alerta nativa aquí por seguridad.
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '¿Deseas salir sin guardar los cambios?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // ─── Auto-cálculo en tiempo real ───
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

    const handleSave = async () => {
        if (!id || !results) return;
        setIsSaving(true);
        try {
            const updates: Partial<SavedCosteo> = {
                costo_producto: inputs.productCost,
                costo_flete: inputs.shippingCost,
                gastos_adicionales: inputs.otherExpenses,
                cpa: inputs.averageCpa,
                margen: inputs.desiredMarginPercent,
                devoluciones: inputs.returnRatePercent,
                comision_recaudo_porcentaje: inputs.collectionCommissionPercent,
                cancelacion_pre_envio_porcentaje: inputs.preCancellationPercent,
                precio_final: results.suggestedPrice,
                utilidad_neta: results.netProfitPerSale,
                inputs_json: inputs,
                results_json: { ...results, manualPrice: manualPrice ?? undefined },
                volume_strategy: volumeStrategy.enabled ? volumeStrategy : undefined,
                estado: 'guardado'
            };

            await costeoService.saveCosteo(id, updates);
            toast.success('Costeo guardado con éxito');
            setIsDirty(false);
            navigate('/simulador');
        } catch (error) {
            toast.error('Error al guardar el costeo');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (isDirty) {
            setShowUnsavedModal(true);
            pendingPath.current = '/mis-costeos';
        } else {
            navigate('/mis-costeos');
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

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
            {/* Header: Sticky superior */}
            <div style={{
                position: 'sticky', top: '0', zIndex: 100,
                backgroundColor: 'var(--bg-primary)', padding: '16px 0',
                borderBottom: '1px solid var(--border-color)', marginBottom: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--card-bg)', cursor: 'pointer', color: 'var(--text-primary)'
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Editando Producto
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {costeoPadre?.nombre_producto}
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isDirty && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderRadius: '8px', color: 'var(--color-warning)', fontSize: '13px', fontWeight: 600
                        }}>
                            <AlertTriangle size={14} /> Cambios sin guardar
                        </div>
                    )}
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '12px 20px', borderRadius: '12px', border: '1.5px solid var(--border-color)',
                            backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
                            fontWeight: 700, fontSize: '14px'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 28px', fontSize: '14px', fontWeight: 700,
                            borderRadius: '12px', cursor: (isSaving || !isDirty) ? 'not-allowed' : 'pointer',
                            backgroundColor: isDirty ? 'var(--color-primary)' : 'var(--text-tertiary)',
                            color: '#fff', border: 'none',
                            boxShadow: isDirty ? '0 4px 14px rgba(0, 102, 255, 0.3)' : 'none',
                        }}
                    >
                        {isSaving ? <Spinner size="sm" /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {/* Layout de Simulador */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(360px, 1fr)',
                    gap: '32px',
                    alignItems: 'start',
                }}
                className="simulator-layout"
            >
                <SimuladorForm
                    inputs={inputs}
                    onChange={(newVal) => setInputs(newVal)}
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

            {/* Modal de Cambios sin Guardar */}
            <ConfirmDialog
                isOpen={showUnsavedModal}
                title="Cambios sin guardar"
                description="Tienes cambios pendientes en este costeo. ¿Deseas salir sin guardar? Los cambios se perderán de forma permanente."
                confirmLabel="Salir sin guardar"
                cancelLabel="Seguir editando"
                variant="danger"
                onConfirm={() => {
                    setIsDirty(false);
                    setShowUnsavedModal(false);
                    if (pendingPath.current) navigate(pendingPath.current);
                }}
                onCancel={() => {
                    setShowUnsavedModal(false);
                    pendingPath.current = null;
                }}
            />

            <style>{`
                @media (max-width: 1100px) {
                    .simulator-layout { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
