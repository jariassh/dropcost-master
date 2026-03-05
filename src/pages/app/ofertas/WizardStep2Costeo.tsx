/**
 * WizardStep2Costeo - Paso 2: Seleccionar costeo guardado.
 * Muestra selector con costeos de localStorage + detalle al seleccionar.
 */
import { useState, useEffect } from 'react';
import { Select } from '@/components/common';
import type { SavedCosteo } from '@/types/simulator';
import { Link } from 'react-router-dom';
import { ExternalLink, DollarSign, TrendingUp, Package } from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { costeoService } from '@/services/costeoService';
import { useAuthStore } from '@/store/authStore';

interface WizardStep2Props {
    selectedCosteoId: string;
    onSelect: (costeo: SavedCosteo) => void;
}

export function WizardStep2Costeo({ selectedCosteoId, onSelect }: WizardStep2Props) {
    const [costeos, setCosteos] = useState<SavedCosteo[]>([]);
    const { tiendaActual } = useStoreStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!tiendaActual?.id || !user?.id) return;
        costeoService.listCosteos(tiendaActual.id, user.id).then(setCosteos);
    }, [tiendaActual, user?.id]);

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const options = costeos.map((c) => ({
        value: c.id,
        label: c.nombre_producto,
        details: `Precio: ${formatCurrency(c.precio_final || 0)} · Ganancia: ${formatCurrency(c.utilidad_neta || 0)}`,
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
                        to="/mis-costeos"
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
                                marginTop: '24px',
                                padding: '24px',
                                borderRadius: '16px',
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                animation: 'slideUp 250ms ease-out',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    backgroundColor: 'rgba(0,102,255,0.1)', color: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Package size={18} />
                                </div>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Detalle del costeo: {selectedCosteo.nombre_producto}
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <DetailItem
                                    icon={<DollarSign size={16} />}
                                    label="Precio Final Sugerido"
                                    value={formatCurrency(selectedCosteo.precio_final || 0)}
                                />
                                <DetailItem
                                    icon={<TrendingUp size={16} />}
                                    label="Utilidad Neta Estimada"
                                    value={formatCurrency(selectedCosteo.utilidad_neta || 0)}
                                    color="var(--color-success)"
                                />
                                <DetailItem
                                    icon={<Package size={16} />}
                                    label="Costo de Producto"
                                    value={formatCurrency(selectedCosteo.costo_producto || 0)}
                                />
                                <DetailItem
                                    icon={<TrendingUp size={16} />}
                                    label="Margen Deseado"
                                    value={`${selectedCosteo.margen || 0}%`}
                                    color="var(--color-primary)"
                                />
                            </div>

                            {selectedCosteo.meta_campaign_id && (
                                <div style={{
                                    marginTop: '20px', paddingTop: '16px',
                                    borderTop: '1px solid var(--border-color)',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-tertiary)' }} />
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                        ID Campaña Meta: {selectedCosteo.meta_campaign_id}
                                    </p>
                                </div>
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
