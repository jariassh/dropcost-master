/**
 * WizardStep2Costeo - Paso 2: Seleccionar costeo guardado.
 * Muestra selector con costeos de localStorage + detalle al seleccionar.
 */
import { useState, useEffect } from 'react';
import { Select } from '@/components/common';
import type { SavedCosteo } from '@/types/simulator';
import { Link } from 'react-router-dom';
import { ExternalLink, DollarSign, TrendingUp, Package } from 'lucide-react';

interface WizardStep2Props {
    selectedCosteoId: string;
    onSelect: (costeo: SavedCosteo) => void;
}

export function WizardStep2Costeo({ selectedCosteoId, onSelect }: WizardStep2Props) {
    const [costeos, setCosteos] = useState<SavedCosteo[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('dropcost_costeos');
        if (stored) {
            setCosteos(JSON.parse(stored));
        }
    }, []);

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const options = costeos.map((c) => ({
        value: c.id,
        label: c.productName,
        details: `Precio: ${formatCurrency(c.results.suggestedPrice)} · Ganancia: ${formatCurrency(c.results.netProfitPerSale)}`,
    }));

    const selectedCosteo = costeos.find((c) => c.id === selectedCosteoId);

    function handleChange(costeoId: string) {
        const found = costeos.find((c) => c.id === costeoId);
        if (found) onSelect(found);
    }

    return (
        <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Selecciona un costeo
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                La oferta se basará en los números de un costeo guardado
            </p>

            {costeos.length === 0 ? (
                <div
                    style={{
                        padding: '32px',
                        textAlign: 'center',
                        borderRadius: '12px',
                        border: '1px dashed var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                    }}
                >
                    <Package size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>No tienes costeos guardados</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Primero crea un costeo en el simulador
                    </p>
                    <Link
                        to="/simulador"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '8px',
                            textDecoration: 'none',
                        }}
                    >
                        Ir al Simulador <ExternalLink size={14} />
                    </Link>
                </div>
            ) : (
                <>
                    <Select
                        label="Costeo base"
                        options={options}
                        value={selectedCosteoId}
                        onChange={handleChange}
                        placeholder="Selecciona un costeo..."
                    />

                    {/* Detail card */}
                    {selectedCosteo && (
                        <div
                            style={{
                                marginTop: '20px',
                                padding: '20px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                animation: 'slideUp 200ms ease-out',
                            }}
                        >
                            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                                Detalle del costeo
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <DetailItem
                                    icon={<DollarSign size={14} />}
                                    label="Precio sugerido"
                                    value={formatCurrency(selectedCosteo.results.suggestedPrice)}
                                />
                                <DetailItem
                                    icon={<TrendingUp size={14} />}
                                    label="Ganancia/venta"
                                    value={formatCurrency(selectedCosteo.results.netProfitPerSale)}
                                    color="var(--color-success)"
                                />
                                <DetailItem
                                    icon={<Package size={14} />}
                                    label="Costo producto"
                                    value={formatCurrency(selectedCosteo.inputs.productCost)}
                                />
                                <DetailItem
                                    icon={<TrendingUp size={14} />}
                                    label="Margen"
                                    value={`${selectedCosteo.inputs.desiredMarginPercent}%`}
                                />
                            </div>
                            {selectedCosteo.metaCampaignId && (
                                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
                                    ID Campaña Meta: {selectedCosteo.metaCampaignId}
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function DetailItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
            <div>
                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{label}</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</p>
            </div>
        </div>
    );
}
