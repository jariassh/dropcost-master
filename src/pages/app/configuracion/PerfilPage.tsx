import React, { useState, useEffect } from 'react';
import { User, Camera, CheckCircle2, Save, Zap, CreditCard, ArrowUpCircle, MessageCircle, Mail, AlertCircle, Share2, Shield, Bell, HelpCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { storageService } from '@/services/storageService';
import { SmartPhoneInput } from '@/components/common/SmartPhoneInput';
import { useToast, Button, SelectPais, Input, Badge } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { differenceInDays, parseISO } from 'date-fns';
import { paymentService } from '@/services/paymentService';
import { configService, GlobalConfig } from '@/services/configService';
import { subscriptionService } from '@/services/subscriptionService';

export function PerfilPage() {
    const { user, updateProfile } = useAuthStore();
    const navigate = useNavigate();
    const toast = useToast();

    // Profile State
    const [profileData, setProfileData] = useState({
        nombres: user?.nombres || '',
        apellidos: user?.apellidos || '',
        telefono: user?.telefono || '',
        pais: user?.pais || '',
        codigoReferido: user?.codigoReferido || '',
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Membership State
    const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
    const [isRenewing, setIsRenewing] = useState(false);

    // Notifications State
    const [notifPreferences, setNotifPreferences] = useState({ referrals: true, security: true, marketing: true });

    useEffect(() => {
        if (user) {
            setProfileData({
                nombres: user.nombres,
                apellidos: user.apellidos,
                telefono: user.telefono || '',
                pais: user.pais || '',
                codigoReferido: user.codigoReferido || '',
            });
        }
        configService.getConfig().then(setGlobalConfig);
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setIsUploadingAvatar(true);
        try {
            const { success, url, error } = await storageService.uploadAvatar(file, user.id);
            if (success && url) {
                const updateSuccess = await updateProfile({ avatarUrl: url });
                if (updateSuccess) {
                    toast.success('Imagen actualizada', 'Tu foto de perfil ha sido cambiada correctamente.');
                }
            } else {
                toast.error('Error al subir', error || 'No se pudo subir la imagen.');
            }
        } catch (error) {
            toast.error('Error', 'Ocurrió un error inesperado al subir la imagen.');
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        const success = await updateProfile(profileData);
        setIsSavingProfile(false);
        if (success) {
            toast.success('Perfil actualizado', 'Tus cambios han sido guardados correctamente.');
        } else {
            toast.error('Error al actualizar', 'No pudimos guardar los cambios en tu perfil.');
        }
    };

    const handleRenew = async () => {
        if (!user?.planId) return;
        setIsRenewing(true);
        try {
            const initPoint = await paymentService.createCheckoutSession(user.planId, 'monthly');
            if (initPoint) {
                window.location.href = initPoint;
            }
        } catch (error: any) {
            toast.error('Error al iniciar pago', error.message || 'No se pudo generar el link de renovación.');
        } finally {
            setIsRenewing(false);
        }
    };

    const daysRemaining = user?.fechaVencimiento
        ? differenceInDays(parseISO(user.fechaVencimiento), new Date())
        : 99;
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
    const isActive = user?.estadoSuscripcion === 'activa';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.3s' }}>

            {/* Top Section: Profile & Multi-stack Right side */}
            <div className="perfil-top-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'stretch' }}>

                {/* Personal Info Card (Vertical Layout for more height) */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 28px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <User size={20} color="var(--color-primary)" />
                            Información Personal
                        </h3>
                        {user?.emailVerificado && (
                            <div style={{ display: 'inline-flex', padding: '4px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', alignItems: 'center', gap: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <CheckCircle2 size={12} color="#10B981" />
                                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>VERIFICADO</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
                        {/* Avatar centered at top */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                                    border: '4px solid rgba(var(--color-primary-rgb), 0.2)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                    backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isUploadingAvatar ? <Spinner /> : (
                                        user?.avatarUrl ?
                                            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-primary)' }}>
                                                {user?.nombres[0]}{user?.apellidos[0]}
                                            </div>
                                    )}
                                </div>
                                <label style={{
                                    position: 'absolute', bottom: '4px', right: '4px',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    backgroundColor: 'var(--color-primary)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', border: '3px solid var(--card-bg)', transition: 'transform 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }} className="hover-scale">
                                    <Camera size={18} />
                                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                </label>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.nombres} {user?.apellidos}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{user?.email}</p>
                            </div>
                        </div>

                        {/* Text fields below */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <Input label="Nombres" value={profileData.nombres} onChange={e => setProfileData({ ...profileData, nombres: e.target.value })} />
                                <Input label="Apellidos" value={profileData.apellidos} onChange={e => setProfileData({ ...profileData, apellidos: e.target.value })} />
                            </div>
                            <SmartPhoneInput label="Teléfono Personal" value={profileData.telefono} onChange={(fullValue, iso) => setProfileData({ ...profileData, telefono: fullValue, pais: iso })} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <SelectPais label="País de Residencia" value={profileData.pais} onChange={(iso) => setProfileData({ ...profileData, pais: iso })} showMoneda={false} disabled={!!user?.pais} />
                                <Input label="Código de Referido (Inamovible)" value={profileData.codigoReferido ?? user?.codigoReferido ?? ''} disabled={!!user?.codigoReferido} placeholder="Ingresa un código" helperText={!user?.codigoReferido ? "Una vez guardado no se puede cambiar." : undefined} />
                            </div>

                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                                <Button variant="primary" onClick={handleSaveProfile} isLoading={isSavingProfile} style={{ gap: '10px', padding: '12px 48px', minWidth: '200px' }}>
                                    <Save size={18} /> Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Stack: Membership & Help */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Membership Card */}
                    <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 2, display: 'flex', flexDirection: 'column' }}>
                        {isActive ? (
                            <>
                                <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.1) 0%, rgba(var(--color-primary-rgb), 0.02) 100%)', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb), 0.7))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.2)' }}>
                                                <Zap size={22} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>
                                                    {user?.plan?.name?.toUpperCase() || 'PLAN PRO'}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <Badge variant="success">ACTIVA</Badge>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Vence {user?.fechaVencimiento ? new Date(user.fechaVencimiento).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button variant="primary" fullWidth onClick={() => navigate('/pricing')} style={{ gap: '8px', fontSize: '14px' }}>
                                            <ArrowUpCircle size={16} /> Mejorar Plan
                                        </Button>
                                        <Button variant="secondary" fullWidth onClick={handleRenew} isLoading={isRenewing} style={{ gap: '8px', fontSize: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                            <CreditCard size={16} /> Renovar
                                        </Button>
                                    </div>
                                </div>

                                <div style={{ padding: '24px', flex: 1 }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Beneficios del Plan</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <FeatureItem label={`${user?.plan?.limits?.stores === -1 ? 'Multi' : user?.plan?.limits?.stores ?? '1'} Tiendas`} active />
                                        <FeatureItem label={`${user?.plan?.limits?.costeos_limit || 'Ilimitados'} Costeos`} active />
                                        <FeatureItem label="Soporte VIP" active={user?.planId !== 'plan_free'} />
                                        <FeatureItem label="Meta Ads Integration" active={subscriptionService.canConnectMetaAds()} />
                                        <FeatureItem label="Sincronizador Dropi" active={subscriptionService.isDropiSyncEnabled()} />
                                        <FeatureItem label="Billetera Digital" active={!!user?.plan?.limits?.access_wallet} />
                                        <FeatureItem label="Duplicado de Ofertas" active={!!user?.plan?.limits?.can_duplicate_offers} />
                                        <FeatureItem label="Dashboard Operacional" active={subscriptionService.isDashboardEnabled()} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '40px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(239,68,68,0.02)' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', margin: '0 auto 16px' }}>
                                    <AlertCircle size={30} />
                                </div>
                                <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '18px' }}>Tu plan ha expirado</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>Reactiva tu acceso para no perder tus datos.</p>
                                <Button variant="primary" onClick={() => navigate('/pricing')} style={{ gap: '10px', padding: '12px 28px', margin: '0 auto' }}> <Zap size={18} /> Reactivar Suscripción </Button>
                            </div>
                        )}
                    </div>

                    {/* Help & Support Card (Smaller buttons) */}
                    <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <HelpCircle size={18} color="var(--color-primary)" />
                            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>¿Necesitas ayuda?</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                onClick={() => window.open(`https://wa.me/${globalConfig?.telefono?.replace(/[^0-9]/g, '')}`, '_blank')}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                className="hover-lift"
                            >
                                <MessageCircle size={24} color="#25D366" />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>WhatsApp</span>
                            </button>
                            <button
                                onClick={() => window.open(`mailto:${globalConfig?.email_contacto}`, '_blank')}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                className="hover-lift"
                            >
                                <FileText size={24} color="var(--color-primary)" />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Facturación</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Notifications (Full Width) */}
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bell size={20} color="var(--color-primary)" />
                            Personalizar Notificaciones
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-tertiary)' }}>Selecciona los canales y alertas que prefieres recibir directamente.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    <NotificationItem
                        icon={<Share2 size={20} />}
                        title="Programa de Referidos"
                        description="Mantente al día con nuevos registros, activaciones y comisiones listas para cobrar."
                        checked={notifPreferences.referrals}
                        onChange={() => setNotifPreferences({ ...notifPreferences, referrals: !notifPreferences.referrals })}
                    />
                    <NotificationItem
                        icon={<Shield size={20} />}
                        title="Seguridad de la Cuenta"
                        description="Notificaciones críticas sobre accesos sospechosos y cambios en tu configuración de seguridad."
                        checked={notifPreferences.security}
                        onChange={() => setNotifPreferences({ ...notifPreferences, security: !notifPreferences.security })}
                    />
                    <NotificationItem
                        icon={<Zap size={20} />}
                        title="Alertas de Sistema y Mejoras"
                        description="Sé el primero en probar nuevas funciones, guías maestras y actualizaciones importantes."
                        checked={notifPreferences.marketing}
                        onChange={() => setNotifPreferences({ ...notifPreferences, marketing: !notifPreferences.marketing })}
                    />
                </div>
            </div>

            <style>{`
                @media (max-width: 1200px) {
                    .perfil-top-grid { grid-template-columns: 1fr !important; }
                }
                .hover-lift:hover { transform: translateY(-4px); border-color: var(--color-primary) !important; background-color: rgba(var(--color-primary-rgb), 0.05) !important; }
            `}</style>
        </div>
    );
}

function FeatureItem({ label, active }: { label: string, active: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#10B981' : '#6B7280', flexShrink: 0 }}>
                <CheckCircle2 size={11} />
            </div>
            <span style={{ fontSize: '13px', color: active ? 'var(--text-secondary)' : 'var(--text-tertiary)', fontWeight: active ? 600 : 400 }}>{label}</span>
        </div>
    );
}

function NotificationItem({ icon, title, description, checked, onChange }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '100%', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{icon}</div>
                <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{description}</p>
                </div>
            </div>
            <div onClick={onChange} style={{ width: '48px', height: '26px', borderRadius: '13px', backgroundColor: checked ? 'var(--color-primary)' : 'var(--card-border)', position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0, marginLeft: '16px', marginTop: '4px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: checked ? '25px' : '3px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
            </div>
        </div>
    );
}
