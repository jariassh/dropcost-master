import React, { useState, useEffect } from 'react';
import {
    Link as LinkIcon,
    Copy,
    Globe as GlobeIcon,
    Info as InfoIcon,
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import { Card, Button, useToast, Spinner } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { configService } from '@/services/configService';
import { encryptionUtils } from '@/utils/encryptionUtils';

interface StepConnectShopifyProps {
    tiendaId: string;
    onComplete: () => void;
}

export function StepConnectShopify({ tiendaId, onComplete }: StepConnectShopifyProps) {
    const toast = useToast();
    const [shopifyDomain, setShopifyDomain] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [showAutoToken, setShowAutoToken] = useState(false);
    const [showAccessToken, setShowAccessToken] = useState(false);
    const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
    const [existingDomain, setExistingDomain] = useState('');
    const [isFetching, setIsFetching] = useState(true);
    const [siteUrl, setSiteUrl] = useState('');
    const [webhookShortId, setWebhookShortId] = useState('');
    const [copiedScopes, setCopiedScopes] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const SHOPIFY_SCOPES = ['read_orders', 'read_all_orders', 'read_products', 'read_inventory', 'read_analytics'];
    const scopesString = SHOPIFY_SCOPES.join(',');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        checkExistingConnection();
        loadSiteUrl();
    }, [tiendaId]);

    const loadSiteUrl = async () => {
        try {
            const config = await configService.getConfig();
            if (config.site_url) {
                setSiteUrl(config.site_url);
            }
        } catch (e) {
            console.warn('Error cargando site_url:', e);
        }
    };

    const checkExistingConnection = async () => {
        if (!tiendaId) {
            setIsFetching(false);
            return;
        }
        setIsFetching(true);
        try {
            const { data: intData } = await supabase
                .from('integraciones' as any)
                .select('*')
                .eq('tienda_id', tiendaId)
                .eq('tipo', 'shopify')
                .eq('estado', 'conectado')
                .maybeSingle();

            const { data: storeData } = await supabase
                .from('tiendas' as any)
                .select('shopify_domain, shopify_shop_name, webhook_short_id')
                .eq('id', tiendaId)
                .single();

            if (storeData) {
                const store = storeData as any;
                const domainValue = store.shopify_domain || store.shopify_shop_name || '';
                if (domainValue) {
                    setExistingDomain(domainValue);
                    setShopifyDomain(domainValue);
                }
                if (store.webhook_short_id) {
                    setWebhookShortId(store.webhook_short_id);
                }
            }

            if (intData) {
                setIsAlreadyConnected(true);
                // Si existe el token, desencriptarlo y mostrarlo
                if ((intData as any).credenciales_encriptadas) {
                    try {
                        const decrypted = encryptionUtils.decrypt((intData as any).credenciales_encriptadas);
                        if (decrypted) setAccessToken(decrypted);
                    } catch (e) {
                        console.warn("Error decrypting token:", e);
                    }
                }
            }
        } catch (err) {
            console.error("Error checking Shopify connection:", err);
        } finally {
            setIsFetching(false);
        }
    };

    const webhookUrl = webhookShortId && siteUrl
        ? `${siteUrl.replace(/\/$/, '')}/webhook/${webhookShortId}`
        : '';

    const handleCopyWebhook = () => {
        if (!webhookUrl) return;
        navigator.clipboard.writeText(webhookUrl);
        toast.success('Copiado', 'URL de webhook copiada al portapapeles.');
    };

    const handleGenerateWebhook = async () => {
        if (!shopifyDomain.trim()) {
            toast.error('Error', 'Debes ingresar el dominio de tu tienda Shopify.');
            return;
        }

        setIsLoading(true);
        try {
            const newShortId = webhookShortId || generateShortId();
            const fullDomain = `${shopifyDomain.trim()}.myshopify.com`;

            const { error: storeError } = await supabase
                .from('tiendas' as any)
                .update({
                    shopify_domain: shopifyDomain.trim(),
                    webhook_short_id: newShortId
                })
                .eq('id', tiendaId);

            if (storeError) throw storeError;

            const { error: intError } = await supabase
                .from('integraciones' as any)
                .upsert({
                    tienda_id: tiendaId,
                    tipo: 'shopify',
                    shop_url: fullDomain,
                    credenciales_encriptadas: accessToken.trim() ? accessToken.trim() : null,
                    estado: 'conectado',
                    config_sync: { last_sync: new Date().toISOString() },
                    usuario_id: (await supabase.auth.getUser()).data.user?.id
                });

            if (intError) throw intError;

            toast.success('¡Configuración Guardada!', 'La tienda se ha vinculado a Shopify correctamente.');
            onComplete();
        } catch (error: any) {
            console.error('Error en configuración Shopify:', error);
            toast.error('Error', error.message || 'Ocurrió un problema al guardar la configuración.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateShortId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 7; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleGenerateAutoToken = async () => {
        if (!shopifyDomain.trim() || !clientId.trim() || !clientSecret.trim()) {
            toast.error('Error', 'Debes ingresar el dominio, Client ID y Client Secret.');
            return;
        }

        setIsGeneratingToken(true);
        try {
            const fullDomain = `${shopifyDomain.trim()}.myshopify.com`;
            const { data, error } = await supabase.functions.invoke('shopify-exchange-token', {
                body: {
                    shop: fullDomain,
                    client_id: clientId.trim(),
                    client_secret: clientSecret.trim()
                }
            });

            if (error) throw error;

            if (data.success && data.access_token) {
                setAccessToken(data.access_token);
                toast.success('Token Generado', 'Access Token obtenido y pegado correctamente.');
                setShowAutoToken(false);
                setClientSecret('');
                setClientId('');
            } else {
                toast.error('Credenciales Inválidas', data.details || data.error || 'Verifica tu Client ID y Secret.');
            }
        } catch (error: any) {
            console.error('Error generando token:', error);
            toast.error('Error', 'Problema de conexión al generar token. Intenta manualmente.');
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const handleCopyScopes = async () => {
        try {
            await navigator.clipboard.writeText(scopesString);
            setCopiedScopes(true);
            toast.success('Copiado', 'Scopes copiados al portapapeles.');
            setTimeout(() => setCopiedScopes(false), 2000);
        } catch (error) {
            toast.error('Error', 'No se pudieron copiar los scopes.');
        }
    };

    if (isFetching) {
        return (
            <div style={{
                padding: '100px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
            }}>
                <Spinner size="lg" />
            </div>
        );
    }

    // Ya no usamos el early return de isAlreadyConnected para mostrar siempre el formulario completo como en el modal

    return (
        <Card style={{ padding: isMobile ? '16px' : '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', borderRadius: '16px',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <LinkIcon size={isMobile ? 24 : 32} />
                </div>
                <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {isAlreadyConnected ? 'Shopify Conectado' : 'Configuración de Shopify'}
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: isMobile ? '13px' : '14px' }}>
                    {isAlreadyConnected
                        ? 'Tu tienda Shopify está vinculada. Puedes actualizar la configuración si es necesario.'
                        : 'Conecta tus pedidos en tiempo real para optimizar tus cálculos automáticamente.'}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <ShieldCheck size={20} color="var(--color-success)" />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <strong>Seguridad:</strong> DropCost solo usa tokens de aplicaciones personalizadas. Tus credenciales privadas nunca son solicitadas.
                    </span>
                </div>

                {/* API Scopes Section */}
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div>
                        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Permisos (API Scopes) requeridos y su objetivo:
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: isMobile ? '12px' : '8px 20px'
                        }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                <strong style={{ color: 'var(--color-primary)' }}>read_orders:</strong> Ventas y órdenes del día.
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                <strong style={{ color: 'var(--color-primary)' }}>read_all_orders:</strong> Importación histórico (Backfill).
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                <strong style={{ color: 'var(--color-primary)' }}>read_products:</strong> Vínculo automático a costeos.
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                <strong style={{ color: 'var(--color-primary)' }}>read_inventory:</strong> Stock en tiempo real.
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.4, gridColumn: 'span 2' }}>
                                <strong style={{ color: 'var(--color-primary)' }}>read_analytics:</strong> Métricas agregadas de rendimiento.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                        <input
                            type="text"
                            readOnly
                            value={scopesString}
                            style={{
                                width: '100%', padding: '10px 44px 10px 12px',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px', outline: 'none',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            onClick={handleCopyScopes}
                            style={{
                                position: 'absolute',
                                right: '4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                display: 'flex'
                            }}
                        >
                            {copiedScopes ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Dominio Shopify
                        </label>
                        <div style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }}>
                            <input
                                type="text"
                                value={shopifyDomain}
                                onChange={(e) => setShopifyDomain(e.target.value)}
                                placeholder="mi-tienda"
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: '10px 12px',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRight: 'none',
                                    borderRadius: '8px 0 0 8px',
                                    color: 'var(--text-primary)',
                                    fontSize: isMobile ? '13px' : '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{
                                padding: isMobile ? '10px 8px' : '10px 12px',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0 8px 8px 0',
                                color: 'var(--text-tertiary)',
                                fontSize: isMobile ? '12px' : '14px',
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                            }}>
                                .myshopify.com
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Access Token <span style={{ fontSize: '10px', opacity: 0.6 }}>(Opcional)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type={showAccessToken ? "text" : "password"}
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="shpat_xxxxxxxxxxxxxxxx"
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
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: 0
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
                                borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px'
                            }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                    <ShieldCheck size={16} color="var(--color-success)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                        <strong>Privacidad 100%:</strong> DropCost NO guarda tu Client ID ni Client Secret. Solo los usamos para emitir tu Access Token.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        placeholder="Client ID Oauth"
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
                                        style={{
                                            flex: 1, padding: '8px 12px',
                                            backgroundColor: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px', color: 'var(--text-primary)',
                                            fontSize: '13px', outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="secondary"
                                        onClick={handleGenerateAutoToken}
                                        isLoading={isGeneratingToken}
                                        disabled={!clientId.trim() || !clientSecret.trim() || !shopifyDomain.trim()}
                                        style={{ padding: '6px 12px', fontSize: '12.5px', height: 'auto' }}
                                    >
                                        Extraer Token
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                    <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={handleGenerateWebhook}
                        isLoading={isLoading}
                    >
                        {accessToken || isAlreadyConnected ? 'Guardar y Sincronizar' : 'Generar Webhook'}
                    </Button>
                </div>

                {webhookUrl && (
                    <div style={{
                        padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px',
                        border: '1px solid var(--border-color)', marginTop: '8px'
                    }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Enlace de Webhook para Shopify</p>
                        <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                            <input
                                type="text"
                                readOnly
                                value={webhookUrl}
                                style={{
                                    width: '100%',
                                    padding: '10px 44px 10px 12px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                onClick={handleCopyWebhook}
                                style={{
                                    position: 'absolute',
                                    right: '4px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    padding: '8px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                            >
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <div style={{
                    padding: '16px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)',
                    border: '1px solid var(--border-color)', borderRadius: '8px',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                    <InfoIcon size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <p style={{ margin: 0 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Webhook:</strong> Para ventas en tiempo real. Configura en Shopify {'>'} Notificaciones {'>'} Webhooks con eventos <strong>Creación de pedido</strong> y <strong>Cancelación de pedido</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
