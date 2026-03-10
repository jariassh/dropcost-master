import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { SimulatorResults as Results, SimulatorInputs } from '@/types/simulator';
import { TrendingUp, BarChart3, CheckCircle2, XCircle, AlertCircle, ShoppingBag, ShieldCheck, Pencil, RotateCcw, TrendingDown } from 'lucide-react';
import { VerticalFunnel } from '../VerticalFunnel';
import { calculateAdScenarios, calculateSalesSimulation } from '../simulatorCalculations';
import { Slider } from '@/components/common/Slider';

interface ViabilityOutputProps {
    results: Results;
    inputs: SimulatorInputs & { country?: string };
    currency: string;
    manualPrice: number | null;
    setManualPrice: (val: number | null) => void;
    layoutOnly?: 'left' | 'right';
}

export function ViabilityOutput({ results, inputs, currency, manualPrice, setManualPrice, layoutOnly }: ViabilityOutputProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [dailyOrders, setDailyOrders] = useState(25);
    const marginPct = (results.netProfitPerSale / (results.suggestedPrice || 1)) * 100;
    const isViable = results.netProfitPerSale > 0;
    const isHealthy = marginPct > 15;

    const viability = isHealthy ? 'viable' : isViable ? 'breakeven' : 'not_viable';

    const formatCurrency = (val: number) => {
        const country = inputs.country || 'CO';
        const locale = country === 'CO' ? 'es-CO' : country === 'MX' ? 'es-MX' : country === 'PE' ? 'es-PE' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    const funnelSteps = [
        { label: 'Ingreso', value: results.suggestedPrice, color: 'var(--color-primary)' },
        { label: 'Costo Prod', value: results.costBreakdown.productCost, color: 'var(--text-secondary)' },
        { label: 'Logística', value: results.costBreakdown.shippingCost + results.costBreakdown.collectionCommission + results.costBreakdown.returnCost + results.costBreakdown.otherExpenses, color: 'var(--color-warning)' },
        { label: 'Ads CPA', value: results.costBreakdown.cpa, color: 'var(--color-error)' },
        { label: 'Profit Final', value: results.netProfitPerSale, color: 'var(--color-success)' },
    ];

    const adScenarios = calculateAdScenarios(results, dailyOrders);
    const salesSim = calculateSalesSimulation(inputs, results, dailyOrders);

    const leftColumn = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 📈 Matriz de Escalamiento Pauta */}
            <div style={{
                padding: '24px', borderRadius: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>Matriz de Escalamiento Pauta</h4>
                            <InfoTooltip text="Preproyección de rentabilidad en Meta Ads. Basada en el margen bruto disponible después de costos fijos. Define tu CPA máximo y presupuesto diario recomendado para escalar." />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {adScenarios.map((s, i) => (
                        <div key={s.percent} style={{
                            padding: '16px 20px', borderRadius: '16px', backgroundColor: i === 1 ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)',
                            border: `1px solid ${i === 1 ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 1fr 1fr 1fr', gap: '12px', alignItems: 'center'
                        }}>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>ESCENARIO</p>
                                <p style={{ fontSize: '14px', fontWeight: 800, color: i === 1 ? 'var(--color-primary)' : 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                    {i === 0 ? 'Conservador (35%)' : i === 1 ? 'Moderado (40%)' : 'Escalamiento (50%)'}
                                </p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>CPA MÁX.</p>
                                <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                    {formatCurrency(s.maxCpa)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>INVERSIÓN DÍA</p>
                                <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                    {formatCurrency(s.budget)}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>PROFIT ESTIMADO</p>
                                <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-success)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                    {formatCurrency(s.operationalMargin)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🛍️ Simulador de Operación Diaria */}
            <div style={{
                padding: '24px', borderRadius: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={18} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>Simulador de Operación Diaria</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-body)' }}>Visualiza el impacto de las devoluciones</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>VOLUMEN DE PEDIDOS</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DailyOrdersInput
                            value={dailyOrders}
                            onChange={(val) => {
                                setDailyOrders(Math.min(999, val));
                            }}
                        />
                        <span style={{ fontSize: '11px', opacity: 0.5, color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>pedidos/día</span>
                    </div>
                </div>

                <Slider
                    min={1}
                    max={Math.max(200, dailyOrders)}
                    value={dailyOrders}
                    onChange={(val) => setDailyOrders(val)}
                    label=""
                    suffix=""
                    hideInputLabel
                />

                <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '12px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Pipeline de Efectividad</span>
                    <div style={{ width: '100%', height: '12px', display: 'flex', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                        <div style={{ width: `${100 - inputs.preCancellationPercent - inputs.returnRatePercent}%`, backgroundColor: 'var(--color-success)', transition: 'width 0.3s' }} />
                        <div style={{ width: `${inputs.preCancellationPercent}%`, backgroundColor: 'var(--color-warning)', transition: 'width 0.3s' }} />
                        <div style={{ width: `${inputs.returnRatePercent}%`, backgroundColor: 'var(--color-error)', transition: 'width 0.3s' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center', fontFamily: 'var(--font-headings)' }}>
                        <LegendItem color="var(--color-success)" label="Entregados" value={salesSim.effectiveOrders} />
                        <LegendItem color="var(--color-warning)" label="Cancelados" value={salesSim.cancelledOrders} />
                        <LegendItem color="var(--color-error)" label="Devolución" value={salesSim.returnedOrders} />
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 1.2fr) 1fr',
                    gap: '16px'
                }}>
                    {/* UTILIDAD LÍQUIDA REAL */}
                    <div style={{
                        padding: '20px 24px', borderRadius: '24px',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px'
                    }}>
                        <p style={{ fontSize: '10px', fontWeight: 900, color: 'var(--color-success)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>Utilidad Líquida Real</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontFamily: 'var(--font-headings)' }}>
                            <h5 style={{ fontSize: '24px', fontWeight: 950, color: 'var(--color-success)', margin: 0 }}>
                                {formatCurrency(salesSim.grossMarginReal)}
                            </h5>
                            <span style={{ fontSize: '11px', color: 'var(--color-success)', opacity: 0.6, fontWeight: 700 }}>/ día</span>
                        </div>
                    </div>

                    {/* LOGÍSTICA REAL (POR UNIDAD) */}
                    <div style={{
                        padding: '16px 20px', borderRadius: '24px',
                        backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px'
                    }}>
                        <p style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}>Logística Unidad</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-headings)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Flete + COD</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 800 }}>
                                {formatCurrency(results.costBreakdown.shippingCost + results.costBreakdown.collectionCommission)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-headings)' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 600 }}>Falla (1.5x)</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 800 }}>
                                -{formatCurrency(results.costBreakdown.shippingCost * 1.5)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const diff = manualPrice !== null ? manualPrice - (results.originalSuggestedPrice || results.suggestedPrice) : 0;

    const rightColumn = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 💎 Precio Sugerido (Tarjeta Azul / Premium) */}
            <div style={{
                padding: '48px 24px 24px', borderRadius: '24px',
                background: isDark ? 'var(--sim-primary-bg)' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', position: 'relative',
                overflow: 'visible'
            }}>
                {/* HEAD SECTION (TOP BAR) */}
                <div style={{ position: 'absolute', top: '24px', left: 0, right: 0, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* LEFT: DIFF BADGE */}
                    <div style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-start' }}>
                        {manualPrice !== null && (
                            <div style={{
                                backgroundColor: diff >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)', backdropFilter: 'blur(8px)',
                                borderRadius: '100px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                                border: `1px solid ${diff >= 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, color: diff >= 0 ? '#34D399' : '#EF4444',
                                fontSize: '11px', fontWeight: 900
                            }}>
                                {diff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {diff >= 0 ? '+' : '-'}{formatCurrency(Math.abs(diff))}
                            </div>
                        )}
                    </div>

                    {/* CENTER: RESET/TITLE */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        {manualPrice !== null ? (
                            <div style={{
                                backgroundColor: 'var(--bg-secondary)', backdropFilter: 'blur(8px)',
                                borderRadius: '100px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                                border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                                color: 'var(--sim-primary-text)', fontFamily: 'var(--font-headings)'
                            }} onClick={() => setManualPrice(null)}>
                                <span style={{ fontSize: '10px', fontWeight: 900 }}>SUGERIDO: {formatCurrency(results.originalSuggestedPrice || results.suggestedPrice)}</span>
                                <RotateCcw size={12} />
                            </div>
                        ) : (
                            <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sim-primary-text)', opacity: 0.8, fontFamily: 'var(--font-headings)' }}>
                                Precio de Venta Sugerido
                            </div>
                        )}
                    </div>

                    {/* RIGHT: VIABILITY BADGE */}
                    <div style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{
                            backgroundColor: viability === 'viable' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)', backdropFilter: 'blur(8px)',
                            borderRadius: '100px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px',
                            border: `1px solid ${viability === 'viable' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`, color: 'var(--sim-primary-text)',
                            fontFamily: 'var(--font-headings)'
                        }}>
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%',
                                backgroundColor: viability === 'viable' ? '#10B981' : '#EF4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 0 10px ${viability === 'viable' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
                            }}>
                                {viability === 'viable' ? <CheckCircle2 size={10} color="white" /> : <XCircle size={10} color="white" />}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 900 }}>{viability === 'viable' ? 'VIABLE' : 'NO VIABLE'}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0 10px 0' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        paddingBottom: '4px'
                    }}>
                        <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--sim-primary-text)', opacity: 0.9, marginTop: '10px' }}>$</span>
                        <PriceInput
                            value={manualPrice !== null ? manualPrice : results.suggestedPrice}
                            onChange={setManualPrice}
                        />
                        <Pencil size={24} style={{ opacity: 0.8, color: 'var(--sim-primary-text)', marginLeft: '4px', marginTop: '10px' }} />
                    </div>
                </div>

                {/* Sub-cards de métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%', marginTop: '16px' }}>
                    <div style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'var(--bg-secondary)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sim-primary-text)', textTransform: 'uppercase', opacity: 0.8, fontFamily: 'var(--font-body)' }}>UTILIDAD / VENTA</span>
                        <span style={{ fontSize: '20px', fontWeight: 950, color: 'var(--color-success)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', fontFamily: 'var(--font-headings)' }}>{formatCurrency(results.netProfitPerSale)}</span>
                    </div>
                    <div style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'var(--bg-secondary)', padding: '16px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sim-primary-text)', textTransform: 'uppercase', opacity: 0.8, fontFamily: 'var(--font-body)' }}>EFECTIVIDAD</span>
                        <span style={{ fontSize: '22px', fontWeight: 950, color: 'var(--sim-primary-text)', fontFamily: 'var(--font-headings)' }}>{Math.round(100 - inputs.returnRatePercent - inputs.preCancellationPercent)}%</span>
                    </div>
                </div>
            </div>

            {/* 📊 Análisis de Rentabilidad (Embudo) */}
            <div style={{
                padding: '24px', borderRadius: '24px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>Análisis de Rentabilidad</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-body)' }}>Proyección financiera por unidad</p>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0 16px 0' }}>
                    <VerticalFunnel steps={funnelSteps} currency={currency} totalPrice={results.suggestedPrice} country={inputs.country} />
                </div>
            </div>
        </div>
    );

    if (layoutOnly === 'left') return leftColumn;
    if (layoutOnly === 'right') return rightColumn;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '24px' }}>
            {leftColumn}
            {rightColumn}
        </div>
    );
}

function DailyOrdersInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const format = (v: number) => v === 0 ? '' : v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const [display, setDisplay] = useState(format(value));

    useEffect(() => setDisplay(format(value)), [value]);

    return (
        <input
            type="text"
            value={display}
            onChange={(e) => {
                const raw = e.target.value.replace(/\./g, '');
                const num = parseInt(raw) || 0;
                setDisplay(raw.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                onChange(num);
            }}
            style={{
                width: '75px',
                background: 'rgba(0,0,0,0.05)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: 900,
                textAlign: 'center',
                padding: '4px 8px',
                outline: 'none',
                fontFamily: 'var(--font-headings)'
            }}
        />
    );
}

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const formatValue = (num: number) => {
        if (num === 0) return '';
        const parts = num.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${parts[0]},${parts[1]}`;
    };

    const [displayValue, setDisplayValue] = useState(formatValue(value));

    useEffect(() => {
        // Solo actualizar si no estamos enfocados para no romper la escritura del usuario
        if (document.activeElement !== inputRef.current) {
            setDisplayValue(formatValue(value));
        }
    }, [value]);

    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^\d.,]/g, '');
        setDisplayValue(val);

        const cleanVal = val.replace(/\./g, '').replace(',', '.');
        const numeric = parseFloat(cleanVal) || 0;
        if (!isNaN(numeric)) {
            onChange(numeric);
        }
    };

    const handleBlur = () => {
        setDisplayValue(formatValue(value));
    };

    const inputWidth = `${Math.max(displayValue.length, 3) + 1}ch`;

    return (
        <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            style={{
                background: 'transparent',
                border: 'none',
                color: isDark ? 'white' : 'var(--color-primary)',
                fontSize: '62px',
                fontWeight: 950,
                outline: 'none',
                width: inputWidth,
                textAlign: 'center',
                fontFamily: 'var(--font-headings)',
                letterSpacing: '-0.03em',
                padding: 0,
                margin: 0
            }}
            placeholder="0,00"
        />
    );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}:</span>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 800 }}>{value}</span>
        </div>
    );
}

function InfoTooltip({ text }: { text: string }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    return (
        <span
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
            <AlertCircle size={14} style={{ color: isHovered ? 'var(--color-primary)' : 'var(--text-tertiary)', cursor: 'help' }} />
            {isHovered && (
                <div style={{
                    position: 'fixed',
                    top: mousePos.y - 10,
                    left: mousePos.x + 15,
                    backgroundColor: '#1E293B',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    width: '260px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    zIndex: 9999,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                    pointerEvents: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'var(--font-body)'
                }}>
                    {text}
                </div>
            )}
        </span>
    );
}
