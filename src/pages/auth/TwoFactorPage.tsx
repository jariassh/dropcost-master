/**
 * Página de verificación 2FA — Código de 6 dígitos.
 * Ícono de escudo, enlace a código de recuperación.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
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

export function TwoFactorPage() {
    const [code, setCode] = useState<string[]>(Array(6).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const sessionId = (location.state as { sessionId?: string })?.sessionId || '';
    const { verify2FA, isLoading, error, clearError, isAuthenticated, resend2FACode } = useAuthStore();
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0 || isLoading) return;
        setCooldown(60);
        await resend2FACode();
    };

    function handleChange(index: number, value: string) {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();

        // Auto-submit when all 6 digits are filled
        if (newCode.every((d) => d !== '')) {
            setTimeout(() => autoSubmit(newCode), 80);
        }
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

        // Auto-submit when pasted code fills all 6 digits
        if (newCode.every((d) => d !== '')) {
            setTimeout(() => autoSubmit(newCode), 80);
        }
    }

    /** Fires verification automatically once all digits are present */
    async function autoSubmit(digits: string[]) {
        const fullCode = digits.join('');
        if (fullCode.length !== 6 || isLoading) return;
        clearError();
        await verify2FA({ code: fullCode, sessionId });
    }

    const handleSubmit = useCallback(async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) return;
        clearError();
        await verify2FA({ code: fullCode, sessionId });
    }, [code, clearError, verify2FA, sessionId]);

    if (isAuthenticated) {
        navigate('/', { replace: true });
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
                    <ShieldCheck size={32} color="var(--color-primary)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Verificación en dos pasos
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Ingresa el código de 6 dígitos de tu aplicación de autenticación
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
                        style={{
                            ...codeInputStyle,
                            ...(digit ? { borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px rgba(0,102,255,0.15)' } : {}),
                        }}
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
                Verificar
            </Button>

            <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                    style={{
                        fontSize: '14px',
                        color: cooldown > 0 ? 'var(--text-tertiary)' : 'var(--color-primary)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: cooldown > 0 ? 'default' : 'pointer',
                        transition: 'color 0.2s'
                    }}
                >
                    {cooldown > 0 ? `Reenviar código en ${cooldown}s` : '¿No recibiste el código? Reenviar'}
                </button>

                <button
                    style={{
                        fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500,
                        background: 'none', border: 'none', cursor: 'pointer',
                    }}
                    onClick={() => alert("Funcionalidad de recuperación en desarrollo. Contáctanos.")}
                >
                    ¿Perdiste tu dispositivo?
                </button>
            </div>
        </div>
    );
}
