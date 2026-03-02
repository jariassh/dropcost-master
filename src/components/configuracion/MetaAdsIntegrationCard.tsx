import React, { useState, useEffect, useCallback } from 'react';
import { Facebook, CheckCircle2, AlertCircle, Info, RefreshCw, Layers, ExternalLink, Trash2, Target, Activity } from 'lucide-react';
import { Button, Card, Badge, Spinner, useToast, ConfirmDialog } from '@/components/common';
import { configService } from '@/services/configService';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { subscriptionService } from '@/services/subscriptionService';

interface MetaIntegration {
    id: string;
    estado: 'conectado' | 'desconectado' | 'error';
    meta_user_name?: string;
    ultima_sincronizacion?: string;
}

export function MetaAdsIntegrationCard() {
    const { user } = useAuthStore();
    const { tiendas } = useStoreStore();
    const toast = useToast();

    const [integration, setIntegration] = useState<MetaIntegration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [siteUrl, setSiteUrl] = useState('');
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

    const canConnect = subscriptionService.canConnectMetaAds();

    const fetchIntegration = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('integraciones')
                .select('*')
                .eq('usuario_id', user.id)
                .eq('tipo', 'meta_ads')
                .maybeSingle();

            if (data) {
                setIntegration(data as any);
            } else {
                setIntegration({ id: '', estado: 'desconectado' });
            }
        } catch (err) {
            // Error silencioso en fetch
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await configService.getConfig();
            if (config?.site_url) {
                setSiteUrl(config.site_url);
            } else {
                setSiteUrl(window.location.origin);
            }
        };

        fetchIntegration();
        fetchConfig();
    }, [user, fetchIntegration]);

    const handleConnect = async () => {
        if (!canConnect) {
            toast.error('Plan no compatible', 'Tu plan actual no permite la conexión con Meta Ads. Actualiza tu plan para acceder a esta función.');
            return;
        }

        setIsConnecting(true);
        try {
            const config = await configService.getConfig();
            const APP_ID = (config as any)?.meta_app_id || import.meta.env.VITE_META_APP_ID || '';

            if (!APP_ID) {
                toast.error('Error de configuración', 'No se ha configurado el ID de la aplicación de Meta.');
                setIsConnecting(false);
                return;
            }

            // Usamos la URL absoluta fija para asegurar coincidencia exacta con Meta y el callback
            const redirectUri = "https://mistyrose-jay-921979.hostingersite.com/api/auth/meta/callback";
            console.log("[MetaIntegration] Redirect URI configurado:", redirectUri);
            const scopes = [
                'ads_read',
                'ads_management',
                'business_management',
                'public_profile'
            ].join(',');

            const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&display=page`;

            console.log("[MetaIntegration] Redirigiendo a Meta OAuth (Misma pestaña)...");

            // REDIRECCIÓN DE PÁGINA COMPLETA (Misma ventana)
            window.location.href = authUrl;

        } catch (err) {
            console.error("[MetaIntegration] Error al iniciar flujo OAuth:", err);
            toast.error('Error', 'No se pudo iniciar la conexión con Meta.');
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('integraciones')
                .delete()
                .eq('usuario_id', user.id)
                .eq('tipo', 'meta_ads');

            if (error) throw error;

            setIntegration({ id: '', estado: 'desconectado' });
            toast.success('Meta Ads desconectado', 'Se ha eliminado la integración correctamente.');
        } catch (err) {
            toast.error('Error', 'No se pudo desconectar la integración.');
        } finally {
            setIsLoading(false);
            setShowDisconnectConfirm(false);
        }
    };

    if (isLoading) {
        return (
            <Card style={{ padding: '40px', textAlign: 'center' }}>
                <Spinner />
                <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Cargando integración...</p>
            </Card>
        );
    }

    const isConnected = integration?.estado === 'conectado';

    return (
        <div style={{ maxWidth: '800px', animation: 'fadeIn 0.3s' }}>
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            backgroundColor: 'rgba(24, 119, 242, 0.1)', color: '#1877F2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Facebook size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Meta Ads (Facebook)</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                {isConnected ? 'Perfil conectado correctamente' : 'Conecta tu cuenta publicitaria para ver el CPA real'}
                            </p>
                        </div>
                    </div>
                    {isConnected && (
                        <Badge variant="success">CONECTADO</Badge>
                    )}
                </div>

                {isConnected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px', padding: '20px', backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '16px', border: '1px solid var(--border-color)'
                        }}>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Perfil Vinculado</p>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {integration.meta_user_name}
                                    <CheckCircle2 size={14} color="#10B981" />
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Última Sincronización</p>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    {integration.ultima_sincronizacion
                                        ? new Date(integration.ultima_sincronizacion).toLocaleString()
                                        : 'Pendiente'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Para gestionar qué cuentas se asocian a cada tienda, ve a <strong>Mis Tiendas</strong>.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button variant="secondary" onClick={handleConnect} style={{ gap: '8px' }} size="sm">
                                    <RefreshCw size={14} />
                                    Actualizar Conexión
                                </Button>
                                <Button variant="ghost" onClick={() => setShowDisconnectConfirm(true)} style={{ gap: '8px', color: 'var(--color-error)' }} size="sm">
                                    <Trash2 size={14} />
                                    Desconectar
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        borderRadius: '16px', padding: '32px', textAlign: 'center'
                    }}>
                        {!canConnect && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px', padding: '12px', marginBottom: '20px',
                                display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'
                            }}>
                                <AlertCircle size={16} color="#EF4444" />
                                <p style={{ margin: 0, fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>
                                    Tu plan actual no admite conexión con Meta Ads.
                                </p>
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Optimiza tu CPA al máximo</p>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto' }}>
                                Al conectar tu perfil de Meta, DropCost Master podrá importar automáticamente el rendimiento de tus campañas. Esta conexión es necesaria para ver métricas reales en el Dashboard.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            style={{
                                backgroundColor: canConnect ? '#1877F2' : 'var(--text-tertiary)',
                                border: 'none', gap: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: 700,
                                opacity: canConnect ? 1 : 0.6, cursor: canConnect ? 'pointer' : 'not-allowed'
                            }}
                            onClick={handleConnect}
                            isLoading={isConnecting}
                            disabled={!canConnect}
                        >
                            <Facebook size={20} />
                            Conectar Perfil de Meta
                        </Button>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '40px' }}>
                            <BenefitItem icon={<Target size={18} />} label="Conversiones Reales" />
                            <BenefitItem icon={<Activity size={18} />} label="Gasto Sincronizado" />
                            <BenefitItem icon={<Layers size={18} />} label="Múltiples Cuentas" />
                        </div>
                    </div>
                )}

                {!isConnected && (
                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                <strong>Nota Importante:</strong> Esta integración es a nivel de perfil de usuario. Una vez conectada, podrás asignar cuentas publicitarias específicas a cada una de tus tiendas desde la sección "Mis Tiendas".
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            <ConfirmDialog
                isOpen={showDisconnectConfirm}
                title="¿Desconectar Meta Ads?"
                description="Se eliminará el acceso a tus cuentas publicitarias y dejarán de sincronizarse los gastos en tus tiendas."
                variant="danger"
                confirmLabel="Sí, desconectar"
                onConfirm={handleDisconnect}
                onCancel={() => setShowDisconnectConfirm(false)}
            />
        </div>
    );
}

function BenefitItem({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: 'var(--color-primary)', opacity: 0.8 }}>{icon}</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{label}</span>
        </div>
    );
}
