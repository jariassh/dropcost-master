/**
 * Página para establecer una nueva contraseña.
 * Se usa después de que el usuario hace clic en el enlace de recuperación.
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle2, Sparkles, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button, Input, Alert } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

const updatePasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Mínimo 8 caracteres')
            .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
            .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
            .regex(/[0-9]/, 'Debe incluir al menos un número')
            .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial'),
        confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordPage() {
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { updatePassword, logout, isLoading, isInitializing, isAuthenticated, error, clearError } = useAuthStore();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UpdatePasswordFormData>({
        resolver: zodResolver(updatePasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const password = watch('password', '');
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
        setValue('password', suggestedPassword, { shouldValidate: true });
        setValue('confirmPassword', suggestedPassword, { shouldValidate: true });
        setSuggestedPassword('');
        clearError(); // Limpiamos errores generales si existían
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

    const strength = getPasswordStrength(password);

    async function onSubmit(data: UpdatePasswordFormData) {
        clearError();
        const ok = await updatePassword(data.password);
        if (ok) {
            setSuccess(true);
            // Cerramos sesión para que el usuario tenga que entrar con su nueva clave
            setTimeout(async () => {
                await logout();
                navigate('/login', { replace: true });
            }, 3000);
        }
    }

    if (success) {
        return (
            <div style={{ textAlign: 'center', animation: 'fadeIn 300ms ease-out' }}>
                <div
                    style={{
                        width: '64px', height: '64px', backgroundColor: '#D1FAE5', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    }}
                >
                    <CheckCircle2 size={32} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    ¡Contraseña actualizada!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
                    Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión en unos segundos.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        );
    }

    // Si la inicialización terminó y no estamos autenticados, el link es inválido
    if (!isInitializing && !isAuthenticated) {
        return (
            <div style={{ textAlign: 'center', animation: 'fadeIn 300ms ease-out' }}>
                <div
                    style={{
                        width: '64px', height: '64px', backgroundColor: '#FEE2E2', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    }}
                >
                    <AlertCircle size={32} color="#EF4444" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Enlace inválido o expirado
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
                    Este enlace de recuperación ya ha sido utilizado o ha caducado por motivos de seguridad.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: (12) as any }}>
                    <Button fullWidth onClick={() => navigate('/recuperar-contrasena')}>
                        Solicitar nuevo enlace
                    </Button>
                    <Button variant="secondary" fullWidth onClick={() => navigate('/login')}>
                        Volver al inicio de sesión
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            <button
                type="button"
                onClick={async () => {
                    await logout();
                    navigate('/login');
                }}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px',
                    color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '24px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0
                }}
            >
                <ArrowLeft size={16} />
                Cancelar y volver
            </button>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                    style={{
                        width: '64px', height: '64px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        animation: 'scaleIn 400ms ease-out',
                    }}
                >
                    <ShieldCheck size={32} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Nueva contraseña
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Crea una contraseña segura para proteger tu cuenta
                </p>
            </div>

            {error && (
                <div style={{ marginBottom: '20px' }}>
                    <Alert type="error" dismissible onDismiss={clearError}>{error}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Input
                        label="Nueva contraseña"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        leftIcon={<Lock size={18} />}
                        showPasswordToggle
                        error={errors.password?.message}
                        autoComplete="new-password"
                        onFocus={() => {
                            if (!password && !suggestedPassword) {
                                generatePassword();
                            }
                        }}
                        {...register('password')}
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

                    {password.length > 0 && !suggestedPassword && (
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
                            <p style={{ fontSize: '12px', color: strength.color, fontWeight: 600, margin: 0 }}>
                                Seguridad: {strength.label}
                            </p>
                        </div>
                    )}
                </div>

                <Input
                    label="Confirmar nueva contraseña"
                    type="password"
                    placeholder="Repite tu contraseña"
                    leftIcon={<Lock size={18} />}
                    showPasswordToggle
                    error={errors.confirmPassword?.message}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                />

                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                    Cambiar contraseña
                </Button>
            </form>
        </div>
    );
}
