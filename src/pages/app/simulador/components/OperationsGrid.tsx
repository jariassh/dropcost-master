import { useState } from 'react';
import type { SimulatorResults as Results, SimulatorInputs } from '@/types/simulator';
import { calculateAdScenarios, calculateSalesSimulation } from '../simulatorCalculations';
import { Slider } from '@/components/common/Slider';
import { TrendingUp, ShoppingBag, ShieldCheck } from 'lucide-react';

interface OperationsGridProps {
    results: Results;
    inputs: SimulatorInputs;
    currency: string;
}

export function OperationsGrid({ results, inputs, currency }: OperationsGridProps) {
    const [dailyOrders, setDailyOrders] = useState(25);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(val);
    };

    const adScenarios = calculateAdScenarios(results, dailyOrders);
    const salesSim = calculateSalesSimulation(inputs, results, dailyOrders);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '48px' }}>
            {/* Simulador de Operación Diaria */}
            <div style={{
                padding: '32px',
                borderRadius: '32px',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={18} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>Simulador de Operación Diaria</h4>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>Visualiza el impacto de las devoluciones</p>
                    </div>
                </div>

                <div style={{ padding: '0 8px' }}>
                    <Slider
                        min={1}
                        max={100}
                        value={dailyOrders}
                        onChange={setDailyOrders}
                        label="Volumen de Pedidos"
                        suffix="pedidos/día"
                    />
                </div>

                {/* Pipeline de Efectividad */}
                <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>PIPELINE DE EFECTIVIDAD</span>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{dailyOrders} <small style={{ fontSize: '10px', opacity: 0.5 }}>pedidos</small></span>
                    </div>

                    <div style={{ width: '100%', height: '12px', display: 'flex', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${100 - inputs.preCancellationPercent - inputs.returnRatePercent}%`, backgroundColor: '#10B981', transition: 'width 0.3s' }} />
                        <div style={{ width: `${inputs.preCancellationPercent}%`, backgroundColor: '#F59E0B', transition: 'width 0.3s' }} />
                        <div style={{ width: `${inputs.returnRatePercent}%`, backgroundColor: '#EF4444', transition: 'width 0.3s' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                        <LegendItem color="#10B981" label="Entregados" value={`${salesSim.effectiveOrders}`} />
                        <LegendItem color="#F59E0B" label="Cancelados" value={`${salesSim.cancelledOrders}`} />
                        <LegendItem color="#EF4444" label="Devolución" value={`${salesSim.returnedOrders}`} />
                    </div>
                </div>

                <div style={{
                    marginTop: 'auto', padding: '20px', borderRadius: '20px',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: '4px' }}>Utilidad Líquida Real</p>
                        <h5 style={{ fontSize: '24px', fontWeight: 950, color: '#10B981', margin: 0 }}>{formatCurrency(salesSim.grossMarginReal)} <small style={{ fontSize: '12px', opacity: 0.6 }}>/ día</small></h5>
                    </div>
                    <ShieldCheck size={32} color="#10B981" style={{ opacity: 0.2 }} />
                </div>
            </div>
        </div>
    );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>{label}:</span>
            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 800 }}>{value}</span>
        </div>
    );
}
