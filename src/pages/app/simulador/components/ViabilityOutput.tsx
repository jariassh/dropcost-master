import { useState } from 'react';
import type { SimulatorResults as Results, SimulatorInputs } from '@/types/simulator';
import { TrendingUp, BarChart3, CheckCircle2, XCircle, AlertCircle, ShoppingBag, ShieldCheck, Pencil, RotateCcw, TrendingDown } from 'lucide-react';
import { VerticalFunnel } from '../VerticalFunnel';
import { calculateAdScenarios, calculateSalesSimulation } from '../simulatorCalculations';
import { Slider } from '@/components/common/Slider';

interface ViabilityOutputProps {
    results: Results;
    inputs: SimulatorInputs;
    currency: string;
    manualPrice: number | null;
    setManualPrice: (val: number | null) => void;
}

export function ViabilityOutput({ results, inputs, currency, manualPrice, setManualPrice }: ViabilityOutputProps) {
    const [dailyOrders, setDailyOrders] = useState(25);
    const marginPct = (results.netProfitPerSale / (results.suggestedPrice || 1)) * 100;
    const isViable = results.netProfitPerSale > 0;
    const isHealthy = marginPct > 15;

    const viability = isHealthy ? 'viable' : isViable ? 'breakeven' : 'not_viable';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    const funnelSteps = [
        { label: 'Precio', value: results.suggestedPrice, color: 'var(--color-primary)' },
        { label: 'Producto', value: results.costBreakdown.productCost, color: 'var(--text-secondary)' },
        { label: 'Logística', value: results.costBreakdown.shippingCost + results.costBreakdown.collectionCommission + results.costBreakdown.returnCost + results.costBreakdown.otherExpenses, color: 'var(--color-warning)' },
        { label: 'Pauta', value: results.costBreakdown.cpa, color: 'var(--color-error)' },
        { label: 'Ganancia', value: results.netProfitPerSale, color: 'var(--color-success)' },
    ];

    const adScenarios = calculateAdScenarios(results, 25);
    const salesSim = calculateSalesSimulation(inputs, results, dailyOrders);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '0' }}>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)',
                gap: '24px',
                alignItems: 'stretch'
            }}>
                {/* COLUMN 1: MATRIX + OPERATION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 3. Matriz de Escalamiento Pauta */}
                    <div style={{
                        padding: '24px',
                        borderRadius: '24px',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={18} color="var(--color-primary)" />
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Matriz de Escalamiento Pauta</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {adScenarios.map((s, i) => (
                                <div key={s.percent} style={{
                                    padding: '16px 20px',
                                    borderRadius: '16px',
                                    backgroundColor: i === 1 ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                    border: `1px solid ${i === 1 ? 'var(--card-border)' : 'var(--border-color)'}`,
                                    display: 'grid',
                                    gridTemplateColumns: '1.5fr 1fr 1fr',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase' }}>ESCENARIO</p>
                                        <p style={{ fontSize: '14px', fontWeight: 800, color: i === 1 ? 'var(--color-primary)' : 'var(--text-primary)', margin: 0 }}>
                                            {i === 0 ? 'Conservador' : i === 1 ? 'Moderado' : 'Agresivo'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase' }}>PROFIT DIARIO</p>
                                        <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-success)', margin: 0 }}>
                                            {formatCurrency(s.operationalMargin)}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', margin: '0 0 2px 0', textTransform: 'uppercase' }}>ROAS INV.</p>
                                        <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                            {s.percent}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* 4. Simulador de Operación Diaria */}
                    <div style={{
                        padding: '24px',
                        borderRadius: '24px',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--card-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShoppingBag size={18} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Simulador de Operación Diaria</h4>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Visualiza el impacto de las devoluciones</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>VOLUMEN DE PEDIDOS</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={dailyOrders || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (e.target.value === '') {
                                                setDailyOrders(0);
                                                return;
                                            }
                                            if (!isNaN(val)) setDailyOrders(Math.max(1, Math.min(100, val)));
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: '2px dashed var(--card-border)',
                                            color: 'var(--text-primary)',
                                            fontSize: '20px',
                                            fontWeight: 900,
                                            outline: 'none',
                                            textAlign: 'center',
                                            width: `${Math.max(2, String(dailyOrders || '').length) + 1}ch`,
                                            padding: '0 2px',
                                            margin: 0
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: '11px', opacity: 0.5, color: 'var(--text-primary)' }}>pedidos/día</span>
                            </div>
                        </div>

                        <Slider
                            min={1} max={100} value={dailyOrders}
                            onChange={(val) => setDailyOrders(val)}
                            label="" suffix="" hideInputLabel
                        />

                        <div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>Pipeline de Efectividad</span>
                            <div style={{ width: '100%', height: '12px', display: 'flex', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${100 - inputs.preCancellationPercent - inputs.returnRatePercent}%`, backgroundColor: 'var(--color-success)', transition: 'width 0.3s' }} />
                                <div style={{ width: `${inputs.preCancellationPercent}%`, backgroundColor: 'var(--color-warning)', transition: 'width 0.3s' }} />
                                <div style={{ width: `${inputs.returnRatePercent}%`, backgroundColor: 'var(--color-error)', transition: 'width 0.3s' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'center' }}>
                                <LegendItem color="var(--color-success)" label="Entregados" value={salesSim.effectiveOrders} />
                                <LegendItem color="var(--color-warning)" label="Cancelados" value={salesSim.cancelledOrders} />
                                <LegendItem color="var(--color-error)" label="Devolución" value={salesSim.returnedOrders} />
                            </div>
                        </div>

                        <div style={{
                            marginTop: 'auto', padding: '24px', borderRadius: '24px',
                            backgroundColor: 'var(--card-bg)', border: '1px solid var(--bg-tertiary)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '4px' }}>Utilidad Líquida Real</p>
                                <h5 style={{ fontSize: '28px', fontWeight: 950, color: 'var(--color-success)', margin: 0 }}>{formatCurrency(salesSim.grossMarginReal)} <span style={{ fontSize: '12px', opacity: 0.6 }}>/ día</span></h5>
                            </div>
                            <ShieldCheck size={36} color="var(--color-success)" style={{ opacity: 0.2 }} />
                        </div>
                    </div>

                </div>

                {/* COLUMN 2: PRECIO + FUNNEL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 1. Precio Sugerido & Rentabilidad */}
                    <div style={{
                        padding: '64px 24px 24px',
                        borderRadius: '24px',
                        background: 'var(--sim-primary-bg)',
                        color: 'var(--sim-primary-text)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--card-border)',
                        position: 'relative'
                    }}>
                        {/* Viability Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            padding: '6px 12px',
                            borderRadius: '100px',
                            backgroundColor: viability === 'viable' ? 'var(--bg-tertiary)' : viability === 'breakeven' ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                            border: `1px solid ${viability === 'viable' ? 'var(--color-success)' : viability === 'breakeven' ? 'var(--color-warning)' : 'var(--color-error)'}`,
                            color: viability === 'viable' ? 'var(--color-success)' : viability === 'breakeven' ? 'var(--color-warning)' : 'var(--color-error)',
                            fontSize: '10px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {viability === 'viable' ? <CheckCircle2 size={12} /> : viability === 'breakeven' ? <AlertCircle size={12} /> : <XCircle size={12} />}
                            {viability === 'viable' ? 'VIABLE' : viability === 'breakeven' ? 'ALERTA' : 'NO VIABLE'}
                        </div>

                        {/* Difference Badge */}
                        {manualPrice !== null && (
                            <div style={{
                                position: 'absolute',
                                top: '24px',
                                left: '24px',
                                backgroundColor: manualPrice < (results.originalSuggestedPrice || results.suggestedPrice) ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                                border: `1px solid ${manualPrice < (results.originalSuggestedPrice || results.suggestedPrice) ? 'var(--color-error)' : 'var(--color-success)'}`,
                                color: manualPrice < (results.originalSuggestedPrice || results.suggestedPrice) ? 'var(--color-error)' : 'var(--color-success)',
                                padding: '6px 12px',
                                borderRadius: '100px',
                                fontSize: '10px',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {manualPrice < (results.originalSuggestedPrice || results.suggestedPrice) ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                                {manualPrice < (results.originalSuggestedPrice || results.suggestedPrice) ? '-' : '+'}{formatCurrency(Math.abs(manualPrice - (results.originalSuggestedPrice || results.suggestedPrice)))}
                            </div>
                        )}

                        {manualPrice !== null ? (
                            <div style={{
                                position: 'absolute',
                                top: '24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '100px',
                                padding: '6px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: '1px solid var(--card-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(4px)'
                            }} onClick={() => setManualPrice(null)}>
                                <span style={{ fontSize: '11px', fontWeight: 800 }}>SUGERIDO: {formatCurrency(results.originalSuggestedPrice || results.suggestedPrice)}</span>
                                <RotateCcw size={14} />
                            </div>
                        ) : (
                            <span style={{
                                position: 'absolute',
                                top: '30px', /* Centered visually with badges which are padded */
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '11px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                opacity: 0.8
                            }}>
                                Precio de Venta Sugerido
                            </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', position: 'relative' }}>
                            <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '12px', alignSelf: 'center' }}>$</span>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    value={manualPrice === 0 ? '' : (results.suggestedPrice || '')}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setManualPrice(isNaN(val) ? 0 : val);
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--sim-primary-text)',
                                        fontSize: '56px',
                                        fontWeight: 950,
                                        letterSpacing: '-0.02em',
                                        outline: 'none',
                                        textAlign: 'center',
                                        width: `${Math.max(3, String(results.suggestedPrice).length)}ch`,
                                        padding: 0,
                                        margin: 0
                                    }}
                                />
                                <Pencil size={20} color="var(--text-secondary)" style={{ position: 'absolute', right: '-32px', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '0px' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                            <div style={{
                                backgroundColor: 'var(--bg-secondary)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--card-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Utilidad / Venta</span>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-success)' }}>{formatCurrency(results.netProfitPerSale)}</span>
                            </div>
                            <div style={{
                                backgroundColor: 'var(--bg-secondary)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--card-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Efectividad</span>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--sim-primary-text)' }}>{100 - inputs.preCancellationPercent - inputs.returnRatePercent}%</span>
                            </div>
                        </div>
                    </div>


                    {/* COLUMN 2: FUNNEL */}
                    <div style={{
                        padding: '24px',
                        borderRadius: '24px',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BarChart3 size={18} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Análisis de Rentabilidad</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Proyección financiera por unidad</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0 8px 0' }}>
                            <VerticalFunnel steps={funnelSteps} currency={currency} totalPrice={results.suggestedPrice} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
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
