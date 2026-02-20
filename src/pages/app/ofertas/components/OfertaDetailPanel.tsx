import { Modal } from '@/components/common/Modal';
import type { Oferta } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import {
    ChevronLeft,
    Settings,
    FileText,
    Trash2,
    Clock,
    Package
} from 'lucide-react';

interface OfertaDetailPanelProps {
    oferta: Oferta;
    onClose: () => void;
    onDelete: (id: string) => void;
}

export function OfertaDetailPanel({ oferta, onClose, onDelete }: OfertaDetailPanelProps) {
    const strategyInfo = STRATEGIES.find((s) => s.type === oferta.strategyType)!;

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            size="lg"
            closeOnOverlay={true}
        >
            <div style={{ backgroundColor: 'var(--bg-primary)', margin: '-32px', padding: '24px 32px', borderRadius: '16px', color: 'var(--text-primary)' }}>
                {/* Header with Back Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                            Detalles de Oferta
                        </h2>
                    </div>
                </div>

                {/* Content Card Container */}
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '28px',
                    maxHeight: 'calc(100vh - 250px)',
                    overflowY: 'auto'
                }} className="custom-scroller">

                    {/* Hero Section: Product Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)'
                        }}>
                            <Package size={32} color="var(--text-tertiary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                {oferta.productName}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(0,102,255,0.1)',
                                    color: 'var(--color-primary)',
                                    fontSize: '10px',
                                    fontWeight: 700
                                }}>
                                    #OFF-{oferta.id.slice(0, 5).toUpperCase()}
                                </span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-tertiary)',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Clock size={12} /> {formatDate(oferta.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Strategy & Config */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-primary)' }}>
                            <Settings size={15} />
                            <h4 style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>
                                ESTRATEGIA & CONFIGURACIÓN
                            </h4>
                        </div>

                        <div style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            padding: '18px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '16px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600 }}>Estrategia</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    {strategyInfo.label}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600 }}>
                                    {oferta.strategyType === 'bundle' ? 'Máx Unidades' : 'Incentivo'}
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>
                                    {oferta.strategyType === 'bundle' ? `${oferta.bundleConfig?.quantity || 3} Unidades` :
                                        oferta.strategyType === 'descuento' ? `${oferta.discountConfig?.discountPercent}%` : 'Regalo'}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600 }}>% Margen 2+</p>
                                <p style={{ fontSize: '13px', color: '#10B981', fontWeight: 700 }}>
                                    {oferta.bundleConfig?.marginPercent || 50}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financial Table */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-primary)' }}>
                            <FileText size={15} />
                            <h4 style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>
                                DESGLOSE FINANCIERO (PROYECCIÓN)
                            </h4>
                        </div>

                        <div style={{
                            maxHeight: '240px',
                            overflowY: 'auto',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-secondary)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 10 }}>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>VOL</th>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>PRECIO VENTA</th>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>AHORRO</th>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '9px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>UTILIDAD</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(oferta.bundleConfig?.priceTable || [1, 2, 3, 4, 5, 6, 7, 8]).map((item, idx, arr) => {
                                        const qty = typeof item === 'number' ? item : item.quantity;
                                        const price = typeof item === 'number' ? (89476 * qty) : item.totalPrice;
                                        const savings = qty === 1 ? '---' : `-$${(35314 * (qty - 1)).toLocaleString()}/ud`;
                                        const profit = typeof item === 'number' ? (17895 + (qty - 1) * 8948) : item.totalProfit;

                                        return (
                                            <tr key={qty} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>{qty} Ud</td>
                                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatCurrency(price)}</td>
                                                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>{savings}</td>
                                                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>{formatCurrency(profit)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', alignItems: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 20px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer'
                        }}
                    >
                        Cerrar
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => onDelete(oferta.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 18px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--color-error)',
                                color: '#fff',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Trash2 size={16} />
                            Eliminar Oferta
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
