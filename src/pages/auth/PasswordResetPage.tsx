/**
 * Página de recuperación de contraseña.
 * Input email, estado de éxito tras envío.
 */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { Button, Input, Alert } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { translateError } from '@/lib/errorTranslations';

const resetSchema = z.object({
    email: z.string().min(1, 'El correo es requerido').email('Ingresa un correo válido'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export function PasswordResetPage() {
    const [sent, setSent] = useState(false);
    const { requestPasswordReset, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        // Limpiamos errores al entrar a la página
        clearError();
    }, [clearError]);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
        defaultValues: { email: '' },
    });

    async function onSubmit(data: ResetFormData) {
        clearError();
        const success = await requestPasswordReset({ email: data.email });
        if (success) setSent(true);
    }

    if (sent) {
        return (
            <div style={{ textAlign: 'center', animation: 'fadeIn 300ms ease-out' }}>
                <div
                    style={{
                        width: '64px', height: '64px', backgroundColor: '#D1FAE5', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                    }}
                >
                    <Mail size={32} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Instrucciones enviadas
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
                    Si existe una cuenta registrada con el correo <strong style={{ color: 'var(--text-primary)' }}>{getValues('email')}</strong>, recibirás un enlace para restablecer tu contraseña en unos minutos.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                    Si no recibes nada, verifica que el correo sea correcto y revisa tu carpeta de spam.
                </p>
                <Link to="/login">
                    <Button variant="secondary" fullWidth>
                        Volver al inicio de sesión
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            <Link
                to="/login"
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px',
                    color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '24px',
                }}
            >
                <ArrowLeft size={16} />
                Volver al inicio
            </Link>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                    style={{
                        width: '64px', height: '64px', backgroundColor: 'var(--color-primary-light)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        animation: 'scaleIn 400ms ease-out',
                    }}
                >
                    <KeyRound size={32} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    ¿Olvidaste tu contraseña?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Ingresa tu correo y te enviaremos instrucciones para restablecerla
                </p>
            </div>

            {error && (
                <div style={{ marginBottom: '20px' }}>
                    <Alert type="error" dismissible onDismiss={clearError}>
                        {translateError(error)}
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

                <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                    Enviar instrucciones
                </Button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '24px' }}>
                ¿Recordaste tu contraseña?{' '}
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
