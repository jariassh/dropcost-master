import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Link2, Copy, CheckCircle2, Info } from 'lucide-react';
import { useToast, Tooltip } from '@/components/common';
import { costeoService } from '@/services/costeoService';
import type { SavedCosteo } from '@/types/simulator';

interface IntegrationLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    costeo: SavedCosteo | null;
    tiendaId: string | undefined;
    onSaveSuccess: () => void;
}

export const IntegrationLinkModal: React.FC<IntegrationLinkModalProps> = ({ isOpen, onClose, costeo, tiendaId, onSaveSuccess }) => {
    const [shopifyId, setShopifyId] = useState('');
    const [metaCampaignId, setMetaCampaignId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    // Reset when modal opens
    useEffect(() => {
        if (isOpen && costeo) {
            setShopifyId(costeo.product_id_shopify || '');
            setMetaCampaignId(costeo.meta_campaign_id || '');
            setCopied(false);
        }
    }, [isOpen, costeo]);

    if (!isOpen || !costeo) return null;

    const utmParamString = `utm_source={{campaign.id}}&utm_medium={{adset.id}}&utm_content={{ad.id}}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(utmParamString);
            setCopied(true);
            toast.success('¡Copiado!', 'Parámetro UTM copiado al portapapeles.');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Error', 'No se pudo copiar el parámetro.');
        }
    };

    const handleSaveAndSync = async () => {
        if (!tiendaId) return;

        setIsSaving(true);
        try {
            // Guardar IDs en Supabase local
            await costeoService.updateCosteo(costeo.id, {
                product_id_shopify: shopifyId.trim() || undefined,
                meta_campaign_id: metaCampaignId.trim() || undefined
            });

            // Disparar sincronización hacia backend
            if (shopifyId.trim()) {
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bhtnphjrovsmzkdzakpc.supabase.co';

                fetch(`${supabaseUrl}/functions/v1/sync-shopify-backfill`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tienda_id: tiendaId,
                        costeo_id: costeo.id,
                        shopify_product_id: shopifyId.trim(),
                        meta_campaign_id: metaCampaignId.trim() || undefined
                    })
                }).catch(err => console.error("Error background backfill:", err));
            }

            toast.success('Integración Enlazada', 'IDs guardados. El historial se procesará en fondo.');
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudo vincular la integración.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '16px',
                width: '100%', maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Link2 size={24} style={{ color: 'var(--color-primary)' }} />
                            Enlazar Integraciones
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Conecta este costeo con Shopify y Meta Ads
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--text-tertiary)',
                        cursor: 'pointer', padding: '8px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.2s, color 0.2s'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Fila de Campos de IDs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                                Product ID (Shopify)
                                <Tooltip content="Al editar el producto, es el número al final de la URL (ej: .../products/8618138108057).">
                                    <Info size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                                </Tooltip>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 8618138108057"
                                value={shopifyId}
                                onChange={(e) => setShopifyId(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px', color: 'var(--text-primary)',
                                    fontSize: '14px', transition: 'border-color 0.2s'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                                Campaign ID (Meta Ads)
                                <Tooltip content="Activa la columna 'Identificador de la campaña' en Meta Ads Business Manager.">
                                    <Info size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                                </Tooltip>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: 1202154..."
                                value={metaCampaignId}
                                onChange={(e) => setMetaCampaignId(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px', color: 'var(--text-primary)',
                                    fontSize: '14px', transition: 'border-color 0.2s'
                                }}
                            />
                        </div>
                    </div>

                    {/* Helper UTMs Box */}
                    <div style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.05)',
                        border: '1px dashed rgba(56, 189, 248, 0.4)',
                        padding: '16px', borderRadius: '12px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Rastreo para Meta Ads
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            Para medir el CPI exacto en DropCost, debes pegar este parámetro dinámico en el campo <b>"Parámetros de URL"</b> al final de la configuración de tu anuncio en Facebook.
                        </p>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{
                                flex: 1, backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)', borderRadius: '6px',
                                padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace',
                                color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {utmParamString}
                            </div>
                            <button
                                onClick={handleCopy}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 16px', backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)', borderRadius: '6px',
                                    color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            >
                                {copied ? <CheckCircle2 size={16} color="var(--color-success)" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px', borderTop: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'flex-end', gap: '12px',
                    backgroundColor: 'var(--bg-tertiary)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', backgroundColor: 'transparent',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px',
                            cursor: 'pointer', transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveAndSync}
                        disabled={isSaving}
                        style={{
                            padding: '10px 24px', backgroundColor: 'var(--color-primary)',
                            border: 'none', borderRadius: '8px',
                            color: 'white', fontWeight: 600, fontSize: '14px',
                            cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        {isSaving ? (
                            <>Guardando...</>
                        ) : (
                            <>Guardar e Iniciar Sincronización</>
                        )}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
