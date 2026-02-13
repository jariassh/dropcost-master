import { SlideOver } from '@/components/common/SlideOver';
import type { Oferta } from '@/types/ofertas';
import { STRATEGIES } from '@/types/ofertas';
import { Play, Pause, Trash2, Calendar, TrendingUp, Tag } from 'lucide-react';
import { useState } from 'react';

interface OfertaDetailPanelProps {
    oferta: Oferta;
    onClose: () => void;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
}

export function OfertaDetailPanel({ oferta, onClose, onToggleStatus, onDelete }: OfertaDetailPanelProps) {
    const strategyInfo = STRATEGIES.find((s) => s.type === oferta.strategyType)!;

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

    const isActiva = oferta.status === 'activa';

    // We handle local open state to coordinate closing animation if needed, 
    // but SlideOver handles it via props mostly. 
    // Ideally parent controls 'isOpen'. Here we assume if this component is rendered, isOpen is true initially?
    // Actually typically the parent renders: <SlideOver isOpen={!!oferta} ... />
    // But our architecture in Dashboard is: {detailOferta && <OfertaDetailModal oferta={detailOferta} ... />}
    // This wipes the component instantly.
    // To support animation, we need a wrapper or changing Dashboard logic.
    // For now, let's use a local state 'isOpen' initialized to true, and when closing, we set false, wait, then call onClose?
    // Or just pass `true` and changing the Dashboard to NOT unmount immediately?
    // Changing Dashboard logic is cleaner but riskier.
    // SlideOver logic I just wrote: `useEffect(() => { if (isOpen) ... else timeout ... })`.
    // It depends on `isOpen` prop.
    // If parent unmounts the component, `SlideOver` unmounts instantly.
    // For this MVP fix, I will rely on the `SlideOver` doing its best, or I will update Dashboard to keep it mounted but `isOpen={false}`?
    // Keeping it mounted complicates things (need to track "which offer").
    // Let's stick to "instant unmount" for now or use the local state trick.
    // Trick: component mounts with `isOpen={true}`. User clicks close -> we call `onClose`?
    // If `onClose` sets parent state to null -> instant unmount.
    // So visual animation OF CLOSING will be lost. Opening will work.
    // User wants "Better Presentation". Opening animation is key. Closing is nice to have.
    // I will stick to simple implementation first.

    return (
        <SlideOver
            isOpen={true} // Always true when mounted, effectively (we lose exit animation but gain simplicity)
            onClose={onClose}
            title="Detalle de Oferta"
            width="max-w-xl"
            footer={
                <>
                    <button
                        onClick={() => onToggleStatus(oferta.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm
                            ${isActiva
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'}
                        `}
                    >
                        {isActiva ? <Pause size={16} /> : <Play size={16} />}
                        {isActiva ? 'Pausar Oferta' : 'Activar Oferta'}
                    </button>
                    <button
                        onClick={() => onDelete(oferta.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-all shadow-sm hover:border-red-300 dark:bg-transparent dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <Trash2 size={16} />
                        Eliminar
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-6">

                {/* Hero Card */}
                <div className="relative overflow-hidden rounded-xl border border-[var(--border-color)] bg-white dark:bg-slate-900/50 shadow-sm group">
                    <div className={`absolute top-0 left-0 w-1 h-full ${isActiva ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div className="p-5 pl-7">
                        <div className="flex justify-between items-start mb-4">
                            <span className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                                {strategyInfo.icon}
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-wider py-1 px-2.5 rounded-full ${isActiva ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {isActiva ? 'Activa' : 'Pausada'}
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1 leading-tight">{oferta.productName}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{strategyInfo.label}</p>

                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-between items-end">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-0.5">Ganancia Est.</p>
                                <p className="text-2xl font-bold text-[var(--color-success)] tracking-tight">
                                    {formatCurrency(oferta.estimatedProfit)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-0.5">Margen</p>
                                <p className="text-xl font-bold text-[var(--text-primary)]">
                                    {oferta.estimatedMarginPercent}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Timeline / Info - Vertical flow in SlideOver */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mb-2">
                        <Calendar size={16} />
                        <span>Creada el <strong>{formatDate(oferta.createdAt)}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                        <Calendar size={16} />
                        <span>Activada el <strong>{formatDate(oferta.activatedAt)}</strong></span>
                    </div>
                </div>

                {/* Configuration Specs */}
                <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Tag size={16} className="text-[var(--color-primary)]" />
                        Configuración de la Oferta
                    </h4>

                    <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                        {oferta.strategyType === 'descuento' && oferta.discountConfig && (
                            <>
                                <ListItem label="Descuento aplicado" value={`-${oferta.discountConfig.discountPercent}%`} valueClass="text-red-500 font-bold" />
                                <ListItem label="Precio con descuento" value={formatCurrency(oferta.discountConfig.offerPrice)} valueClass="font-bold text-[var(--text-primary)]" />
                            </>
                        )}

                        {oferta.strategyType === 'bundle' && oferta.bundleConfig && (
                            <>
                                <ListItem label="Cantidad para activar" value={`${oferta.bundleConfig.quantity} Unidades`} valueClass="font-bold text-[var(--text-primary)]" />
                                <ListItem label="Incentivo / Margen Extra" value={`${oferta.bundleConfig.marginPercent}%`} valueClass="text-emerald-500 font-bold" />
                            </>
                        )}

                        {oferta.strategyType === 'obsequio' && oferta.giftConfig && (
                            <>
                                <ListItem label="Regalo incluido" value={oferta.giftConfig.description || 'Producto Sorpresa'} valueClass="font-bold text-[var(--text-primary)]" />
                                <ListItem label="Costo del regalo" value={`-${formatCurrency(oferta.giftConfig.giftCost)}`} valueClass="text-red-500" />
                                <ListItem label="Valor percibido" value={formatCurrency(oferta.giftConfig.perceivedValue)} valueClass="text-emerald-500 font-bold" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </SlideOver>
    );
}

const ListItem = ({ label, value, valueClass = '' }: { label: string, value: string, valueClass?: string }) => (
    <div className="flex justify-between items-center p-4">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
);
