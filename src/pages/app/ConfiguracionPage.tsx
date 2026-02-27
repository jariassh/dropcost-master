/**
 * Página de Configuración y Seguridad.
 * Permite editar el perfil, gestionar seguridad (contraseña, 2FA) y sesiones activas.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Shield,
    Smartphone,
    Key,
    LogOut,
    Monitor,
    Globe,
    Phone,
    Share2,
    CheckCircle2,
    AlertCircle,
    X,
    Save,
    Trash2,
    Camera,
    Upload,
    Mail,
    RefreshCw,
    Sparkles,
    Store,
    LayoutGrid,
    Plus,
    Building2,
    Settings2,
    MoreVertical,
    FileText,
    Search,
    Pencil,
    Activity,
    Target,
    ListChecks,
    MessageCircle,
    Clock,
    Zap,
    CreditCard,
    UserCheck,
    AlertTriangle,
    ShieldCheck,
    Star,
    ArrowUpCircle,
    ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { Spinner } from '@/components/common/Spinner';
import { SmartPhoneInput } from '@/components/common/SmartPhoneInput';
import { useToast, Modal, ConfirmDialog, Button, Badge, SelectPais, Input } from '@/components/common';
import { CreateStoreModal } from '@/components/layout/CreateStoreModal';
import type { Tienda } from '@/types/store.types';
import { cargarPaises, Pais } from '@/services/paisesService';
import { configService, GlobalConfig } from '@/services/configService';
import { paymentService } from '@/services/paymentService';
import { differenceInDays, parseISO } from 'date-fns';
import { storageService } from '@/services/storageService';

type TabType = 'perfil' | 'membresia' | 'seguridad' | 'notificaciones' | 'sesiones' | 'tiendas';

export function ConfiguracionPage() {
    const {
        user,
        updatePassword,
        updateEmail,
        requestEmailChange,
        verifyEmailChange,
        updateProfile,
        request2FA,
        confirm2FA,
        disable2FA
    } = useAuthStore();
    const navigate = useNavigate();
    const {
        tiendas,
        isLoading: storesLoading,
        fetchTiendas,
        crearTienda,
        actualizarTienda,
        eliminarTienda
    } = useStoreStore();

    const toast = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('perfil');

    // Email
    const [emailData, setEmailData] = useState({
        newEmail: '',
    });
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

    // Perfil
    const [profileData, setProfileData] = useState({
        nombres: user?.nombres || '',
        apellidos: user?.apellidos || '',
        telefono: user?.telefono || '',
        pais: user?.pais || '',
        codigoReferido: user?.codigoReferido || '',
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
            // Reset input
            e.target.value = '';
        }
    };

    // Al cargar el componente o cambiar el usuario, actualizar datos locales
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
    }, [user]);

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

    // Seguridad - Contraseña
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [suggestedPassword, setSuggestedPassword] = useState('');

    const generatePassword = () => {
        const length = 14;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        // Asegurar que cumpla con los requisitos (al menos uno de cada)
        if (!(/[A-Z]/.test(retVal) && /[a-z]/.test(retVal) && /[0-9]/.test(retVal) && /[^A-Za-z0-9]/.test(retVal))) {
            return generatePassword();
        }
        setSuggestedPassword(retVal);
    };

    const useSuggested = () => {
        setPasswordData(prev => ({ ...prev, new: suggestedPassword, confirm: suggestedPassword }));
        setSuggestedPassword('');
    };

    function getPasswordStrength(pwd: string): { level: number; label: string; color: string } {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { level: score, label: 'Débil', color: '#EF4444' };
        if (score <= 3) return { level: score, label: 'Regular', color: '#F59E0B' };
        if (score <= 4) return { level: score, label: 'Fuerte', color: '#10B981' };
        return { level: score, label: 'Muy fuerte', color: '#059669' };
    }

    const strength = getPasswordStrength(passwordData.new);

    // 2FA Flow
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);
    const [showActivationConfirm, setShowActivationConfirm] = useState(false);
    const [showDeactivationConfirm, setShowDeactivationConfirm] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Email Change Flow
    const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
    const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);
    const [isVerifyingEmailChange, setIsVerifyingEmailChange] = useState(false);

    useEffect(() => {
        setIs2FAEnabled(user?.twoFactorEnabled || false);
    }, [user?.twoFactorEnabled]);

    // Tiendas state
    const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
    const [editingTienda, setEditingTienda] = useState<Tienda | null>(null);
    const [deleteTiendaConfirm, setDeleteTiendaConfirm] = useState<string | null>(null);
    const [storeToDeleteData, setStoreToDeleteData] = useState<{ hasData: boolean; costeoCount: number } | null>(null);

    // Notificaciones state
    const [notifPreferences, setNotifPreferences] = useState({
        referrals: true,
        security: true,
        plan: true,
        marketing: false,
        app_notifs: true
    });
    const [isSavingNotifs, setIsSavingNotifs] = useState(false);


    // Fetch stores on mount/tab change
    useEffect(() => {
        fetchTiendas();
    }, [fetchTiendas]);

    const handleConfirmDeleteTienda = (id: string) => {
        // Check for associated data in localStorage (dropcost_costeos)
        const allCosteos = JSON.parse(localStorage.getItem('dropcost_costeos') || '[]');
        const storeCosteos = allCosteos.filter((c: any) => c.storeId === id);

        if (storeCosteos.length > 0) {
            setStoreToDeleteData({ hasData: true, costeoCount: storeCosteos.length });
        } else {
            setStoreToDeleteData({ hasData: false, costeoCount: 0 });
        }

        setDeleteTiendaConfirm(id);
    };

    const [allCountries, setAllCountries] = useState<Pais[]>([]);

    useEffect(() => {
        cargarPaises().then(setAllCountries);
    }, []);

    // Global Config for Support
    const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);

    useEffect(() => {
        configService.getConfig().then(setGlobalConfig);
    }, []);


    const [isRenewing, setIsRenewing] = useState(false);

    const handleRenew = async () => {
        if (!user?.planId) return;
        setIsRenewing(true);
        try {
            // Se asume pago mensual para renovación rápida
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

    const executeDeleteTienda = async () => {
        if (!deleteTiendaConfirm) return;

        const success = await eliminarTienda(deleteTiendaConfirm);
        if (success) {
            toast.success('Tienda eliminada', 'La tienda ha sido borrada exitosamente.');
        } else {
            toast.error('Error al eliminar', 'No se pudo eliminar la tienda en este momento.');
        }
        setDeleteTiendaConfirm(null);
    };

    // Sesiones (Single Session Enforced logic handled by hooks)

    const handleToggle2FA = async () => {
        if (!is2FAEnabled) {
            setShowActivationConfirm(true);
        } else {
            setShowDeactivationConfirm(true);
        }
    };

    const executeDisable2FA = async () => {
        const success = await disable2FA();
        if (success) {
            toast.info('Seguridad Actualizada', 'La autenticación de dos factores ha sido desactivada.');
            setShowDeactivationConfirm(false);
        } else {
            toast.error('Error', 'No se pudo desactivar el 2FA. Reintenta luego.');
        }
    };

    const requestActivation = async () => {
        const result = await request2FA();

        if (result.success) {
            setShowActivationConfirm(false);
            setOtpCode('');
            setShowOTPModal(true);
            toast.success("Código enviado a tu correo");
        } else {
            toast.error(result.error || "No pudimos enviar el código de verificación.");
        }
    };

    const handleOpenCreateStore = () => {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const storeLimit = user?.plan?.limits?.stores ?? 0;

        if (!isAdmin && tiendas.length >= storeLimit) {
            toast.warning(
                'Límite alcanzado',
                `Tu plan actual permite un máximo de ${storeLimit} ${storeLimit === 1 ? 'tienda' : 'tiendas'}. Mejora tu plan para agregar más.`
            );
            return;
        }
        setIsCreateStoreOpen(true);
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length < 6) return;

        setIsVerifying(true);
        const success = await confirm2FA(otpCode);
        setIsVerifying(false);

        if (success) {
            setShowOTPModal(false);
            setOtpCode('');
            toast.success('2FA Activado', 'Tu cuenta ahora está protegida con autenticación de dos factores.');
        } else {
            const errorMsg = useAuthStore.getState().error || 'Código Inválido';
            toast.error('Error al verificar', errorMsg);
        }
    };


    const handleUpdateEmail = async () => {
        // console.log('[ConfiguracionPage] Click en Solicitar Cambio de Email. Nuevo:', emailData.newEmail);

        if (!emailData.newEmail || !emailData.newEmail.includes('@')) {
            toast.warning('Email inválido', 'Por favor ingresa un correo electrónico válido.');
            return;
        }
        if (emailData.newEmail === user?.email) {
            toast.warning('Email idéntico', 'El nuevo email debe ser diferente al actual.');
            return;
        }

        setIsRequestingEmailChange(true);
        // console.log('[ConfiguracionPage] Llamando a requestEmailChange desde el store...');
        const result = await requestEmailChange(emailData.newEmail);
        setIsRequestingEmailChange(false);

        // console.log('[ConfiguracionPage] Resultado de requestEmailChange:', result);

        if (result.success) {
            setOtpCode('');
            setShowEmailOTPModal(true);
            toast.success('Código enviado', `Hemos enviado un código de verificación a ${emailData.newEmail}`);
        } else {
            toast.error('Error', result.error || 'No pudimos procesar la solicitud de cambio de email.');
        }
    };

    const handleVerifyEmailChange = async () => {
        if (otpCode.length < 6) return;

        setIsVerifyingEmailChange(true);
        const success = await verifyEmailChange(otpCode);
        setIsVerifyingEmailChange(false);

        if (success) {
            setShowEmailOTPModal(false);
            setOtpCode('');
            setEmailData({ newEmail: '' });
            toast.success('Email actualizado', 'Tu correo ha sido cambiado correctamente.');
        } else {
            const errorMsg = useAuthStore.getState().error || 'Código incorrecto o expirado';
            toast.error('Error de verificación', errorMsg);
        }
    };

    const handleUpdatePassword = async () => {
        if (passwordData.new !== passwordData.confirm) {
            toast.warning('Discrepancia de contraseñas', 'La confirmación no coincide con la nueva contraseña.');
            return;
        }
        setIsUpdatingPassword(true);
        const success = await updatePassword(passwordData.new);
        setIsUpdatingPassword(false);
        if (success) {
            setPasswordData({ current: '', new: '', confirm: '' });
            toast.success('Seguridad reforzada', 'Tu contraseña ha sido actualizada con éxito.');
        } else {
            toast.error('Error de sistema', 'Hubo un problema al intentar cambiar tu contraseña.');
        }
    };



    const suggestedSlug = `${profileData.nombres}${profileData.apellidos}`.toLowerCase().replace(/\s/g, '');

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px' }}>
                Configuración y Seguridad
            </h1>

            {/* Navegación por Pestañas */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '32px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '2px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
            }} className="no-scrollbar">
                <TabButton
                    active={activeTab === 'perfil'}
                    onClick={() => setActiveTab('perfil')}
                    icon={<User size={18} />}
                    label="Mi Perfil"
                />
                <TabButton
                    active={activeTab === 'seguridad'}
                    onClick={() => setActiveTab('seguridad')}
                    icon={<Shield size={18} />}
                    label="Seguridad"
                />
                <TabButton
                    active={activeTab === 'sesiones'}
                    onClick={() => setActiveTab('sesiones')}
                    icon={<Monitor size={18} />}
                    label="Sesiones"
                />
                <TabButton
                    active={activeTab === 'membresia'}
                    onClick={() => setActiveTab('membresia')}
                    icon={<Zap size={18} />}
                    label="Membresía"
                />
                <TabButton
                    active={activeTab === 'tiendas'}
                    onClick={() => setActiveTab('tiendas')}
                    icon={<Store size={18} />}
                    label="Mis Tiendas"
                />
                <TabButton
                    active={activeTab === 'notificaciones'}
                    onClick={() => setActiveTab('notificaciones')}
                    icon={<Settings2 size={18} />}
                    label="Notificaciones"
                />
            </div>

            {/* Contenido de Mi Perfil */}
            {activeTab === 'perfil' && (
                <div style={{ gap: '32px', animation: 'fadeIn 0.3s' }} className="dc-config-grid">
                    <Card>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 24px' }}>Información Personal</h3>
                        <div style={{ gap: '20px', marginBottom: '20px' }} className="dc-config-inner-grid">
                            <Input
                                label="Nombres"
                                value={profileData.nombres}
                                onChange={e => setProfileData({ ...profileData, nombres: e.target.value })}
                            />
                            <Input
                                label="Apellidos"
                                value={profileData.apellidos}
                                onChange={e => setProfileData({ ...profileData, apellidos: e.target.value })}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <SmartPhoneInput
                                label="Teléfono Móvil"
                                value={profileData.telefono}
                                onChange={(fullValue, iso) => {
                                    setProfileData({ ...profileData, telefono: fullValue, pais: iso });
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <SelectPais
                                label="País de Residencia"
                                value={profileData.pais}
                                onChange={(iso) => setProfileData({ ...profileData, pais: iso })}
                                showMoneda={false}
                                disabled={!!user?.pais}
                                helperText={user?.pais ? "El país no se puede cambiar después del registro por motivos de facturación." : undefined}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <Input
                                label="Código de Referido Personal"
                                leftIcon={<Share2 size={16} />}
                                placeholder={`Ej: ${suggestedSlug}`}
                                value={profileData.codigoReferido}
                                onChange={e => setProfileData({ ...profileData, codigoReferido: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                helperText={`Este será tu link: ${window.location.origin}/registro?ref=${profileData.codigoReferido || suggestedSlug}`}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <button
                                className="dc-button-primary"
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                style={{ gap: '8px' }}
                            >
                                {isSavingProfile ? <Spinner size="sm" /> : <Save size={16} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </Card>

                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Card>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                marginBottom: '16px'
                            }}>
                                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                                        color: 'var(--color-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '32px', fontWeight: 800,
                                        border: '2px solid var(--color-primary-light)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {user?.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt="Avatar"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <>{user?.nombres[0]}{user?.apellidos[0]}</>
                                        )}
                                        {isUploadingAvatar && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                backgroundColor: 'rgba(0,0,0,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 10
                                            }}>
                                                <Spinner size="sm" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                        disabled={isUploadingAvatar}
                                        style={{
                                            position: 'absolute', bottom: '0', right: '0',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary)', color: '#fff',
                                            border: '2px solid var(--card-bg)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            transition: 'transform 0.2s',
                                            zIndex: 5,
                                            opacity: isUploadingAvatar ? 0.7 : 1
                                        }}
                                        onMouseEnter={(e) => !isUploadingAvatar && (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={(e) => !isUploadingAvatar && (e.currentTarget.style.transform = 'scale(1)')}
                                        title="Cambiar imagen"
                                    >
                                        {isUploadingAvatar ? <Spinner size="sm" /> : <Camera size={16} />}
                                    </button>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleAvatarUpload}
                                    />
                                </div>
                                <h4 style={{ margin: 0, fontWeight: 700 }}>{user?.nombres} {user?.apellidos}</h4>
                                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email}</p>

                                <div style={{
                                    display: 'inline-flex',
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '20px',
                                    alignItems: 'center', gap: '6px',
                                }}>
                                    <CheckCircle2 size={14} color="#10B981" />
                                    <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>Cuenta Verificada</span>
                                </div>
                            </div>
                        </Card>
                    </aside>
                </div>
            )}

            {/* Contenido de Membresía */}
            {activeTab === 'membresia' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }} className="dc-config-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {user?.estadoSuscripcion === 'activa' && (
                                <Card>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '56px', height: '56px', borderRadius: '16px',
                                                backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--color-primary)'
                                            }}>
                                                <Zap size={28} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                                                    {user?.plan?.name?.toLowerCase().includes('suscripción')
                                                        ? user.plan.name
                                                        : `Plan ${user?.plan?.name || 'Starter'}`}
                                                </h3>
                                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                                                    Estado: <Badge variant={user?.estadoSuscripcion === 'activa' ? 'success' : 'warning'}>
                                                        {user?.estadoSuscripcion?.toUpperCase() || 'ACTIVA'}
                                                    </Badge>
                                                </p>
                                            </div>
                                        </div>
                                        {user?.planId !== 'plan_enterprise' && (
                                            <Button
                                                variant="primary"
                                                onClick={() => navigate('/pricing')}
                                                style={{ gap: '8px' }}
                                            >
                                                <ArrowUpCircle size={18} />
                                                Mejorar Plan
                                            </Button>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}> BENEFICIOS DE TU PLAN</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <FeatureItem label={`Máximo ${user?.plan?.limits?.stores} tiendas`} active />
                                            <FeatureItem label={`${user?.plan?.limits?.costeos_limit || 'Ilimitados'} costeos`} active />
                                            <FeatureItem label={`${user?.plan?.limits?.offers_limit || 'Ilimitadas'} ofertas sugeridas`} active />
                                            <FeatureItem label="Soporte Prioritario" active={user?.planId !== 'plan_free'} />
                                            <FeatureItem label="Acceso a Billetera" active={user?.plan?.limits?.access_wallet} />
                                            <FeatureItem label="Sistema de Referidos" active={user?.plan?.limits?.access_referrals} />
                                            <FeatureItem label="Duplicado de Costeos" active={user?.plan?.limits?.can_duplicate_costeos} />
                                            <FeatureItem label="Duplicado de Ofertas" active={!!user?.plan?.limits?.can_duplicate_offers} />
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {user?.estadoSuscripcion === 'activa' ? (
                                <Card>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <Clock size={20} color="var(--text-secondary)" />
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>Vencimiento de Suscripción</h4>
                                    </div>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
                                        Tu suscripción no tiene cobros automáticos. Para mantener tus beneficios activos sin interrupciones, debes realizar el pago manualmente antes del <strong>{user?.fechaVencimiento ? new Date(user.fechaVencimiento).toLocaleDateString() : 'Próximamente'}.</strong> Contamos con un periodo de gracia de 3 días antes de la suspensión automática.
                                    </p>

                                    {(() => {
                                        const daysRemaining = user?.fechaVencimiento
                                            ? differenceInDays(parseISO(user.fechaVencimiento), new Date())
                                            : 99;

                                        if (daysRemaining <= 3) {
                                            return (
                                                <Button
                                                    variant="primary"
                                                    fullWidth
                                                    onClick={handleRenew}
                                                    isLoading={isRenewing}
                                                    style={{ gap: '8px', justifyContent: 'center' }}
                                                >
                                                    <CreditCard size={18} />
                                                    Renovar o Pagar Ahora
                                                </Button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </Card>
                            ) : (
                                <Card style={{
                                    border: '1px dashed var(--color-primary)',
                                    backgroundColor: 'rgba(0, 102, 255, 0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px 24px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '50%',
                                        backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--color-primary)', marginBottom: '20px'
                                    }}>
                                        <CreditCard size={32} />
                                    </div>
                                    <h4 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>¡Activa tu Plan Starter hoy!</h4>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px', maxWidth: '300px', lineHeight: 1.5 }}>
                                        Para comenzar a utilizar todas las herramientas de DropCost Master, necesitas una suscripción activa.
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={() => navigate('/pricing')}
                                        style={{ gap: '10px', padding: '12px 32px' }}
                                    >
                                        Ver Planes Disponibles
                                        <ArrowRight size={18} />
                                    </Button>
                                </Card>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <Card>
                                <h4 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '15px' }}>¿Necesitas ayuda?</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: '20px' }}>
                                    Si tienes dudas sobre tu facturación o necesitas un plan personalizado para tu cuenta, nuestro equipo está listo para ayudarte por estos medios:
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => window.open(`https://wa.me/${globalConfig?.telefono?.replace(/[^0-9]/g, '')}`, '_blank')}
                                        style={{ gap: '8px', justifyContent: 'center' }}
                                    >
                                        <MessageCircle size={18} />
                                        WhatsApp Soporte
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        fullWidth
                                        onClick={() => window.open(`mailto:${globalConfig?.email_contacto}`, '_blank')}
                                        style={{ gap: '8px', justifyContent: 'center', border: '1px solid var(--border-color)' }}
                                    >
                                        <Mail size={18} />
                                        Enviar Correo
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido de Seguridad */}
            {activeTab === 'seguridad' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', animation: 'fadeIn 0.3s' }}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(0, 102, 255, 0.1)', borderRadius: '10px', color: 'var(--color-primary)' }}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Correo Electrónico</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Gestiona tu dirección de contacto</p>
                            </div>
                        </div>
                        <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Actual</label>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {user?.email}
                                <CheckCircle2 size={14} color="#10B981" />
                            </div>
                        </div>
                        <Input
                            label="Nuevo Correo Electrónico"
                            leftIcon={<RefreshCw size={16} />}
                            placeholder="nuevo@ejemplo.com"
                            value={emailData.newEmail}
                            onChange={e => setEmailData({ ...emailData, newEmail: e.target.value })}
                        />
                        <button
                            className="dc-button-primary"
                            style={{ marginTop: '24px', width: '100%', gap: '8px', justifyContent: 'center' }}
                            onClick={handleUpdateEmail}
                            disabled={isRequestingEmailChange || !emailData.newEmail}
                        >
                            {isRequestingEmailChange ? <Spinner size="sm" /> : <Save size={16} />}
                            Solicitar Cambio de Email
                        </button>
                    </Card>

                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: 'var(--color-error)' }}>
                                <Key size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Cambiar Contraseña</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Mejora la seguridad de tu acceso</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Input
                                label="Contraseña Actual"
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={passwordData.current}
                                onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                showPasswordToggle
                            />
                            <Input
                                label="Nueva Contraseña"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                                value={passwordData.new}
                                onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                showPasswordToggle
                                onFocus={() => !passwordData.new && !suggestedPassword && generatePassword()}
                                onBlur={() => setTimeout(() => setSuggestedPassword(''), 200)}
                            />
                            <Input
                                label="Confirmar Nueva Contraseña"
                                type="password"
                                placeholder="Repite la nueva contraseña"
                                autoComplete="new-password"
                                value={passwordData.confirm}
                                onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                showPasswordToggle
                            />
                        </div>
                        <button
                            className="dc-button-primary"
                            style={{ marginTop: '32px', width: '100%', gap: '8px', justifyContent: 'center' }}
                            onClick={handleUpdatePassword}
                            disabled={isUpdatingPassword || !passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                        >
                            {isUpdatingPassword ? <Spinner size="sm" /> : <Save size={16} />}
                            Actualizar Contraseña
                        </button>
                    </Card>

                    <Card style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    backgroundColor: is2FAEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: is2FAEnabled ? '#10B981' : '#6B7280'
                                }}>
                                    <Smartphone size={24} />
                                </div>
                                <div style={{ maxWidth: '600px' }}>
                                    <h4 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '16px' }}>Autenticación de Dos Factores (2FA)</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                                        Recomendado para máxima seguridad. Cada inicio de sesión requerirá un código enviado a tu email.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: is2FAEnabled ? 'var(--color-success)' : 'var(--text-tertiary)' }}>
                                    {is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                                <Toggle checked={is2FAEnabled} onChange={handleToggle2FA} />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'sesiones' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <Card>
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                                backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Shield size={32} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>Sesión Segura Activa</h3>
                            <p style={{ maxWidth: '480px', margin: '0 auto 24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Tu cuenta utiliza <strong>Session Guard</strong>. Por seguridad, si inicias sesión en un nuevo dispositivo, cualquier sesión anterior se cerrará automáticamente.
                            </p>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '10px',
                                padding: '12px 20px', borderRadius: '12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                                fontSize: '14px', fontWeight: 600
                            }}>
                                <CheckCircle2 size={18} />
                                Dispositivo Actual Verificado
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'tiendas' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    {user?.estadoSuscripcion === 'activa' ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Gestión de Tiendas</h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                        Administra tus puntos de venta y sus integraciones
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button className="dc-button-primary" onClick={handleOpenCreateStore} style={{ gap: '8px' }}>
                                        <Plus size={16} />
                                        Nueva Tienda
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {tiendas.map((tienda) => (
                                    <Card key={tienda.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {tienda.logo_url ? <img src={tienda.logo_url} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={24} style={{ color: 'var(--color-primary)' }} />}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{tienda.nombre}</h4>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                        {(() => {
                                                            const pais = allCountries.find(p => p.codigo_iso_2 === tienda.pais);
                                                            if (pais) {
                                                                return (
                                                                    <img
                                                                        src={`https://flagcdn.com/w20/${pais.codigo_iso_2.toLowerCase()}.png`}
                                                                        width="16"
                                                                        height="12"
                                                                        style={{ borderRadius: '2px', objectFit: 'cover' }}
                                                                        alt={pais.nombre_es}
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{tienda.moneda}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="action-icon-btn" onClick={() => setEditingTienda(tienda)}><Pencil size={14} /></button>
                                                {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_stores) && (
                                                    <button className="action-icon-btn danger" onClick={() => handleConfirmDeleteTienda(tienda.id)}><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </div>
                                        <Button variant="secondary" fullWidth size="sm" onClick={() => navigate('/mis-costeos')}>Gestionar</Button>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0, 102, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 20px' }}>
                                <CreditCard size={32} />
                            </div>
                            <h4 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '20px' }}>Activa tu plan</h4>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Necesitas una suscripción activa para gestionar tiendas.</p>
                            <Button variant="primary" onClick={() => navigate('/pricing')}>Ver Planes</Button>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'notificaciones' && (
                <div style={{ maxWidth: '800px', animation: 'fadeIn 0.3s' }}>
                    <Card>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Notificaciones</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Elige cómo quieres recibir las actualizaciones.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <NotificationItem
                                icon={<Share2 size={18} />}
                                title="Referidos"
                                description="Avisos de nuevos registros y comisiones."
                                checked={notifPreferences.referrals}
                                onChange={() => setNotifPreferences({ ...notifPreferences, referrals: !notifPreferences.referrals })}
                            />
                            <NotificationItem
                                icon={<Shield size={18} />}
                                title="Seguridad"
                                description="Alertas críticas de tu cuenta."
                                checked={notifPreferences.security}
                                onChange={() => setNotifPreferences({ ...notifPreferences, security: !notifPreferences.security })}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '24px' }}>
                            <button className="dc-button-primary" onClick={() => toast.success('Preferencias guardadas')}>Guardar</button>
                        </div>
                    </Card>
                </div>
            )}


            {/* Modales de Tiendas */}
            <CreateStoreModal
                isOpen={isCreateStoreOpen}
                onClose={() => setIsCreateStoreOpen(false)}
            />

            <ConfirmDialog
                isOpen={!!deleteTiendaConfirm}
                title={storeToDeleteData?.hasData ? 'No se puede eliminar' : 'Eliminar Tienda'}
                description={
                    storeToDeleteData?.hasData
                        ? `Esta tienda tiene ${storeToDeleteData.costeoCount} costeos vinculados. Debes eliminarlos o moverlos antes de poder borrar la tienda por seguridad.`
                        : '¿Estás seguro de eliminar esta tienda? Esta acción no se puede deshacer y perderás el acceso a sus configuraciones.'
                }
                confirmLabel={storeToDeleteData?.hasData ? 'Entendido / Ver Costeos' : 'Sí, eliminar'}
                cancelLabel="Cancelar"
                variant={storeToDeleteData?.hasData ? 'info' : 'danger'}
                onConfirm={() => {
                    if (storeToDeleteData?.hasData) {
                        setDeleteTiendaConfirm(null);
                        navigate('/mis-costeos');
                    } else {
                        executeDeleteTienda();
                    }
                }}
                onCancel={() => setDeleteTiendaConfirm(null)}
            />

            {/* Modal Editar Tienda (Simplificado para este ejemplo) */}
            <Modal
                isOpen={!!editingTienda}
                onClose={() => setEditingTienda(null)}
                title="Editar Tienda"
                size="sm"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '16px',
                            backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', border: '2px dashed var(--border-color)'
                        }}>
                            {editingTienda?.logo_url ? (
                                <img src={editingTienda.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Building2 size={32} style={{ color: 'var(--color-primary)' }} />
                            )}
                        </div>
                    </div>

                    <Input
                        label="Nombre de la Tienda"
                        value={editingTienda?.nombre || ''}
                        onChange={(e) => setEditingTienda(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                    />

                    <Input
                        label="URL del Logo (Opcional)"
                        placeholder="https://ejemplo.com/logo.png"
                        value={editingTienda?.logo_url || ''}
                        onChange={(e) => setEditingTienda(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                        helperText="Pega la URL de una imagen para usarla como logo de tu tienda."
                    />

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <Button variant="secondary" fullWidth onClick={() => setEditingTienda(null)}>Cancelar</Button>
                        <Button variant="primary" fullWidth onClick={async () => {
                            if (editingTienda) {
                                await actualizarTienda(editingTienda.id, {
                                    nombre: editingTienda.nombre,
                                    logo_url: editingTienda.logo_url
                                });
                                setEditingTienda(null);
                                toast.success('Tienda actualizada');
                            }
                        }}>Guardar Cambios</Button>
                    </div>
                </div>
            </Modal>

            {/* Modales de 2FA */}
            <ConfirmDialog
                isOpen={showActivationConfirm}
                title="¿Activar 2FA?"
                description="Para activar la seguridad de dos factores, te enviaremos un código de confirmación a tu correo electrónico."
                confirmLabel="Enviar Código"
                cancelLabel="Ahora no"
                variant="info"
                onConfirm={requestActivation}
                onCancel={() => setShowActivationConfirm(false)}
            />

            <ConfirmDialog
                isOpen={showDeactivationConfirm}
                title="¿Desactivar 2FA?"
                description="Al desactivar el 2FA, tu cuenta será menos segura. ¿Estás seguro de que deseas continuar?"
                confirmLabel="Desactivar Seguridad"
                cancelLabel="Mantener Protegida"
                variant="danger"
                onConfirm={executeDisable2FA}
                onCancel={() => setShowDeactivationConfirm(false)}
            />

            <Modal
                isOpen={showOTPModal}
                onClose={() => setShowOTPModal(false)}
                title="Verifica tu Identidad"
                size="sm"
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <Mail size={32} />
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Hemos enviado un código de 6 dígitos a su correo. Por favor, ingréselo a continuación para activar el 2FA.
                    </p>
                    <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{
                            width: '100%',
                            fontSize: '24px',
                            fontWeight: 700,
                            letterSpacing: '8px',
                            textAlign: 'center',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '2px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            marginBottom: '24px'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setShowOTPModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleVerifyOTP}
                            isLoading={isVerifying}
                            disabled={otpCode.length < 6}
                        >
                            Verificar y Activar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal OTP para Cambio de Email */}
            <Modal
                isOpen={showEmailOTPModal}
                onClose={() => setShowEmailOTPModal(false)}
                title="Confirmar Nuevo Correo"
                size="sm"
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <RefreshCw size={32} />
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Ingresa el código enviado a <strong>{emailData.newEmail}</strong> para completar el cambio.
                    </p>
                    <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        style={{
                            width: '100%',
                            fontSize: '24px',
                            fontWeight: 700,
                            letterSpacing: '8px',
                            textAlign: 'center',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '2px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            marginBottom: '24px'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setShowEmailOTPModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleVerifyEmailChange}
                            isLoading={isVerifyingEmailChange}
                            disabled={otpCode.length < 6}
                        >
                            Confirmar Cambio
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .dc-input {
                    padding: 10px 14px;
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    font-size: 14px;
                    width: 100%;
                    background-color: var(--bg-primary);
                    color: var(--text-primary);
                    outline: none;
                    transition: all 0.2s;
                }
                .dc-input:focus {
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
                }
                .dc-button-primary {
                    background-color: var(--color-primary);
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    fontWeight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: opacity 0.2s;
                }
                .dc-button-primary:hover { opacity: 0.9; }
                .dc-button-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .action-icon-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--card-bg);
                    color: var(--text-tertiary);
                    cursor: pointer;
                    transition: all 150ms;
                }
                .action-icon-btn:hover {
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                    background: rgba(var(--color-primary-rgb), 0.05);
                }
                .action-icon-btn.danger:hover {
                    color: var(--color-error);
                    border-color: var(--color-error);
                    background: rgba(var(--color-error-rgb), 0.1);
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div >
    );
}


function Card({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            ...style
        }}>
            {children}
        </div>
    );
}

function NotificationItem({ icon, title, description, checked, onChange }: {
    icon: React.ReactNode,
    title: string,
    description: string,
    checked: boolean,
    onChange: () => void
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            marginBottom: '8px'
        }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-primary)'
                }}>
                    {icon}
                </div>
                <div>
                    <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700 }}>{title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{description}</p>
                </div>
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

function FeatureItem({ label, active }: { label: string; active?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: active ? '#10B981' : '#6B7280'
            }}>
                <CheckCircle2 size={12} />
            </div>
            <span style={{ fontSize: '13px', color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: active ? 500 : 400 }}>
                {label}
            </span>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: active ? 'var(--color-primary)' : 'var(--text-tertiary)',
                fontWeight: active ? 700 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: () => void }) {
    return (
        <div
            onClick={onChange}
            style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: checked ? 'var(--color-primary)' : 'var(--card-border)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            }}
        >
            <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: '3px',
                left: checked ? '23px' : '3px',
                transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </div>
    );
}

/* ─── Styles adicionales ─── */
const responsiveStyles = `
            .dc-config-grid {
                display: grid;
            grid-template-columns: minmax(0, 1fr) 300px;
    }
            .dc-config-inner-grid {
                display: grid;
            grid-template-columns: 1fr 1fr;
    }
            @media (max-width: 900px) {
                .dc-config-grid {
                    grid-template-columns: 1fr;
                }
            }
            @media (max-width: 600px) {
                .dc-config-inner-grid {
                    grid-template-columns: 1fr;
                }
            }
            `;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = responsiveStyles;
    document.head.appendChild(styleSheet);
}
