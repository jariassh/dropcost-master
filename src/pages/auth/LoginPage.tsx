/**
 * Página de inicio de sesión.
 * Formulario con email + contraseña, validación Zod, social login.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button, Input, Alert } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'El correo es requerido')
        .email('Ingresa un correo válido'),
    password: z
        .string()
        .min(1, 'La contraseña es requerida')
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error, requiresOTP, sessionId, clearError } = useAuthStore();

    useEffect(() => {
        clearError();
    }, [clearError]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    // Cargar email guardado si existe
    useEffect(() => {
        const savedEmail = localStorage.getItem('remember_email');
        if (savedEmail) {
            setValue('email', savedEmail);
            setValue('rememberMe', true);
        }
    }, [setValue]);

    async function onSubmit(data: LoginFormData) {
        clearError();

        // Manejar "Recuérdame"
        if (data.rememberMe) {
            localStorage.setItem('remember_email', data.email);
        } else {
            localStorage.removeItem('remember_email');
        }

        await login({ email: data.email, password: data.password, rememberMe: data.rememberMe });
    }

    // Redirigir a 2FA si es necesario
    if (requiresOTP && sessionId) {
        navigate('/2fa', { state: { sessionId } });
    }

    return (
        <div style={{ animation: 'fadeIn 400ms ease-out' }}>
            {/* Mobile logo */}
            <div
                className="lg:hidden"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '32px',
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'var(--color-primary)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '14px',
                    }}
                >
                    DC
                </div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px' }}>
                    DropCost Master
                </span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Bienvenido
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
                Ingresa tus credenciales para acceder a tu cuenta
            </p>

            {error && (
                <div style={{ marginBottom: '20px' }}>
                    <Alert type="error" dismissible onDismiss={clearError}>
                        {error}
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    leftIcon={<Mail size={18} />}
                    error={errors.email?.message}
                    autoComplete="email"
                    {...register('email')}
                />

                <Input
                    label="Contraseña"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    leftIcon={<Lock size={18} />}
                    showPasswordToggle
                    error={errors.password?.message}
                    autoComplete="current-password"
                    {...register('password')}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            {...register('rememberMe')}
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '4px',
                                accentColor: 'var(--color-primary)',
                                cursor: 'pointer',
                            }}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Recuérdame</span>
                    </label>

                    <Link
                        to="/recuperar-contrasena"
                        style={{
                            fontSize: '14px',
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontWeight: 500,
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                    Iniciar Sesión
                </Button>
            </form>

            {/* Separador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>o continúa con</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            </div>

            {/* Social login */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" fullWidth disabled>
                    Google
                </Button>
                <Button variant="secondary" fullWidth disabled>
                    Facebook
                </Button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '28px' }}>
                ¿No tienes una cuenta?{' '}
                <Link
                    to="/registro"
                    style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                >
                    Regístrate ahora
                </Link>
            </p>
        </div>
    );
}
