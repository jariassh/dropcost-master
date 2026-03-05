import React, { useState, useEffect } from 'react';
import { Shield, Mail, Key, Smartphone, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Input, Button, ConfirmDialog, Modal, useToast, PageHeader } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';

export function SeguridadPage() {
    const { user, updatePassword, updateEmail, requestEmailChange, verifyEmailChange, request2FA, confirm2FA, disable2FA } = useAuthStore();
    const toast = useToast();

    const [emailData, setEmailData] = useState({ newEmail: '' });
    const [isRequestingEmailChange, setIsRequestingEmailChange] = useState(false);

    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [suggestedPassword, setSuggestedPassword] = useState('');

    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);
    const [showActivationConfirm, setShowActivationConfirm] = useState(false);
    const [showDeactivationConfirm, setShowDeactivationConfirm] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const [showEmailOTPModal, setShowEmailOTPModal] = useState(false);
    const [isVerifyingEmailChange, setIsVerifyingEmailChange] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setIs2FAEnabled(user?.twoFactorEnabled || false);
    }, [user?.twoFactorEnabled]);

    const handleUpdateEmail = async () => {
        if (!emailData.newEmail || !emailData.newEmail.includes('@')) {
            toast.warning('Email inválido', 'Por favor ingresa un correo electrónico válido.');
            return;
        }
        if (emailData.newEmail === user?.email) {
            toast.warning('Email idéntico', 'El nuevo email debe ser diferente al actual.');
            return;
        }

        setIsRequestingEmailChange(true);
        const result = await requestEmailChange(emailData.newEmail);
        setIsRequestingEmailChange(false);

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

    const generatePassword = () => {
        const length = 14;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        if (!(/[A-Z]/.test(retVal) && /[a-z]/.test(retVal) && /[0-9]/.test(retVal) && /[^A-Za-z0-9]/.test(retVal))) {
            return generatePassword();
        }
        setSuggestedPassword(retVal);
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

    const handleToggle2FA = async () => {
        if (!is2FAEnabled) {
            setShowActivationConfirm(true);
        } else {
            setShowDeactivationConfirm(true);
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

    const executeDisable2FA = async () => {
        const success = await disable2FA();
        if (success) {
            toast.info('Seguridad Actualizada', 'La autenticación de dos factores ha sido desactivada.');
            setShowDeactivationConfirm(false);
        } else {
            toast.error('Error', 'No se pudo desactivar el 2FA. Reintenta luego.');
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.3s', boxSizing: 'border-box' }}>
            <PageHeader
                title="Ajustes de"
                highlight="Seguridad"
                description="Protege tu cuenta con autenticación de dos factores, cambios de contraseña y más."
                icon={Shield}
                isMobile={isMobile}
            />

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px', boxSizing: 'border-box' }}>
                {/* Card 1: Email */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: isMobile ? '24px' : '16px', padding: isMobile ? '24px 16px' : '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isMobile ? '20px' : '32px' }}>
                        <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: '#3B82F6' }}>
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: isMobile ? '18px' : '18px', fontWeight: 600, margin: 0 }}>Correo Electrónico</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Gestiona tu dirección de contacto</p>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: isMobile ? '12px' : '16px', marginBottom: isMobile ? '20px' : '24px', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Actual</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%', overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontSize: isMobile ? '13px' : '15px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all', whiteSpace: 'normal', flex: 1 }}>{user?.email}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', flexShrink: 0 }}>
                                <CheckCircle2 size={14} />
                                {!isMobile && <span style={{ fontSize: '11px', fontWeight: 600 }}>VERIFICADO</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '32px' }}>
                        <Input
                            label="Nuevo Correo Electrónico"
                            leftIcon={<RefreshCw size={16} />}
                            placeholder="nuevo@ejemplo.com"
                            value={emailData.newEmail}
                            onChange={e => setEmailData({ ...emailData, newEmail: e.target.value })}
                        />
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        style={{ marginTop: 'auto', gap: '8px' }}
                        onClick={handleUpdateEmail}
                        disabled={isRequestingEmailChange || !emailData.newEmail}
                        isLoading={isRequestingEmailChange}
                    >
                        <Save size={16} /> Solicitar Cambio de Email
                    </Button>
                </div>

                {/* Card 2: Password */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: isMobile ? '24px' : '16px', padding: isMobile ? '24px 16px' : '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isMobile ? '20px' : '32px' }}>
                        <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: 'var(--color-error)' }}>
                            <Key size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: isMobile ? '18px' : '18px', fontWeight: 600, margin: 0 }}>Cambiar Contraseña</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Mejora la seguridad de tu acceso</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                        <Input
                            label="Contraseña Actual"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            value={passwordData.current}
                            onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                            showPasswordToggle
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                            <Input
                                label="Nueva Contraseña"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                                value={passwordData.new}
                                onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                showPasswordToggle
                            />
                            <Input
                                label="Confirmar Nueva Contraseña"
                                type="password"
                                placeholder="Repite la contraseña"
                                autoComplete="new-password"
                                value={passwordData.confirm}
                                onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                showPasswordToggle
                            />
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        fullWidth
                        style={{ marginTop: 'auto', paddingTop: '12px', paddingBottom: '12px', gap: '8px' }}
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword || !passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                        isLoading={isUpdatingPassword}
                    >
                        <Save size={16} /> Actualizar Contraseña
                    </Button>
                </div>

                {/* Card 3: 2FA Authentication (Hero Card) */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: isMobile ? '24px' : '16px', padding: isMobile ? '24px 16px' : '40px 24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{
                        width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', borderRadius: '50%', marginBottom: isMobile ? '16px' : '20px',
                        backgroundColor: is2FAEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: is2FAEnabled ? '#10B981' : '#6B7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${is2FAEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
                    }}>
                        <Smartphone size={isMobile ? 24 : 32} />
                    </div>
                    <h3 style={{ fontSize: isMobile ? '18px' : '18px', fontWeight: 600, margin: '0 0 12px' }}>Autenticación 2FA</h3>
                    <p style={{ maxWidth: '380px', margin: '0 auto 24px', fontSize: isMobile ? '12px' : '13px', color: 'var(--text-tertiary)', lineHeight: isMobile ? 1.5 : 1.6 }}>
                        Añade una capa de seguridad extra enviando un código de confirmación a tu email en cada inicio de sesión.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 20px', borderRadius: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginTop: 'auto' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: is2FAEnabled ? 'var(--color-success)' : 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                            {is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                        <div
                            onClick={handleToggle2FA}
                            style={{
                                width: '40px', height: '22px', borderRadius: '11px',
                                backgroundColor: is2FAEnabled ? 'var(--color-primary)' : '#94a3b8',
                                position: 'relative', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <div style={{
                                width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
                                position: 'absolute', top: '3px', left: is2FAEnabled ? '21px' : '3px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }} />
                        </div>
                    </div>
                </div>

                {/* Card 4: Session Guard (Hero style) */}
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: isMobile ? '24px' : '16px', padding: isMobile ? '24px 16px' : '40px 24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', borderRadius: '50%', marginBottom: isMobile ? '16px' : '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <Shield size={isMobile ? 24 : 32} />
                    </div>
                    <h3 style={{ fontSize: isMobile ? '18px' : '18px', fontWeight: 600, margin: '0 0 12px' }}>Sesión Segura</h3>
                    <p style={{ maxWidth: '380px', margin: '0 auto 24px', fontSize: isMobile ? '12px' : '13px', color: 'var(--text-tertiary)', lineHeight: isMobile ? 1.5 : 1.6 }}>
                        Tu cuenta utiliza <strong>Session Guard</strong>. Si inicias sesión en otro dispositivo, la sesión anterior se cerrará automáticamente.
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)', marginTop: 'auto' }}>
                        <CheckCircle2 size={14} />
                        VERIFICADO
                    </div>
                </div>

                <ConfirmDialog isOpen={showActivationConfirm} title="¿Activar 2FA?" description="Para activar la seguridad de dos factores, te enviaremos un código de confirmación a tu correo electrónico." confirmLabel="Enviar Código" cancelLabel="Ahora no" variant="info" onConfirm={requestActivation} onCancel={() => setShowActivationConfirm(false)} />
                <ConfirmDialog isOpen={showDeactivationConfirm} title="¿Desactivar 2FA?" description="Al desactivar el 2FA, tu cuenta será menos segura. ¿Estás seguro de que deseas continuar?" confirmLabel="Desactivar Seguridad" cancelLabel="Mantener Protegida" variant="danger" onConfirm={executeDisable2FA} onCancel={() => setShowDeactivationConfirm(false)} />
                <Modal isOpen={showOTPModal} onClose={() => setShowOTPModal(false)} title="Verifica tu Identidad" size="sm">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Mail size={32} />
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Hemos enviado un código de 6 dígitos a su correo. Por favor, ingréselo a continuación para activar el 2FA.</p>
                        <input type="text" placeholder="000000" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', fontSize: '24px', fontWeight: 600, letterSpacing: '8px', textAlign: 'center', padding: '12px', borderRadius: '12px', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '24px' }} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button variant="secondary" fullWidth onClick={() => setShowOTPModal(false)}>Cancelar</Button>
                            <Button variant="primary" fullWidth onClick={handleVerifyOTP} isLoading={isVerifying} disabled={otpCode.length < 6}>Verificar y Activar</Button>
                        </div>
                    </div>
                </Modal>
                <Modal isOpen={showEmailOTPModal} onClose={() => setShowEmailOTPModal(false)} title="Confirmar Nuevo Correo" size="sm">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <RefreshCw size={32} />
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Ingresa el código enviado a <strong>{emailData.newEmail}</strong> para completar el cambio.</p>
                        <input type="text" placeholder="000000" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', fontSize: '24px', fontWeight: 600, letterSpacing: '8px', textAlign: 'center', padding: '12px', borderRadius: '12px', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', marginBottom: '24px' }} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button variant="secondary" fullWidth onClick={() => setShowEmailOTPModal(false)}>Cancelar</Button>
                            <Button variant="primary" fullWidth onClick={handleVerifyEmailChange} isLoading={isVerifyingEmailChange} disabled={otpCode.length < 6}>Confirmar Cambio</Button>
                        </div>
                    </div>
                </Modal>


            </div>
        </div>
    );
}
