import React, { useState } from 'react';
import { X, Copy, Info, CheckCircle2 } from 'lucide-react';
import { Button, Input, Badge, useToast } from '@/components/common';
import { useStoreStore } from '@/store/useStoreStore';

interface ShopifyConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShopifyConfigModal({ isOpen, onClose }: ShopifyConfigModalProps) {
    const { tiendaActual, actualizarTienda } = useStoreStore();
    const toast = useToast();

    const initialDomain = tiendaActual?.shopify_domain || '';
    const [domain, setDomain] = useState(initialDomain);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen || !tiendaActual) return null;

    const generateShortId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 7; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleGenerateWebhook = async () => {
        if (!domain.trim()) {
            toast.error('Error', 'Debes ingresar el dominio de tu tienda Shopify.');
            return;
        }

        setIsSaving(true);
        try {
            // Generate a short ID if not exists, otherwise retain the existing one
            // We could regenerate it, but let's keep it if they already have one to avoid breaking existing webhooks
            const newShortId = tiendaActual.webhook_short_id || generateShortId();

            const success = await actualizarTienda(tiendaActual.id, {
                shopify_domain: domain.trim(),
                webhook_short_id: newShortId
            });

            if (success) {
                toast.success('¡Webhook Generado!', 'La tienda se ha enlazado a Shopify correctamente.');
            } else {
                toast.error('Error', 'No se pudieron guardar los cambios.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const shortId = tiendaActual.webhook_short_id;
    const webhookUrl = shortId ? `https://dropcost.jariash.com/webhook/${shortId}` : '';

    const handleCopy = async () => {
        if (!webhookUrl) return;
        try {
            await navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            toast.success('Copiado', 'URL del webhook copiada al portapapeles.');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Error', 'No se pudo copiar el enlace.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: '16px', width: '100%', maxWidth: '600px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: 'var(--bg-secondary)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Configuración de Webhook Shopify
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-tertiary)',
                            cursor: 'pointer', padding: '4px', display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                        Conecta tus pedidos de Shopify en tiempo real para optimizar tus cálculos de costos y ganancias automáticamente en DropCost Master.
                    </p>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Tu dominio de Shopify
                        </label>
                        <div style={{ display: 'flex' }}>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="ejemplo-tienda"
                                    style={{
                                        width: '100%', padding: '12px 16px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRight: 'none',
                                        borderRadius: '8px 0 0 8px',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px', outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{
                                padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)', borderRadius: '0 8px 8px 0',
                                color: 'var(--text-tertiary)', fontSize: '14px', display: 'flex', alignItems: 'center'
                            }}>
                                .myshopify.com
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleGenerateWebhook}
                        isLoading={isSaving}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        Generar Webhook
                    </Button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />

                    {/* Result Info */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            URL del Webhook (Para copiar)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={webhookUrl || 'Genera tu webhook primero...'}
                                style={{
                                    flex: 1, padding: '12px 16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: webhookUrl ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    fontSize: '14px', cursor: 'not-allowed', outline: 'none'
                                }}
                            />
                            <Button
                                variant="secondary"
                                onClick={handleCopy}
                                disabled={!webhookUrl}
                                style={{ width: '48px', padding: 0, justifyContent: 'center' }}
                            >
                                {copied ? <CheckCircle2 size={18} color="var(--color-success)" /> : <Copy size={18} />}
                            </Button>
                        </div>
                    </div>

                    <div style={{
                        padding: '16px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                        border: '1px solid rgba(var(--color-primary-rgb), 0.2)', borderRadius: '8px',
                        display: 'flex', gap: '12px', alignItems: 'flex-start'
                    }}>
                        <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            <strong style={{ color: 'var(--color-primary)' }}>Tip:</strong> Pega este enlace en Shopify (Configuración {'>'} Notificaciones {'>'} Webhooks). Crea uno nuevo seleccionando el evento <strong>Creación de pedido (orders/create)</strong> y el formato <strong>JSON</strong>.
                        </p>
                    </div>

                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
