/**
 * Página de registro de usuario.
 * Formulario completo con validación Zod: nombre, apellido, email,
 * contraseña con fortaleza, teléfono, país, términos.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Globe, ChevronDown } from 'lucide-react';
import { Button, Input, Alert } from '@/components/common';
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

const PAISES = [
    { value: '', label: 'Selecciona tu país' },
    { value: 'CO', label: '🇨🇴 Colombia' },
    { value: 'MX', label: '🇲🇽 México' },
    { value: 'PE', label: '🇵🇪 Perú' },
    { value: 'CL', label: '🇨🇱 Chile' },
    { value: 'AR', label: '🇦🇷 Argentina' },
    { value: 'EC', label: '🇪🇨 Ecuador' },
    { value: 'VE', label: '🇻🇪 Venezuela' },
    { value: 'CR', label: '🇨🇷 Costa Rica' },
    { value: 'PA', label: '🇵🇦 Panamá' },
    { value: 'DO', label: '🇩🇴 República Dominicana' },
];

export function RegisterPage() {
    const [registered, setRegistered] = useState(false);
    const navigate = useNavigate();
    const { register: registerUser, isLoading, error, clearError } = useAuthStore();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            nombres: '',
            apellidos: '',
            email: '',
            password: '',
            confirmPassword: '',
            telefono: '',
            pais: '',
            acceptTerms: false,
        },
    });

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
        await registerUser({
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            pais: data.pais,
            acceptTerms: data.acceptTerms,
        });

        if (!error) {
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

                <div>
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        leftIcon={<Lock size={18} />}
                        showPasswordToggle
                        error={errors.password?.message}
                        autoComplete="new-password"
                        {...register('password')}
                    />
                    {password.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        style={{
                                            height: '5px',
                                            flex: 1,
                                            borderRadius: '9999px',
                                            transition: 'background-color 200ms',
                                            backgroundColor: i <= strength.level ? strength.color : 'var(--border-color)',
                                        }}
                                    />
                                ))}
                            </div>
                            <p style={{ fontSize: '12px', color: strength.color, margin: 0 }}>
                                {strength.label}
                            </p>
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

                <Input
                    label="Teléfono (opcional)"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    leftIcon={<Phone size={18} />}
                    error={errors.telefono?.message}
                    {...register('telefono')}
                />

                {/* Select País */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        País
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Globe
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)',
                                pointerEvents: 'none',
                                zIndex: 1,
                            }}
                        />
                        <ChevronDown
                            size={16}
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)',
                                pointerEvents: 'none',
                            }}
                        />
                        <select
                            {...register('pais')}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 44px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                borderRadius: '10px',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                border: `1.5px solid ${errors.pais ? 'var(--color-error)' : 'var(--border-color)'}`,
                                outline: 'none',
                                appearance: 'none',
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--color-primary)';
                                e.target.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = errors.pais ? 'var(--color-error)' : 'var(--border-color)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            {PAISES.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.pais && (
                        <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: 0 }}>
                            {errors.pais.message}
                        </p>
                    )}
                </div>

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
