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
    ListChecks
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { Spinner } from '@/components/common/Spinner';
import { SmartPhoneInput } from '@/components/common/SmartPhoneInput';
import { useToast, Modal, ConfirmDialog, Button, Badge, SelectPais } from '@/components/common';
import { CreateStoreModal } from '@/components/layout/CreateStoreModal';
import type { Tienda } from '@/types/store.types';
import { cargarPaises, Pais } from '@/services/paisesService';
import {
    Clock,
    Zap,
    CreditCard as CreditCardIcon,
    UserCheck,
    Key as KeyIcon,
    AlertTriangle,
    ShieldCheck,
    Star,
    ArrowUpCircle
} from 'lucide-react';

type TabType = 'perfil' | 'membresia' | 'seguridad' | 'notificaciones' | 'sesiones' | 'tiendas';

export function ConfiguracionPage() {
    const {
        user,
        updatePassword,
        updateEmail,
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
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

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
            const success = await disable2FA();
            if (success) {
                toast.info('Seguridad Actualizada', 'La autenticación de dos factores ha sido desactivada.');
            }
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
        if (!emailData.newEmail || !emailData.newEmail.includes('@')) {
            toast.warning('Email inválido', 'Por favor ingresa un correo electrónico válido.');
            return;
        }
        if (emailData.newEmail === user?.email) {
            toast.warning('Email idéntico', 'El nuevo email debe ser diferente al actual.');
            return;
        }

        setIsUpdatingEmail(true);
        const success = await updateEmail(emailData.newEmail);
        setIsUpdatingEmail(false);

        if (success) {
            setEmailData({ newEmail: '' });
            toast.success('Verificación enviada', 'Hemos enviado un link de confirmación a tu nuevo correo. El cambio se aplicará al confirmar.');
        } else {
            toast.error('Error al actualizar', 'No pudimos procesar la solicitud de cambio de email.');
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
                            <InputGroup label="Nombres">
                                <input
                                    className="dc-input"
                                    value={profileData.nombres}
                                    onChange={e => setProfileData({ ...profileData, nombres: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup label="Apellidos">
                                <input
                                    className="dc-input"
                                    value={profileData.apellidos}
                                    onChange={e => setProfileData({ ...profileData, apellidos: e.target.value })}
                                />
                            </InputGroup>
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
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <InputGroup label="Código de Referido Personal">
                                <div style={{ position: 'relative' }}>
                                    <Share2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        className="dc-input"
                                        style={{ paddingLeft: '36px' }}
                                        placeholder={`Ej: ${suggestedSlug}`}
                                        value={profileData.codigoReferido}
                                        onChange={e => setProfileData({ ...profileData, codigoReferido: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                    />
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '4px 0 0 4px' }}>
                                    Este será tu link: {window.location.origin}/registro?ref={profileData.codigoReferido || suggestedSlug}
                                </p>
                            </InputGroup>
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
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
                                    <div style={{
                                        width: '100%', height: '100%', borderRadius: '50%',
                                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                                        color: 'var(--color-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '32px', fontWeight: 800,
                                        border: '2px solid var(--color-primary-light)',
                                        overflow: 'hidden'
                                    }}>
                                        {user?.nombres[0]}{user?.apellidos[0]}
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                        style={{
                                            position: 'absolute', bottom: '0', right: '0',
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary)', color: '#fff',
                                            border: '2px solid var(--card-bg)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        title="Cambiar imagen"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                toast.info('Subida de imagen', `Has seleccionado ${file.name}. La carga al servidor estará disponible pronto.`);
                                            }
                                        }}
                                    />
                                </div>
                                <h4 style={{ margin: 0, fontWeight: 700 }}>{user?.nombres} {user?.apellidos}</h4>
                                <p style={{ margin: '4px 0 12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>{user?.email}</p>

                                <div style={{
                                    display: 'inline-flex',
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '20px',
                                    alignItems: 'center', gap: '6px',
                                    margin: '0 auto'
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
                                                Plan {user?.plan?.name || 'Básico'}
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
                                            onClick={() => navigate('/precios')}
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
                                        <FeatureItem label="Soporte Prioritario" active={user?.planId !== 'plan_free'} />
                                        <FeatureItem label="Acceso a Billetera" active={user?.plan?.limits?.access_wallet} />
                                        <FeatureItem label="Sistema de Referidos" active={user?.plan?.limits?.access_referrals} />
                                        <FeatureItem label="Duplicado de Costeos" active={user?.plan?.limits?.can_duplicate_costeos} />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <Clock size={20} color="var(--text-secondary)" />
                                    <h4 style={{ margin: 0, fontWeight: 700 }}>Próxima Renovación</h4>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                                    Tu suscripción se renovará automáticamente el <strong>{new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</strong>.
                                    Puedes gestionar tus métodos de pago para evitar interrupciones en el servicio.
                                </p>
                            </Card>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <Card>
                                <h4 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '15px' }}>¿Necesitas ayuda?</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: '20px' }}>
                                    Si tienes dudas sobre tu facturación o necesitas un plan personalizado para tu empresa, nuestro equipo está listo para ayudarte.
                                </p>
                                <Button variant="secondary" fullWidth onClick={() => window.open('https://wa.me/xyz', '_blank')}>
                                    Contactar Soporte
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenido de Seguridad */}
            {activeTab === 'seguridad' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', animation: 'fadeIn 0.3s' }}>
                    {/* Tarjeta de Email */}
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                padding: '10px', backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                borderRadius: '10px', color: 'var(--color-primary)'
                            }}>
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

                        <InputGroup label="Nuevo Correo Electrónico">
                            <div style={{ position: 'relative' }}>
                                <RefreshCw size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="email"
                                    className="dc-input"
                                    style={{ paddingLeft: '36px' }}
                                    placeholder="nuevo@ejemplo.com"
                                    value={emailData.newEmail}
                                    onChange={e => setEmailData({ newEmail: e.target.value })}
                                />
                            </div>
                        </InputGroup>

                        <button
                            className="dc-button-primary"
                            style={{ marginTop: '24px', width: '100%', gap: '8px', justifyContent: 'center' }}
                            onClick={handleUpdateEmail}
                            disabled={isUpdatingEmail}
                        >
                            {isUpdatingEmail ? <Spinner size="sm" /> : <Save size={16} />}
                            Solicitar Cambio de Email
                        </button>
                        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic' }}>
                            * Se enviará un enlace de verificación a la nueva dirección.
                        </p>
                    </Card>

                    {/* Tarjeta de Contraseña */}
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '10px', color: 'var(--color-error)'
                            }}>
                                <Key size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Cambiar Contraseña</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Mejora la seguridad de tu acceso</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <InputGroup label="Contraseña Actual">
                                <input
                                    type="password"
                                    className="dc-input"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={passwordData.current}
                                    onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                />
                            </InputGroup>

                            <InputGroup label="Nueva Contraseña">
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        className="dc-input"
                                        placeholder="Mínimo 8 caracteres"
                                        autoComplete="new-password"
                                        value={passwordData.new}
                                        onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                        onFocus={() => {
                                            if (!passwordData.new && !suggestedPassword) {
                                                generatePassword();
                                            }
                                        }}
                                        onBlur={() => {
                                            // Delay para permitir clics en los botones de la sugerencia
                                            setTimeout(() => setSuggestedPassword(''), 200);
                                        }}
                                    />

                                    {/* Popover de Sugerencia Flotante */}
                                    {suggestedPassword && (
                                        <div
                                            onMouseDown={(e) => e.preventDefault()}
                                            style={{
                                                position: 'absolute',
                                                bottom: 'calc(100% - 10px)',
                                                right: '0',
                                                width: '280px',
                                                zIndex: 100,
                                                padding: '12px',
                                                backgroundColor: 'var(--card-bg)',
                                                borderRadius: '12px',
                                                border: '1.5px solid var(--color-primary-light)',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                                animation: 'scaleIn 200ms ease-out',
                                            }}
                                        >
                                            {/* Triángulo del tooltip */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-6px',
                                                right: '20px',
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: 'var(--card-bg)',
                                                borderRight: '1.5px solid var(--color-primary-light)',
                                                borderBottom: '1.5px solid var(--color-primary-light)',
                                                transform: 'rotate(45deg)',
                                                zIndex: -1
                                            }} />

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <div style={{
                                                    padding: '5px',
                                                    backgroundColor: 'var(--color-primary-light)',
                                                    borderRadius: '6px',
                                                    color: 'var(--color-primary)',
                                                    display: 'flex'
                                                }}>
                                                    <Sparkles size={14} />
                                                </div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                                                    Contraseña Sugerida
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                <code style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    backgroundColor: 'var(--bg-primary)',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    color: 'var(--color-primary)',
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    border: '1px solid var(--border-color)',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {suggestedPassword}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        generatePassword();
                                                    }}
                                                    style={{
                                                        padding: '8px',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        transition: 'all 200ms'
                                                    }}
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <Button size="sm" fullWidth onClick={useSuggested} style={{ height: '32px', fontSize: '12px' }}>
                                                    Usar
                                                </Button>
                                                <Button size="sm" variant="secondary" fullWidth onClick={() => setSuggestedPassword('')} style={{ height: '32px', fontSize: '12px' }}>
                                                    Omitir
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </InputGroup>

                            {passwordData.new.length > 0 && !suggestedPassword && (
                                <div style={{ marginTop: '8px', animation: 'fadeIn 200ms ease-out' }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    height: '6px',
                                                    flex: 1,
                                                    borderRadius: '9999px',
                                                    transition: 'all 300ms ease',
                                                    backgroundColor: i <= strength.level ? strength.color : 'var(--border-color)',
                                                    boxShadow: i <= strength.level ? `0 0 8px ${strength.color}40` : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '12px', color: strength.color, fontWeight: 600, margin: 0 }}>
                                            Seguridad: {strength.label}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <InputGroup label="Confirmar Nueva Contraseña">
                                <input
                                    type="password"
                                    className="dc-input"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    value={passwordData.confirm}
                                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </InputGroup>
                        </div>

                        <button
                            className="dc-button-primary"
                            style={{
                                marginTop: '24px',
                                width: '100%',
                                gap: '8px',
                                justifyContent: 'center'
                            }}
                            onClick={handleUpdatePassword}
                            disabled={isUpdatingPassword}
                        >
                            {isUpdatingPassword ? <Spinner size="sm" /> : <Shield size={16} />}
                            Actualizar Contraseña
                        </button>
                    </Card>

                    {/* 2FA - Full Width en el grid si es necesario */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#10B981'
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
                </div>
            )}

            {/* Contenido de Sesiones */}
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
                                <strong>DropCost Master</strong> utiliza una política de <strong>Sesión Única</strong> para garantizar la máxima seguridad de tu cuenta.
                                <br /><br />
                                Esto significa que al iniciar sesión en un nuevo dispositivo, cualquier sesión anterior se cerrará automáticamente.
                                Tu cuenta está protegida contra el uso compartido no autorizado.
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

            {/* Contenido de Mis Tiendas */}
            {activeTab === 'tiendas' && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Gestión de Tiendas</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Administra tus puntos de venta y sus integraciones
                            </p>
                        </div>
                        <button
                            className="dc-button-primary"
                            onClick={handleOpenCreateStore}
                            style={{ gap: '8px' }}
                        >
                            <Plus size={16} />
                            Nueva Tienda
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {tiendas.map((tienda) => (
                            <Card key={tienda.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '10px',
                                            backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {tienda.logo_url ? (
                                                <img src={tienda.logo_url} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Building2 size={24} style={{ color: 'var(--color-primary)' }} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{tienda.nombre}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <img
                                                    src={`https://flagcdn.com/w40/${tienda.pais.toLowerCase()}.png`}
                                                    alt={tienda.pais}
                                                    style={{ width: '18px', borderRadius: '2px' }}
                                                />
                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                                    {allCountries.find(p => p.codigo_iso_2.toUpperCase() === tienda.pais.toUpperCase())?.nombre_es || tienda.pais}
                                                    <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                                                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{tienda.moneda}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            className="action-icon-btn"
                                            onClick={() => setEditingTienda(tienda)}
                                            title="Editar tienda"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_stores) && (
                                            <button
                                                className="action-icon-btn danger"
                                                onClick={() => handleConfirmDeleteTienda(tienda.id)}
                                                title="Eliminar tienda"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Costeos Guardados</span>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                            {(JSON.parse(localStorage.getItem('dropcost_costeos') || '[]').filter((c: any) => c.storeId === tienda.id)).length}
                                        </span>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        size="sm"
                                        onClick={() => navigate('/simulador')}
                                        style={{ fontSize: '12px', height: '36px' }}
                                    >
                                        <Settings2 size={14} style={{ marginRight: '6px' }} />
                                        Gestionar Integraciones
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {tiendas.length === 0 && !storesLoading && (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 40px',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '24px',
                            border: '1.5px dashed var(--border-color)',
                            marginTop: '20px'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '20px',
                                backgroundColor: 'rgba(0,102,255,0.05)', color: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <Store size={40} />
                            </div>
                            <h4 style={{ margin: '0 0 12px', fontWeight: 800, fontSize: '20px' }}>No tienes tiendas registradas</h4>
                            <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                                Crea tu primera tienda para empezar a costear tus productos y habilitar las integraciones automáticas.
                            </p>
                            <button
                                onClick={handleOpenCreateStore}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 28px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: '#ffffff',
                                    background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 15px -3px rgba(0, 102, 255, 0.3)',
                                    transition: 'all 200ms ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0, 102, 255, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 102, 255, 0.3)';
                                }}
                            >
                                <Plus size={18} />
                                Crear Primera Tienda
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Contenido de Notificaciones */}
            {activeTab === 'notificaciones' && (
                <div style={{ maxWidth: '800px', animation: 'fadeIn 0.3s' }}>
                    <Card>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Preferencias de Notificación</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Elige cómo quieres recibir las actualizaciones del sistema y tu cuenta.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <NotificationItem
                                icon={<Share2 size={18} />}
                                title="Comisiones y Referidos"
                                description="Recibe avisos cuando un nuevo usuario se registre o ganes una comisión."
                                checked={notifPreferences.referrals}
                                onChange={() => setNotifPreferences({ ...notifPreferences, referrals: !notifPreferences.referrals })}
                            />
                            <NotificationItem
                                icon={<Shield size={18} />}
                                title="Seguridad de la Cuenta"
                                description="Alertas sobre inicios de sesión, cambios de contraseña y seguridad (Recomendado)."
                                checked={notifPreferences.security}
                                onChange={() => setNotifPreferences({ ...notifPreferences, security: !notifPreferences.security })}
                            />
                            <NotificationItem
                                icon={<Sparkles size={18} />}
                                title="Suscripción y Planes"
                                description="Avisos sobre la activación, vencimiento y facturación de tus planes Pro/Enterprise."
                                checked={notifPreferences.plan}
                                onChange={() => setNotifPreferences({ ...notifPreferences, plan: !notifPreferences.plan })}
                            />
                            <NotificationItem
                                icon={<Globe size={18} />}
                                title="Novedades y Marketing"
                                description="Entérate antes que nadie de las nuevas funciones y promociones de DropCost."
                                checked={notifPreferences.marketing}
                                onChange={() => setNotifPreferences({ ...notifPreferences, marketing: !notifPreferences.marketing })}
                            />
                            <NotificationItem
                                icon={<Smartphone size={18} />}
                                title="Notificaciones en la App"
                                description="Mostrar el punto rojo y avisos dentro del panel principal de la aplicación."
                                checked={notifPreferences.app_notifs}
                                onChange={() => setNotifPreferences({ ...notifPreferences, app_notifs: !notifPreferences.app_notifs })}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '24px' }}>
                            <button
                                className="dc-button-primary"
                                onClick={() => {
                                    setIsSavingNotifs(true);
                                    setTimeout(() => {
                                        setIsSavingNotifs(false);
                                        toast.success('Preferencias guardadas', 'Tus ajustes de notificaciones han sido actualizados.');
                                    }, 800);
                                }}
                                disabled={isSavingNotifs}
                                style={{ gap: '8px' }}
                            >
                                {isSavingNotifs ? <Spinner size="sm" /> : <Save size={16} />}
                                Guardar Preferencias
                            </button>
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
                        navigate('/simulador/costeos');
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

                    <InputGroup label="Nombre de la Tienda">
                        <input
                            className="dc-input"
                            value={editingTienda?.nombre || ''}
                            onChange={(e) => setEditingTienda(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                        />
                    </InputGroup>

                    <InputGroup label="URL del Logo (Opcional)">
                        <input
                            className="dc-input"
                            placeholder="https://ejemplo.com/logo.png"
                            value={editingTienda?.logo_url || ''}
                            onChange={(e) => setEditingTienda(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Pega la URL de una imagen para usarla como logo de tu tienda.
                        </p>
                    </InputGroup>

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
        </div>
    );
}


function Card({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            {children}
        </div>
    );
}

function InputGroup({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
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
