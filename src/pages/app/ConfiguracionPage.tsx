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
    ArrowRight,
    Facebook,
    Info
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

type TabType = 'perfil' | 'membresia' | 'seguridad' | 'notificaciones' | 'sesiones' | 'tiendas' | 'integraciones';

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
        <div style={{ maxWidth: '1440px', margin: '0 0', padding: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '32px' }}>
                Configuración y Seguridad
            </h1>

            {/* Layout de Configuración con Sidebar */}
            <div className="config-layout">
                <aside className="config-sidebar">
                    <div className="config-nav-group">
                        <h4 className="config-nav-header">General</h4>
                        <TabButton
                            active={activeTab === 'perfil'}
                            onClick={() => setActiveTab('perfil')}
                            icon={<User size={18} />}
                            label="Mi Perfil"
                        />
                        <TabButton
                            active={activeTab === 'notificaciones'}
                            onClick={() => setActiveTab('notificaciones')}
                            icon={<Settings2 size={18} />}
                            label="Notificaciones"
                        />
                        <TabButton
                            active={activeTab === 'membresia'}
                            onClick={() => setActiveTab('membresia')}
                            icon={<Zap size={18} />}
                            label="Membresía"
                        />
                    </div>

                    <div className="config-nav-group">
                        <h4 className="config-nav-header">Seguridad</h4>
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
                    </div>

                    <div className="config-nav-group">
                        <h4 className="config-nav-header">Negocio</h4>
                        <TabButton
                            active={activeTab === 'tiendas'}
                            onClick={() => setActiveTab('tiendas')}
                            icon={<Store size={18} />}
                            label="Mis Tiendas"
                        />
                        <TabButton
                            active={activeTab === 'integraciones'}
                            onClick={() => setActiveTab('integraciones')}
                            icon={<Share2 size={18} />}
                            label="Integraciones Meta"
                        />
                    </div>
                </aside>

                <main className="config-content">
                    {/* Contenido de Mi Perfil */}
                    {activeTab === 'perfil' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.3s' }}>
                            {/* Card principal: Avatar + Formulario lado a lado */}
                            <Card style={{ padding: '32px' }}>
                                <div className="perfil-main-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '48px', alignItems: 'flex-start' }}>
                                    {/* Columna Izquierda: Avatar e identidad */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', paddingRight: '48px', borderRight: '1px solid var(--border-color)' }}>
                                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                            <div style={{
                                                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                                                border: '4px solid rgba(var(--color-primary-rgb), 0.2)',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                                backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {isUploadingAvatar ? <Spinner /> : (
                                                    user?.avatarUrl ?
                                                        <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                                        <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--color-primary)' }}>
                                                            {user?.nombres[0]}{user?.apellidos[0]}
                                                        </div>
                                                )}
                                            </div>
                                            <label style={{
                                                position: 'absolute', bottom: '4px', right: '4px',
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                backgroundColor: 'var(--color-primary)', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', border: '3px solid var(--card-bg)',
                                                transition: 'transform 0.2s',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                            }} className="hover-scale">
                                                <Camera size={18} />
                                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                            </label>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Haz clic en el ícono de cámara para cambiar tu foto</p>
                                        </div>
                                        <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.nombres} {user?.apellidos}</p>
                                            <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>{user?.email}</p>
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
                                    </div>

                                    {/* Columna Derecha: Formulario */}
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <User size={20} color="var(--color-primary)" />
                                            Información Personal
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                                                helperText={user?.pais ? "El país no se puede cambiar después del registro." : undefined}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '24px' }}>
                                            <Input
                                                label="Código de Referido"
                                                value={profileData.codigoReferido ?? user?.codigoReferido ?? ''}
                                                onChange={e => !user?.codigoReferido && setProfileData({ ...profileData, codigoReferido: e.target.value })}
                                                disabled={!!user?.codigoReferido}
                                                placeholder={user?.codigoReferido ? '' : 'Ingresa el código de quien te recomendó'}
                                                helperText={user?.codigoReferido
                                                    ? "El código de referido ya fue registrado y no se puede cambiar."
                                                    : "Opcional. Una vez guardado no podrá modificarse."}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                            <Button
                                                variant="primary"
                                                onClick={handleSaveProfile}
                                                isLoading={isSavingProfile}
                                                style={{ gap: '8px', padding: '12px 28px' }}
                                            >
                                                <Save size={18} />
                                                Guardar Cambios
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}


                    {/* Contenido de Membresía */}
                    {activeTab === 'membresia' && (() => {
                        const daysRemaining = user?.fechaVencimiento
                            ? differenceInDays(parseISO(user.fechaVencimiento), new Date())
                            : 99;
                        const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
                        const isActive = user?.estadoSuscripcion === 'activa';

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s' }}>

                                {/* Card del plan — activo */}
                                {isActive ? (
                                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                                        {/* Header */}
                                        <div style={{
                                            padding: '28px 28px 24px',
                                            background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.08) 0%, rgba(var(--color-primary-rgb), 0.02) 100%)',
                                            borderBottom: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '52px', height: '52px', borderRadius: '14px',
                                                        background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb), 0.7))',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', boxShadow: '0 4px 14px rgba(var(--color-primary-rgb), 0.3)'
                                                    }}>
                                                        <Zap size={24} />
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                                {user?.plan?.name?.toLowerCase().includes('suscripción')
                                                                    ? user.plan.name
                                                                    : `Plan ${user?.plan?.name || 'Starter'}`}
                                                            </h3>
                                                            <Badge variant="success">ACTIVA</Badge>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                                            Vence el{' '}
                                                            <strong style={{ color: isExpiringSoon ? '#F59E0B' : 'var(--text-secondary)' }}>
                                                                {user?.fechaVencimiento
                                                                    ? new Date(user.fechaVencimiento).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                                                                    : 'Indefinido'}
                                                            </strong>
                                                            {isExpiringSoon && (
                                                                <span style={{ marginLeft: '8px', color: '#F59E0B', fontWeight: 700 }}>
                                                                    · {daysRemaining} días restantes
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                {user?.planId !== 'plan_enterprise' && (
                                                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
                                                        <Button
                                                            variant={isExpiringSoon ? 'primary' : 'ghost'}
                                                            onClick={isExpiringSoon ? handleRenew : undefined}
                                                            disabled={!isExpiringSoon}
                                                            isLoading={isRenewing}
                                                            style={{
                                                                gap: '8px',
                                                                border: '1px solid var(--border-color)',
                                                                opacity: isExpiringSoon ? 1 : 0.5,
                                                                cursor: isExpiringSoon ? 'pointer' : 'not-allowed'
                                                            }}
                                                            title={isExpiringSoon ? 'Renueva tu suscripción' : 'Disponible cuando tu suscripción esté próxima a vencer'}
                                                        >
                                                            <CreditCard size={16} />
                                                            Renovar
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => navigate('/pricing')}
                                                            style={{ gap: '8px' }}
                                                        >
                                                            <ArrowUpCircle size={16} />
                                                            Mejorar Plan
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Beneficios */}
                                        <div style={{ padding: '24px 28px' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                                Beneficios incluidos
                                            </p>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                                                <FeatureItem label={`Máximo ${user?.plan?.limits?.stores ?? '—'} tiendas`} active />
                                                <FeatureItem label={`${user?.plan?.limits?.costeos_limit || 'Ilimitados'} costeos`} active />
                                                <FeatureItem label={`${user?.plan?.limits?.offers_limit || 'Ilimitadas'} ofertas sugeridas`} active />
                                                <FeatureItem label="Soporte Prioritario" active={user?.planId !== 'plan_free'} />
                                                <FeatureItem label="Acceso a Billetera" active={user?.plan?.limits?.access_wallet} />
                                                <FeatureItem label="Sistema de Referidos" active={user?.plan?.limits?.access_referrals} />
                                                <FeatureItem label="Duplicado de Costeos" active={user?.plan?.limits?.can_duplicate_costeos} />
                                                <FeatureItem label="Duplicado de Ofertas" active={!!user?.plan?.limits?.can_duplicate_offers} />
                                            </div>
                                        </div>

                                        {/* Alerta de vencimiento próximo */}
                                        {isExpiringSoon && (
                                            <div style={{
                                                padding: '16px 28px',
                                                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                                borderTop: '1px solid rgba(245, 158, 11, 0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <AlertTriangle size={18} color="#F59E0B" />
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#F59E0B', fontWeight: 600 }}>
                                                        Tu suscripción vence pronto. Renueva para mantener el acceso sin interrupciones.
                                                    </p>
                                                </div>
                                                <Button variant="primary" onClick={handleRenew} isLoading={isRenewing} style={{ gap: '8px', flexShrink: 0 }}>
                                                    <CreditCard size={16} />
                                                    Renovar Ahora
                                                </Button>
                                            </div>
                                        )}

                                        {/* Footer de ayuda integrado */}
                                        <div style={{
                                            padding: '20px 28px',
                                            borderTop: '1px solid var(--border-color)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                                            backgroundColor: 'var(--bg-secondary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <MessageCircle size={16} color="var(--text-tertiary)" />
                                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                                    ¿Dudas sobre tu facturación o necesitas un plan personalizado?
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => window.open(`https://wa.me/${globalConfig?.telefono?.replace(/[^0-9]/g, '')}`, '_blank')}
                                                    style={{ gap: '8px' }}
                                                >
                                                    <MessageCircle size={15} />
                                                    WhatsApp
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => window.open(`mailto:${globalConfig?.email_contacto}`, '_blank')}
                                                    style={{ gap: '8px', border: '1px solid var(--border-color)' }}
                                                >
                                                    <Mail size={15} />
                                                    Correo
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    /* Card inactiva */
                                    <Card style={{ padding: 0, overflow: 'hidden' }}>
                                        <div style={{
                                            padding: '40px 28px',
                                            background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.01) 100%)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '50%',
                                                backgroundColor: 'rgba(239,68,68,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#EF4444', margin: '0 auto 20px'
                                            }}>
                                                <AlertCircle size={32} />
                                            </div>
                                            <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)' }}>
                                                Suscripción Inactiva
                                            </h3>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 28px', maxWidth: '360px', lineHeight: 1.6, marginInline: 'auto' }}>
                                                Tu plan no está activo. Reactívalo para continuar usando todas las herramientas de DropCost Master sin interrupciones.
                                            </p>
                                            <Button
                                                variant="primary"
                                                onClick={() => navigate('/pricing')}
                                                style={{ gap: '10px', padding: '13px 36px', margin: '0 auto', display: 'inline-flex' }}
                                            >
                                                <Zap size={18} />
                                                Reactivar Suscripción
                                            </Button>
                                        </div>

                                        {/* Footer de ayuda en estado inactivo también */}
                                        <div style={{
                                            padding: '20px 28px',
                                            borderTop: '1px solid rgba(239,68,68,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                                            backgroundColor: 'var(--bg-secondary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <MessageCircle size={16} color="var(--text-tertiary)" />
                                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                                    ¿Necesitas asistencia para reactivar tu cuenta?
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => window.open(`https://wa.me/${globalConfig?.telefono?.replace(/[^0-9]/g, '')}`, '_blank')}
                                                    style={{ gap: '8px' }}
                                                >
                                                    <MessageCircle size={15} />
                                                    WhatsApp
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => window.open(`mailto:${globalConfig?.email_contacto}`, '_blank')}
                                                    style={{ gap: '8px', border: '1px solid var(--border-color)' }}
                                                >
                                                    <Mail size={15} />
                                                    Correo
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        );
                    })()}


                    {/* Contenido de Seguridad */}
                    {
                        activeTab === 'seguridad' && (
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
                        )
                    }

                    {
                        activeTab === 'sesiones' && (
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
                        )
                    }

                    {
                        activeTab === 'tiendas' && (
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
                                                            {/* Botón editar eliminado por solicitud del usuario para centralizar en Gestionar */}
                                                            {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_stores) && (
                                                                <button className="action-icon-btn danger" onClick={() => handleConfirmDeleteTienda(tienda.id)} title="Eliminar Tienda"><Trash2 size={14} /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        fullWidth
                                                        size="sm"
                                                        onClick={() => navigate(`/configuracion/tiendas/${tienda.id}`)}
                                                    >
                                                        Gestionar Tienda
                                                    </Button>
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
                        )
                    }

                    {
                        activeTab === 'notificaciones' && (
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
                                </Card>
                            </div>
                        )
                    }

                    {
                        activeTab === 'integraciones' && (
                            <div style={{ maxWidth: '800px', animation: 'fadeIn 0.3s' }}>
                                <Card>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            backgroundColor: 'rgba(24, 119, 242, 0.1)', color: '#1877F2',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Facebook size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Meta Ads (Facebook)</h3>
                                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Conecta tu cuenta publicitaria para ver el CPA real</p>
                                        </div>
                                    </div>

                                    <div style={{
                                        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                        borderRadius: '16px', padding: '24px', textAlign: 'center'
                                    }}>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                                            Al conectar tu perfil de Meta, DropCost Master podrá importar automáticamente el rendimiento de tus campañas. Esta conexión es necesaria para que las tiendas vinculadas puedan mostrar métricas avanzadas.
                                        </p>
                                        <Button
                                            variant="primary"
                                            style={{ backgroundColor: '#1877F2', border: 'none', gap: '10px', padding: '12px 24px' }}
                                            onClick={() => toast.info('Facebook Login pronto disponible')}
                                        >
                                            <Facebook size={18} />
                                            Conectar Perfil de Meta
                                        </Button>
                                    </div>

                                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                <strong>Nota:</strong> Esta integración es a nivel de perfil de usuario. Una vez conectada, podrás asignar cuentas publicitarias específicas a cada una de tus tiendas.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )
                    }


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

                </main>
            </div>
        </div>
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
            className={`config-nav-button ${active ? 'active' : ''}`}
        >
            <span className="icon">{icon}</span>
            <span className="label">{label}</span>
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

const responsiveStyles = `
    .config-layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 40px;
        align-items: flex-start;
    }
    .config-sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
        position: sticky;
        top: 24px;
    }
    .config-nav-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .config-nav-header {
        font-size: 11px;
        font-weight: 800;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 0 0 8px 16px;
        opacity: 0.7;
    }
    .config-nav-button {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: none;
        border: none;
        border-radius: 12px;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
        text-align: left;
    }
    .config-nav-button:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
    }
    .config-nav-button.active {
        background-color: rgba(var(--color-primary-rgb), 0.1);
        color: var(--color-primary);
    }
    .config-nav-button .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
    }
    .config-nav-button.active .icon {
        transform: scale(1.1);
    }
    .dc-config-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
    }
    .dc-config-inner-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    .membresia-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 32px;
        align-items: flex-start;
    }
    @media (max-width: 1024px) {
        .config-layout {
            grid-template-columns: 1fr;
            gap: 0;
        }
        .config-sidebar {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 32px;
            position: static;
            gap: 12px;
        }
        .config-nav-group {
            flex-direction: row;
            align-items: center;
            gap: 8px;
        }
        .config-nav-header {
            display: none;
        }
        .config-nav-button {
            width: auto;
            white-space: nowrap;
            padding: 8px 16px;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
        }
        .config-nav-button.active {
            border-color: var(--color-primary);
        }
    }
    @media (max-width: 768px) {
        .dc-config-grid {
            grid-template-columns: 1fr;
        }
        .dc-config-inner-grid {
            grid-template-columns: 1fr;
        }
        .perfil-main-layout {
            grid-template-columns: 1fr !important;
        }
        .perfil-main-layout > div:first-child {
            padding-right: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 24px;
        }
        .membresia-layout {
            grid-template-columns: 1fr !important;
        }
    }
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = responsiveStyles;
    document.head.appendChild(styleSheet);
}
