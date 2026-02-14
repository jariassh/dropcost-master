/**
 * Página de Configuración y Seguridad.
 * Permite editar el perfil, gestionar seguridad (contraseña, 2FA) y sesiones activas.
 */
import React, { useState, useEffect } from 'react';
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
    Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/common/Spinner';
import { SmartPhoneInput } from '@/components/common/SmartPhoneInput';
import { useToast, Modal, ConfirmDialog, Button } from '@/components/common';

type TabType = 'perfil' | 'seguridad' | 'sesiones';

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

    // Sesiones
    const [sessions, setSessions] = useState([
        { id: '1', device: 'Este dispositivo (Chrome / Windows)', ip: '190.158.xx.xx', lastActive: 'Ahora', active: true },
        { id: '2', device: 'Xiaomi Poco X3 (App)', ip: '181.12.xx.xx', lastActive: 'Hace 2 horas', active: false },
        { id: '3', device: 'MacBook Pro (Safari)', ip: '172.67.xx.xx', lastActive: 'Ayer', active: false },
    ]);

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

    const handleRevokeSession = (id: string) => {
        setSessions(sessions.filter(s => s.id !== id));
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
                paddingBottom: '2px'
            }}>
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
            </div>

            {/* Contenido de Mi Perfil */}
            {activeTab === 'perfil' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px', animation: 'fadeIn 0.3s' }}>
                    <Card>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 24px' }}>Información Personal</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

                                    {/* Popover de Sugerencia Flotante (Ahora entre label e input) */}
                                    {suggestedPassword && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 'calc(100% + 4px)',
                                            left: '0',
                                            right: '0',
                                            zIndex: 100,
                                            padding: '14px',
                                            backgroundColor: 'var(--card-bg)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: 'var(--shadow-xl)',
                                            animation: 'scaleIn 200ms ease-out'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <div style={{
                                                    padding: '6px',
                                                    backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    color: 'var(--color-primary)'
                                                }}>
                                                    <Sparkles size={16} />
                                                </div>
                                                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
                                                    ¿Usar contraseña segura?
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <code style={{
                                                    flex: 1,
                                                    padding: '10px 12px',
                                                    backgroundColor: 'var(--bg-primary)',
                                                    borderRadius: '8px',
                                                    fontSize: '15px',
                                                    wordBreak: 'break-all',
                                                    color: 'var(--color-primary)',
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    letterSpacing: '1px',
                                                    border: '1.5px solid rgba(0, 102, 255, 0.3)'
                                                }}>
                                                    {suggestedPassword}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        generatePassword();
                                                    }}
                                                    title="Generar otra"
                                                    style={{
                                                        padding: '10px',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 200ms'
                                                    }}
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="dc-button-primary"
                                                    style={{ flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center' }}
                                                    onClick={useSuggested}
                                                >
                                                    Usar esta
                                                </button>
                                                <button
                                                    className="dc-button-secondary"
                                                    style={{
                                                        flex: 1, padding: '8px', fontSize: '13px', justifyContent: 'center',
                                                        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                                        borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer'
                                                    }}
                                                    onClick={() => setSuggestedPassword('')}
                                                >
                                                    No, gracias
                                                </button>
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
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Dispositivos con Sesión Activa</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                            Estas son las sesiones actuales conectadas a tu cuenta de DropCost. Puedes cerrar cualquiera individualmente.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                            {sessions.map(sess => (
                                <div key={sess.id} style={{
                                    backgroundColor: 'var(--card-bg)',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            backgroundColor: sess.active ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                                            color: sess.active ? 'var(--color-success)' : 'var(--text-tertiary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Monitor size={20} />
                                        </div>
                                        <div>
                                            <h5 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '14px' }}>
                                                {sess.device}
                                                {sess.active && <span style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '10px', backgroundColor: 'var(--color-success)', color: '#fff', borderRadius: '4px' }}>Actual</span>}
                                            </h5>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                <span>{sess.ip}</span>
                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--text-tertiary)' }} />
                                                <span>{sess.lastActive}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {!sess.active && (
                                        <button
                                            onClick={() => handleRevokeSession(sess.id)}
                                            style={{
                                                background: 'none', border: 'none', color: 'var(--color-error)',
                                                cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            <LogOut size={16} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Cerrar Sesión</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <button
                                style={{
                                    background: 'none', border: `1px solid var(--color-error)`, color: 'var(--color-error)',
                                    padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
                                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <Trash2 size={16} />
                                Cerrar todas las demás sesiones
                            </button>
                        </div>
                    </Card>
                </div>
            )}

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
            `}</style>
        </div>
    );
}

// Subcomponentes Internos
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
