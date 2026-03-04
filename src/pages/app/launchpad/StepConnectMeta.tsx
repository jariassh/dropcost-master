import React, { useState, useEffect } from 'react';
import { Facebook, CheckCircle2, Info } from 'lucide-react';
import { Card, Button, Badge, useToast, Spinner } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { configService } from '@/services/configService';
import { subscriptionService } from '@/services/subscriptionService';

interface StepConnectMetaProps {
    onComplete: () => void;
}

interface MetaIntegration {
    id: string;
    estado: 'conectado' | 'desconectado' | 'error';
    meta_user_name?: string;
    ultima_sincronizacion?: string;
}

export function StepConnectMeta({ onComplete }: StepConnectMetaProps) {
    const toast = useToast();
    const { user } = useAuthStore();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [integration, setIntegration] = useState<MetaIntegration | null>(null);

    useEffect(() => {
        checkExistingConnection();
    }, [user]);

    const checkExistingConnection = async () => {
        if (!user?.id) return;
        setIsFetching(true);
        try {
            const { data } = await supabase
                .from('integraciones' as any)
                .select('*')
                .eq('usuario_id', user.id)
                .eq('tipo', 'meta_ads')
                .maybeSingle();

            if (data) {
                setIntegration(data as any);
            }
        } catch (err) {
            console.error("Error checking Meta connection:", err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleMetaLogin = async () => {
        setIsConnecting(true);
        try {
            const config = await configService.getConfig();
            const APP_ID = (config as any)?.meta_app_id || import.meta.env.VITE_META_APP_ID || '';

            if (!APP_ID) {
                toast.error('Error de configuración', 'No se ha configurado el ID de la aplicación de Meta.');
                setIsConnecting(false);
                return;
            }

            // URL de redirección fija (coincide con la config de Meta)
            const redirectUri = "https://mistyrose-jay-921979.hostingersite.com/api/auth/meta/callback";
            const scopes = [
                'ads_read',
                'ads_management',
                'business_management',
                'public_profile'
            ].join(',');

            const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&display=page`;

            // Redirección de página completa
            window.location.href = authUrl;
        } catch (err: any) {
            toast.error('Error', err.message);
            setIsConnecting(false);
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

    const isConnected = integration?.estado === 'conectado';

    // Si ya está conectado, mostrar como en MetaAdsIntegrationCard
    if (isConnected && integration) {
        return (
            <Card style={{ padding: '0' }}>
                {/* Header igual al de MetaAdsIntegrationCard */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
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
                                Perfil conectado correctamente
                            </p>
                        </div>
                    </div>
                    <Badge variant="success">CONECTADO</Badge>
                </div>

                {/* Info del perfil - igual al de integraciones */}
                <div style={{ padding: '0 24px 24px' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px', padding: '20px', backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '16px', border: '1px solid var(--border-color)'
                    }}>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Perfil Vinculado</p>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {integration.meta_user_name || 'Perfil de Meta'}
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
                </div>
            </Card>
        );
    }

    return (
        <Card style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    backgroundColor: 'rgba(24, 119, 242, 0.1)', color: '#1877F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px'
                }}>
                    <Facebook size={32} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Conecta tu cuenta de Meta
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    Necesitamos acceso a tu Business Manager para sincronizar tus campañas y métricas.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                    padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>Optimiza tu CPA al máximo</p>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                            Al conectar tu perfil de Meta, DropCost Master podrá importar automáticamente el rendimiento de tus campañas. Esta conexión es necesaria para ver métricas reales en el Dashboard.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={handleMetaLogin}
                        isLoading={isConnecting}
                        style={{ backgroundColor: '#1877F2', border: 'none' }}
                    >
                        <Facebook size={20} style={{ marginRight: '8px' }} />
                        Conectar Perfil de Meta
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onComplete}
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        Omitir por ahora
                    </Button>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            <strong>Nota:</strong> Esta integración es a nivel de perfil de usuario. Una vez conectada, podrás asignar cuentas publicitarias específicas a cada una de tus tiendas.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
