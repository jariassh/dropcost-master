/**
 * Página Verificar Email — Código de 6 dígitos.
 * Timer de reenvío 60s, ícono de correo animado.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button, Alert } from '@/components/common';
import { useAuthStore } from '@/store/authStore';

const codeInputStyle: React.CSSProperties = {
    width: '52px',
    height: '60px',
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: 700,
    borderRadius: '10px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    border: '1.5px solid var(--border-color)',
    outline: 'none',
    transition: 'all 200ms ease',
};

const codeInputActiveStyle: React.CSSProperties = {
    ...codeInputStyle,
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 3px rgba(0,102,255,0.15)',
};

export function VerifyEmailPage() {
    const [code, setCode] = useState<string[]>(Array(6).fill(''));
    const [resendTimer, setResendTimer] = useState(60);
    const [verified, setVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { verifyEmail, isLoading, error, clearError } = useAuthStore();

    useEffect(() => {
        if (resendTimer <= 0) return;
        const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [resendTimer]);

    function handleChange(index: number, value: string) {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }

    function handleKeyDown(index: number, e: React.KeyboardEvent) {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    function handlePaste(e: React.ClipboardEvent) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
        setCode(newCode);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }

    const handleSubmit = useCallback(async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) return;
        clearError();
        await verifyEmail({ code: fullCode, userId: 'placeholder' });
        setVerified(true);
    }, [code, clearError, verifyEmail]);

    function handleResend() {
        setResendTimer(60);
    }

    if (verified && !error) {
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
                    ¡Correo verificado!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Tu cuenta ha sido verificada exitosamente.
                </p>
                <Link to="/login">
                    <Button fullWidth>Iniciar sesión</Button>
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
                    <Mail size={32} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Verifica tu correo
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Ingresa el código de 6 dígitos que enviamos a tu correo electrónico
                </p>
            </div>

            {error && (
                <div style={{ marginBottom: '20px' }}>
                    <Alert type="error" dismissible onDismiss={clearError}>{error}</Alert>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }} onPaste={handlePaste}>
                {code.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        style={digit ? codeInputActiveStyle : codeInputStyle}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-primary)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,102,255,0.15)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = digit ? 'var(--color-primary)' : 'var(--border-color)';
                            e.target.style.boxShadow = digit ? '0 0 0 3px rgba(0,102,255,0.15)' : 'none';
                        }}
                    />
                ))}
            </div>

            <Button fullWidth isLoading={isLoading} onClick={handleSubmit} disabled={code.join('').length !== 6} size="lg">
                Verificar código
            </Button>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                {resendTimer > 0 ? (
                    <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                        Reenviar código en <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{resendTimer}s</span>
                    </p>
                ) : (
                    <button
                        onClick={handleResend}
                        style={{
                            fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600,
                            background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
                        }}
                    >
                        Reenviar código
                    </button>
                )}
            </div>
        </div>
    );
}
