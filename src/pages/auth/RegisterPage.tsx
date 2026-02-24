/**
 * Página de registro de usuario.
 * Formulario completo con validación Zod: nombre, apellido, email,
 * contraseña con fortaleza, teléfono, país, términos.
 */
import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, Globe, ChevronDown, Sparkles, RefreshCw, CheckCircle2, UserPlus } from 'lucide-react';
import { Button, Input, Alert, SmartPhoneInput } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { getReferrerNameByCode, incrementReferralClicks } from '@/services/referralService';

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
    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get('ref') || '';
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const { register: registerUser, isLoading, error, clearError } = useAuthStore();

    const trackRef = useRef(false);

    useEffect(() => {
        if (referralCode) {
            getReferrerNameByCode(referralCode).then(name => {
                if (name) setReferrerName(name);
            });

            // Evitar conteo doble en desarrollo (StrictMode) sin bloquear recargas manuales
            if (!trackRef.current) {
                incrementReferralClicks(referralCode);
                trackRef.current = true;
            }
        }
    }, [referralCode]);

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
            referredBy: referralCode,
            acceptTerms: data.acceptTerms,
        });

        if (success) {
            setRegistered(true);
            setTimeout(() => navigate('/login'), 4000);
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
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '16px' }}>
                    Te hemos enviado un correo de verificación con un enlace para activar tu cuenta. Revisa tu bandeja de entrada.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
                    <RefreshCw size={14} className="animate-spin" />
                    Redirigiendo al inicio de sesión...
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            {referralCode && (
                <div style={{
                    marginBottom: '28px',
                    padding: '18px',
                    backgroundColor: 'rgba(0, 102, 255, 0.04)',
                    border: '1px solid rgba(0, 102, 255, 0.15)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--color-primary)',
                        opacity: 0.03,
                        borderRadius: '0 0 0 100%'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                        <Sparkles size={16} fill="currentColor" style={{ opacity: 0.5 }} />
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Beneficio DropCost
                        </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {referrerName ? (
                            <>¡Genial! <b>{referrerName}</b> te ha invitado. Al registrarte con este link, tendrás soporte prioritario en tu configuración inicial.</>
                        ) : (
                            <>Has sido invitado por <b>{referralCode}</b>. ¡Únete a la comunidad de Dropshippers más avanzada y optimiza tus costos hoy!</>
                        )}
                    </p>
                </div>
            )}

            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
                Crear cuenta
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px', textAlign: 'center', lineHeight: 1.5 }}>
                Completa tus datos para comenzar
            </p>

            {error && (
                <div style={{ marginBottom: '24px' }}>
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
                        <a
                            href="/terminos"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open('/terminos', '_blank'); }}
                        >
                            Términos y Condiciones
                        </a>{' '}
                        y la{' '}
                        <a
                            href="/privacidad"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open('/privacidad', '_blank'); }}
                        >
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

            <p style={{ textAlign: 'center', fontSize: '15px', color: 'var(--text-secondary)', marginTop: '32px' }}>
                ¿Ya tienes una cuenta?{' '}
                <Link
                    to="/login"
                    style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                >
                    Inicia sesión
                </Link>
            </p>
        </div>
    );
}
