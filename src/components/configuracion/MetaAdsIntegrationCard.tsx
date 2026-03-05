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

interface MetaAdsIntegrationCardProps {
    onSelectIntegration?: (id: string) => void;
    selectedId?: string | null;
}

export function MetaAdsIntegrationCard({ onSelectIntegration, selectedId }: MetaAdsIntegrationCardProps) {
    const { user } = useAuthStore();
    const toast = useToast();

    const [integrations, setIntegrations] = useState<MetaIntegration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [integrationToDisconnect, setIntegrationToDisconnect] = useState<string | null>(null);
    const [showNewProfileWarning, setShowNewProfileWarning] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const canConnect = subscriptionService.canConnectMetaAds();

    const fetchIntegrations = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('integraciones')
                .select('*')
                .eq('usuario_id', user.id)
                .eq('tipo', 'meta_ads');

            if (data && data.length > 0) {
                setIntegrations(data as any);
                // Auto-seleccionar el primero si no hay uno seleccionado
                if (!selectedId && onSelectIntegration) {
                    onSelectIntegration(data[0].id);
                }
            } else {
                setIntegrations([]);
                if (onSelectIntegration) onSelectIntegration('');
            }
        } catch (err) {
            console.error("Error fetching integrations:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedId, onSelectIntegration]);

    useEffect(() => {
        fetchIntegrations();
    }, [user, fetchIntegrations]);

    const handleConnect = async () => {
        setShowNewProfileWarning(false);
        if (!canConnect) {
            toast.error('Plan no compatible', 'Tu plan actual no permite la conexión con Meta Ads.');
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

            const redirectUri = "https://mistyrose-jay-921979.hostingersite.com/api/auth/meta/callback";
            const scopes = ['ads_read', 'ads_management', 'business_management', 'public_profile'].join(',');
            const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&display=page`;

            window.location.href = authUrl;
        } catch (err) {
            toast.error('Error', 'No se pudo iniciar la conexión con Meta.');
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!integrationToDisconnect) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('integraciones')
                .delete()
                .eq('id', integrationToDisconnect);

            if (error) throw error;

            toast.success('Perfil desconectado', 'Se ha eliminado la integración correctamente.');
            fetchIntegrations();
        } catch (err) {
            toast.error('Error', 'No se pudo desconectar la integración.');
        } finally {
            setIsLoading(false);
            setShowDisconnectConfirm(false);
            setIntegrationToDisconnect(null);
        }
    };

    if (isLoading && integrations.length === 0) {
        return (
            <Card style={{ padding: isMobile ? '24px 16px' : '40px', textAlign: 'center' }}>
                <Spinner />
                <p style={{ marginTop: '16px', color: 'var(--text-tertiary)', fontSize: isMobile ? '12px' : '14px' }}>Cargando integraciones...</p>
            </Card>
        );
    }

    const isConnected = integrations.length > 0;

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <Card style={{ padding: isMobile ? '20px 16px' : '24px' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '24px', gap: isMobile ? '16px' : '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                        <div style={{
                            width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px',
                            backgroundColor: 'rgba(24, 119, 242, 0.1)', color: '#1877F2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Facebook size={isMobile ? 20 : 24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>Meta Ads (Facebook)</h3>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                {isConnected ? (isMobile ? 'Perfiles conectados' : 'Gestiona tus perfiles conectados') : 'Conecta tu cuenta para ver el CPA real'}
                            </p>
                        </div>
                    </div>
                    {isConnected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowNewProfileWarning(true)}
                                style={{ gap: '6px', fontSize: '11px', flex: isMobile ? 1 : 'none' }}
                            >
                                <RefreshCw size={12} />
                                Agregar nuevo perfil
                            </Button>
                            <Badge variant="success" style={{ fontSize: '10px' }}>CONECTADO</Badge>
                        </div>
                    )}
                </div>

                {isConnected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', margin: '0 0 -8px', textTransform: 'uppercase' }}>Perfiles Conectados</p>

                        {integrations.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelectIntegration?.(item.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: isMobile ? '12px 14px' : '16px 20px', borderRadius: '16px',
                                    backgroundColor: selectedId === item.id ? 'rgba(var(--color-primary-rgb), 0.05)' : 'var(--bg-secondary)',
                                    border: `1px solid ${selectedId === item.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                    cursor: 'pointer', transition: 'all 0.2s', gap: '12px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', flex: 1, overflow: 'hidden' }}>
                                    <input
                                        type="radio"
                                        checked={selectedId === item.id}
                                        onChange={() => { }} // Manage by onClick of row
                                        style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <p style={{ margin: 0, fontSize: isMobile ? '13px' : '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.meta_user_name}</span>
                                            <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {isMobile ? 'Sinc: ' : 'Sincronizado: '}{item.ultima_sincronizacion ? new Date(item.ultima_sincronizacion).toLocaleDateString() : 'Pendiente'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIntegrationToDisconnect(item.id);
                                            setShowDisconnectConfirm(true);
                                        }}
                                        style={{ color: 'var(--color-error)', padding: '6px' }}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                    {selectedId === item.id && (
                                        <Badge variant="pill-purple" style={{ fontSize: '9px', padding: '2px 6px' }}>{isMobile ? 'ACT' : 'ACTIVO'}</Badge>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)', marginTop: '8px' }}>
                            <Info size={14} color="var(--color-primary)" />
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Selecciona un perfil para gestionar sus cuentas publicitarias en la tabla de abajo.
                            </p>
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
                                Al conectar tu perfil de Meta, DropCost Master podrá importar automáticamente el rendimiento de tus campañas.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            style={{
                                backgroundColor: canConnect ? '#1877F2' : 'var(--text-tertiary)',
                                border: 'none', gap: '10px', padding: '14px 32px', fontSize: '15px', fontWeight: 600,
                                opacity: canConnect ? 1 : 0.6, cursor: canConnect ? 'pointer' : 'not-allowed'
                            }}
                            onClick={() => setShowNewProfileWarning(true)}
                            isLoading={isConnecting}
                            disabled={!canConnect}
                        >
                            <Facebook size={20} />
                            Conectar Perfil de Meta
                        </Button>
                    </div>
                )}
            </Card>

            <ConfirmDialog
                isOpen={showDisconnectConfirm}
                title="¿Desconectar Perfil?"
                description="Se eliminará el acceso a las cuentas publicitarias de este perfil."
                variant="danger"
                confirmLabel="Sí, desconectar"
                onConfirm={handleDisconnect}
                onCancel={() => {
                    setShowDisconnectConfirm(false);
                    setIntegrationToDisconnect(null);
                }}
            />

            {/* Modal de Advertencia para Nuevo Perfil */}
            <ConfirmDialog
                isOpen={showNewProfileWarning}
                title="⚠️ Atención: Nuevo Perfil de Meta"
                description={
                    <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6' }}>
                        <p>Para vincular un <strong>nuevo perfil de Facebook distinto</strong> al actual, por favor sigue estos pasos:</p>
                        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>Abre <strong>DropCost Master</strong> en una ventana de incógnito o en un <strong>navegador diferente</strong>.</li>
                            <li>Asegúrate de tener la <strong>sesión iniciada en el nuevo perfil de Facebook</strong> que deseas vincular en ese mismo navegador.</li>
                            <li>Haz clic en conectar desde esa ventana.</li>
                        </ol>
                        <p style={{ marginTop: '12px', color: 'var(--color-warning)', fontWeight: 600 }}>
                            Si usas el mismo navegador, Facebook intentará reconectar el perfil actual automáticamente.
                        </p>
                    </div>
                }
                variant="info"
                confirmLabel="Entendido, Continuar"
                onConfirm={handleConnect}
                onCancel={() => setShowNewProfileWarning(false)}
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
