/**
 * Página de registro de usuario.
 * Formulario completo con validación Zod: nombre, apellido, email,
 * contraseña con fortaleza, teléfono, país, términos.
 */
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Globe, ChevronDown, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button, Input, Alert, SmartPhoneInput } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z
    .object({
        nombres: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        apellidos: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        email: z.string().min(1, 'El correo es requerido').email('Ingresa un correo válido'),
        password: z
            .string()
            .min(8, 'Mínimo 8 caracteres')
            .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
            .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
            .regex(/[0-9]/, 'Debe incluir al menos un número')
            .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un carácter especial'),
        confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
        telefono: z.string().optional(),
        pais: z.string().min(1, 'Selecciona un país'),
        acceptTerms: z.boolean().refine((val) => val === true, {
            message: 'Debes aceptar los términos y condiciones',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

// Eliminamos PAISES ya que SmartPhoneInput lo maneja internamente

export function RegisterPage() {
    const [registered, setRegistered] = useState(false);
    const navigate = useNavigate();
    const { register: registerUser, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            nombres: '',
            apellidos: '',
            email: '',
            password: '',
            confirmPassword: '',
            telefono: '',
            pais: 'CO',
            acceptTerms: false,
        },
    });

    const [suggestedPassword, setSuggestedPassword] = useState('');
    const [copied, setCopied] = useState(false);

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
    };

    const password = watch('password', '');

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

    async function onSubmit(data: RegisterFormData) {
        clearError();
        const success = await registerUser({
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            pais: data.pais,
            acceptTerms: data.acceptTerms,
        });

        if (success) {
            setRegistered(true);
            setTimeout(() => navigate('/verificar-email'), 2000);
        }
    }

    if (registered) {
        return (
            <div style={{ textAlign: 'center', animation: 'fadeIn 300ms ease-out' }}>
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#D1FAE5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}
                >
                    <Mail size={32} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    ¡Cuenta creada!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Te hemos enviado un correo de verificación. Revisa tu bandeja de entrada.
                </p>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Crear cuenta
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
                Completa tus datos para comenzar
            </p>

            {error && (
                <div style={{ marginBottom: '16px' }}>
                    <Alert type="error" dismissible onDismiss={clearError}>
                        {error}
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Input
                        label="Nombres"
                        placeholder="Juan"
                        leftIcon={<User size={18} />}
                        error={errors.nombres?.message}
                        {...register('nombres')}
                    />
                    <Input
                        label="Apellidos"
                        placeholder="Pérez"
                        leftIcon={<User size={18} />}
                        error={errors.apellidos?.message}
                        {...register('apellidos')}
                    />
                </div>

                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    leftIcon={<Mail size={18} />}
                    error={errors.email?.message}
                    autoComplete="email"
                    {...register('email')}
                />

                <div style={{ position: 'relative' }}>
                    <Input
                        label="Contraseña"
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
                        {...register('password', {
                            onBlur: () => setTimeout(() => setSuggestedPassword(''), 200)
                        })}
                    />

                    {/* Popover de Sugerencia Flotante */}
                    {suggestedPassword && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% - 10px)',
                            left: '0',
                            right: '0',
                            zIndex: 100,
                            padding: '14px',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-xl)',
                            animation: 'scaleIn 200ms ease-out',
                            marginTop: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    padding: '6px',
                                    backgroundColor: 'var(--color-primary-light)',
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
                                    border: '1.5px solid var(--color-primary-light)'
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
                                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button size="sm" fullWidth onClick={useSuggested}>
                                    Usar esta
                                </Button>
                                <Button size="sm" variant="secondary" fullWidth onClick={() => setSuggestedPassword('')}>
                                    No, gracias
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: '12px', color: strength.color, fontWeight: 600, margin: 0 }}>
                                    Seguridad: {strength.label}
                                </p>
                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>
                                    {password.length} caracteres
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Input
                    label="Confirmar contraseña"
                    type="password"
                    placeholder="Repite tu contraseña"
                    leftIcon={<Lock size={18} />}
                    showPasswordToggle
                    error={errors.confirmPassword?.message}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                />

                <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                        <SmartPhoneInput
                            label="Teléfono Móvil"
                            value={field.value || ''}
                            onChange={(fullValue, iso) => {
                                field.onChange(fullValue);
                                setValue('pais', iso); // Sincronizamos el país automáticamente
                            }}
                            error={errors.telefono?.message}
                        />
                    )}
                />

                {/* Términos */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        {...register('acceptTerms')}
                        style={{
                            width: '18px',
                            height: '18px',
                            marginTop: '2px',
                            borderRadius: '4px',
                            accentColor: 'var(--color-primary)',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        Acepto los{' '}
                        <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                            Términos y Condiciones
                        </a>{' '}
                        y la{' '}
                        <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                            Política de Privacidad
                        </a>
                    </span>
                </label>
                {errors.acceptTerms && (
                    <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: 0 }}>
                        {errors.acceptTerms.message}
                    </p>
                )}

                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                    Crear cuenta
                </Button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '24px' }}>
                ¿Ya tienes una cuenta?{' '}
                <Link
                    to="/login"
                    style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
