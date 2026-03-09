/**
 * SimuladorPage - Editor premium con el diseño exacto aprobado.
 * Implementa 3 columnas superiores y 2 columnas de análisis inferiores.
 * Soporte de moneda local y tooltips integrados.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InputCards } from './components/InputCards';
import { ViabilityOutput } from './components/ViabilityOutput';
import { MentorAssistant } from './MentorAssistant';
import { SimulatorAcademy } from './components/SimulatorAcademy';
import { calculateSuggestedPrice, calculateVolumeTable } from './simulatorCalculations';
import { useToast, Spinner, ConfirmDialog } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import type { SimulatorInputs, SimulatorResults as Results, VolumeStrategy, SavedCosteo } from '@/types/simulator';
import { Save, ArrowLeft, Plus, Sparkles, BookOpen } from 'lucide-react';
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

export function SimuladorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuthStore();
    const { tiendas } = useStoreStore();

    const [costeoPadre, setCosteoPadre] = useState<SavedCosteo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
    const [results, setResults] = useState<Results | null>(null);
    const [manualPrice, setManualPrice] = useState<number | null>(null);

    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isMentorOpen, setIsMentorOpen] = useState(false);
    const [isAcademyOpen, setIsAcademyOpen] = useState(false);
    const pendingPath = useRef<string | null>(null);

    // Carga de datos
    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const data = await costeoService.getCosteo(id);
                setCosteoPadre(data);

                if (data.estado === 'guardado') {
                    const savedInputs = data.inputs_json || { ...DEFAULT_INPUTS, productName: data.nombre_producto };
                    setInputs({ ...savedInputs } as SimulatorInputs);
                    if (data.results_json) {
                        setResults(data.results_json);
                        setManualPrice(data.results_json.manualPrice || null);
                    }
                } else {
                    setInputs({ ...DEFAULT_INPUTS, productName: data.nombre_producto });
                }
            } catch (error) {
                toast.error('Error al cargar simulador');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    // Cálculo en tiempo real
    useEffect(() => {
        const calc = calculateSuggestedPrice(inputs, manualPrice);
        setResults(calc);
        setIsDirty(true);
    }, [inputs, manualPrice]);

    const handleSave = async () => {
        if (!id || !results) return;
        setIsSaving(true);
        try {
            await costeoService.saveCosteo(id, {
                inputs_json: inputs,
                results_json: { ...results, manualPrice: manualPrice ?? undefined },
                estado: 'guardado'
            });
            toast.success('Simulación guardada');
            setIsDirty(false);
        } catch (e) {
            toast.error('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner /></div>;

    const activeStore = tiendas.find(t => t.id === costeoPadre?.tienda_id);
    const country = activeStore?.pais || 'CO';
    const currency = activeStore?.moneda || (country === 'CO' ? 'COP' : country === 'MX' ? 'MXN' : country === 'PE' ? 'PEN' : 'USD');

    // Inyectar el país de la tienda en los inputs para que los componentes hijos lo usen
    const inputsWithContext = { ...inputs, country };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px 48px 24px' }}>

            {/* 🔝 HEADER IDENTICO A IMAGEN */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                        <Plus size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 850, margin: 0, color: 'var(--text-primary)' }}>
                            Simulador de <span style={{ color: 'var(--color-primary)' }}>Viabilidad</span>
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                            Refinando: {costeoPadre?.nombre_producto}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => navigate('/mis-costeos')} title="Volver" style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={16} /> <span style={{ fontSize: '14px' }}>Volver</span>
                    </button>

                    <button onClick={() => setIsAcademyOpen(true)} title="Aprender Metodología" style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px solid var(--color-primary)', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={20} />
                    </button>

                    <button style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#1E293B', color: '#fff', cursor: 'pointer', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> <span style={{ fontSize: '14px' }}>Crear Oferta</span>
                    </button>

                    <button onClick={handleSave} disabled={isSaving} title="Guardar Simulación" style={{ width: '42px', height: '42px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)' }}>
                        <Save size={20} />
                    </button>
                </div>
            </div>

            {/* 📥 CONFIGURACIÓN (INPUTS) - 3 COLUMNAS */}
            <div style={{ marginBottom: '32px' }}>
                <InputCards inputs={inputsWithContext} onChange={setInputs} currency={currency} country={country} />
            </div>

            {/* 📊 ANÁLISIS DE RESULTADOS - 2 COLUMNAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)', gap: '32px', alignItems: 'start' }}>

                {/* LADO IZQUIERDO: MATRIZ Y SIMULADOR DIARIO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {results && (
                        <ViabilityOutput
                            results={results}
                            inputs={inputsWithContext}
                            currency={currency}
                            manualPrice={manualPrice}
                            setManualPrice={setManualPrice}
                            layoutOnly="left"
                        />
                    )}
                </div>

                {/* LADO DERECHO: PRECIO VENTAS Y EMBUDO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {results && (
                        <ViabilityOutput
                            results={results}
                            inputs={inputsWithContext}
                            currency={currency}
                            manualPrice={manualPrice}
                            setManualPrice={setManualPrice}
                            layoutOnly="right"
                        />
                    )}
                </div>

            </div>

            {/* 🤖 BOTÓN FLOTANTE DROP ANALYST */}
            <button
                onClick={() => setIsMentorOpen(true)}
                style={{
                    position: 'fixed', bottom: '32px', right: '32px', width: '64px', height: '64px', borderRadius: '20px',
                    backgroundColor: 'rgba(99, 102, 241, 1)', color: '#fff', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(99, 102, 241, 0.4)',
                    zIndex: 900, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="hover-pop"
                title="Consultar DROP ANALYST"
            >
                <Sparkles size={28} />
            </button>

            <MentorAssistant isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} inputs={inputs} results={results} tiendaId={costeoPadre?.tienda_id || ''} costeoId={id} />

            <SimulatorAcademy isOpen={isAcademyOpen} onClose={() => setIsAcademyOpen(false)} />

            <ConfirmDialog isOpen={showUnsavedModal} title="Cambios sin guardar" description="Tienes cambios pendientes. ¿Deseas salir?" onConfirm={() => navigate('/mis-costeos')} onCancel={() => setShowUnsavedModal(false)} variant="danger" />

        </div>
    );
}
