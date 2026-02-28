import React, { useState, useEffect } from 'react';
import { X, Copy, Info, CheckCircle2, Lock, ShieldCheck, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Badge, useToast } from '@/components/common';
import { useStoreStore } from '@/store/useStoreStore';
import { configService } from '@/services/configService';
import { supabase } from '@/lib/supabase';
import { encryptionUtils } from '@/utils/encryptionUtils';

interface ShopifyConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShopifyConfigModal({ isOpen, onClose }: ShopifyConfigModalProps) {
    const { tiendaActual, actualizarTienda, saveShopifyIntegration } = useStoreStore();
    const toast = useToast();

    const [domain, setDomain] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [siteUrl, setSiteUrl] = useState('https://dropcost.jariash.com'); // Fallback
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Estados para Asistente Generador de Token
    const [showAutoToken, setShowAutoToken] = useState(false);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [showAccessToken, setShowAccessToken] = useState(false);

    // Cargar site_url de la configuración global
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await configService.getConfig();
                if (config.site_url) {
                    setSiteUrl(config.site_url);
                }
            } catch (e) {
                console.warn('Error cargando site_url config:', e);
            }
        };
        loadConfig();
    }, []);

    // Cargar dominio y token existentes de la tienda
    useEffect(() => {
        const loadStoreAndIntegration = async () => {
            if (!tiendaActual) return;

            // 1. Cargar dominio de la tienda
            const storeData = tiendaActual as any;
            setDomain(storeData.shopify_domain || storeData.shopify_shop_name || '');

            // 2. Cargar integración para obtener el token (si existe)
            try {
                const { data: config } = await supabase
                    .from('integraciones')
                    .select('credenciales_encriptadas')
                    .eq('tienda_id', tiendaActual.id)
                    .eq('tipo', 'shopify')
                    .maybeSingle();

                if (config?.credenciales_encriptadas) {
                    const decrypted = encryptionUtils.decrypt(config.credenciales_encriptadas);
                    setAccessToken(decrypted);
                }
            } catch (e) {
                console.warn('Error cargando integración Shopify:', e);
            }
        };

        if (isOpen) {
            loadStoreAndIntegration();
        }
    }, [tiendaActual, isOpen]);

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
            const newShortId = (tiendaActual as any).webhook_short_id || generateShortId();
            const fullDomain = `${domain.trim()}.myshopify.com`;

            // 1. Guardar datos básicos de la tienda (dominio + short id para el acortador)
            const successStore = await actualizarTienda(tiendaActual.id, {
                shopify_domain: domain.trim(),
                webhook_short_id: newShortId
            } as any);

            // 2. Guardar integración (token encriptado + config_sync)
            if (successStore) {
                await saveShopifyIntegration(tiendaActual.id, {
                    shop_url: fullDomain,
                    access_token: accessToken.trim() || undefined,
                    status: 'conectado'
                });

                toast.success('¡Configuración Guardada!', 'La tienda se ha vinculado a Shopify correctamente.');
            } else {
                toast.error('Error', 'No se pudieron guardar los cambios.');
            }
        } catch (error) {
            console.error('Error en configuración Shopify:', error);
            toast.error('Error', 'Ocurrió un problema al guardar la configuración.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAutoToken = async () => {
        if (!domain.trim() || !clientId.trim() || !clientSecret.trim()) {
            toast.error('Error', 'Debes ingresar el dominio, Client ID y Client Secret.');
            return;
        }

        setIsGeneratingToken(true);
        try {
            const fullDomain = `${domain.trim()}.myshopify.com`;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bhtnphjrovsmzkdzakpc.supabase.co';

            const response = await fetch(`${supabaseUrl}/functions/v1/shopify-exchange-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shop: fullDomain,
                    client_id: clientId.trim(),
                    client_secret: clientSecret.trim()
                })
            });

            const data = await response.json();

            if (data.success && data.access_token) {
                setAccessToken(data.access_token);
                toast.success('Token Generado', 'Access Token obtenido y pegado correctamente.');
                setShowAutoToken(false);
                setClientSecret(''); // Limpiar secreto inmediatamente de UI por seguridad
                setClientId('');
            } else {
                toast.error('Credenciales Inválidas', data.details || data.error || 'Verifica tu Client ID y Secret.');
            }
        } catch (error) {
            console.error('Error generando token:', error);
            toast.error('Error', 'Problema de conexión al generar token. Intenta manualmente.');
        } finally {
            setIsGeneratingToken(false);
        }
    };

    // URL corta del webhook: usa el dominio configurado + /webhook/ + shortId
    // Internamente redirigimos al Edge Function real de Supabase (NO exponer project ID)
    const shortId = (tiendaActual as any).webhook_short_id;
    const webhookUrl = shortId ? `${siteUrl.replace(/\/$/, '')}/webhook/${shortId}` : '';

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
                maxHeight: '90vh',
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
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <ShieldCheck size={20} color="var(--color-success)" />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <strong>Seguridad:</strong> DropCost solo usa tokens de aplicaciones personalizadas. Tus credenciales privadas nunca son solicitadas.
                        </span>
                    </div>

                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                        Conecta tus pedidos de Shopify en tiempo real para optimizar tus cálculos de costos y ganancias automáticamente.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Dominio Shopify
                            </label>
                            <div style={{ display: 'flex' }}>
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="mi-tienda"
                                    autoComplete="off"
                                    spellCheck="false"
                                    style={{
                                        flex: 1, padding: '10px 12px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRight: 'none',
                                        borderRadius: '8px 0 0 8px',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px', outline: 'none'
                                    }}
                                />
                                <div style={{
                                    padding: '10px 12px', backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)', borderRadius: '0 8px 8px 0',
                                    color: 'var(--text-tertiary)', fontSize: '14px', display: 'flex', alignItems: 'center',
                                    userSelect: 'none'
                                }}>
                                    .myshopify.com
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Access Token <Badge variant="pill-secondary">Opcional</Badge>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type={showAccessToken ? "text" : "password"}
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    placeholder="shpat_xxxxxxxxxxxxxxxx"
                                    spellCheck="false"
                                    style={{
                                        width: '100%', padding: '10px 40px 10px 36px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px', outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessToken(!showAccessToken)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                        color: 'var(--text-tertiary)', display: 'flex'
                                    }}
                                >
                                    {showAccessToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Toggle Asistente Automático */}
                            <div style={{ marginTop: '8px' }}>
                                <button
                                    onClick={() => setShowAutoToken(!showAutoToken)}
                                    style={{
                                        background: 'none', border: 'none', color: 'var(--color-primary)',
                                        fontSize: '12.5px', fontWeight: 500, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: 0, textDecoration: 'none'
                                    }}
                                >
                                    {showAutoToken ? 'Ocultar asistente' : '¿No sabes obtener tu token manualmente?, Genéralo aquí'}
                                </button>
                            </div>

                            {/* UI Asistente Automático */}
                            {showAutoToken && (
                                <div style={{
                                    marginTop: '8px', padding: '16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px',
                                    animation: 'fadeIn 0.2s ease-out'
                                }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <ShieldCheck size={16} color="var(--color-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            <strong>Privacidad 100%:</strong> DropCost NO guarda tu Client ID ni Client Secret en la base de datos. Solo los enviamos de forma cifrada a Shopify para emitir tu Access Token y rellenar este formulario por ti.
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={clientId}
                                            onChange={(e) => setClientId(e.target.value)}
                                            placeholder="Client ID Oauth"
                                            disabled={isGeneratingToken}
                                            style={{
                                                flex: 1, padding: '8px 12px',
                                                backgroundColor: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px', color: 'var(--text-primary)',
                                                fontSize: '13px', outline: 'none'
                                            }}
                                        />
                                        <input
                                            type="password"
                                            value={clientSecret}
                                            onChange={(e) => setClientSecret(e.target.value)}
                                            placeholder="Client Secret Oauth"
                                            disabled={isGeneratingToken}
                                            style={{
                                                flex: 1, padding: '8px 12px',
                                                backgroundColor: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px', color: 'var(--text-primary)',
                                                fontSize: '13px', outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <a href="https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant"
                                            target="_blank" rel="noreferrer"
                                            style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ExternalLink size={12} /> Doc Shopify
                                        </a>
                                        <Button
                                            variant="secondary"
                                            onClick={handleGenerateAutoToken}
                                            isLoading={isGeneratingToken}
                                            disabled={!clientId.trim() || !clientSecret.trim() || !domain.trim()}
                                            style={{ padding: '6px 12px', fontSize: '12.5px', height: 'auto' }}
                                        >
                                            Extraer Token
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleGenerateWebhook}
                        isLoading={isSaving}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {accessToken ? 'Guardar y Sincronizar' : 'Generar Webhook'}
                    </Button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

                    {/* Result Info */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Enlace de Webhook para Shopify
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                readOnly
                                disabled
                                value={webhookUrl || 'Genera tu dominio primero...'}
                                style={{
                                    flex: 1, padding: '12px 16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: webhookUrl ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    fontSize: '13px', cursor: 'not-allowed', outline: 'none'
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
                        padding: '16px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)',
                        border: '1px solid var(--border-color)', borderRadius: '8px',
                        display: 'flex', gap: '12px', alignItems: 'flex-start'
                    }}>
                        <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            <p style={{ margin: '0 0 8px 0' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Webhook:</strong> Para ventas en tiempo real. Configura en Shopify {'>'} Notificaciones {'>'} Webhooks con evento <strong>Creación de pedido</strong>.
                            </p>
                            {accessToken && (
                                <p style={{ margin: 0 }}>
                                    <strong style={{ color: 'var(--color-success)' }}>Token detectado:</strong> El sistema intentará sincronizar tus ventas históricas automáticamente.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
