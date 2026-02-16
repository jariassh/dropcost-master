import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/components/common';
import { Button } from '@/components/common/Button';

export function PaymentStatusPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    // URL Params from Mercado Pago
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');
    const externalRef = searchParams.get('external_reference');
    const mockStatus = searchParams.get('mock');

    const { initialize } = useAuthStore();

    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<'success' | 'error' | null>(null);
    const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);

    useEffect(() => {
        // MODO MOCK PARA PREVISUALIZACIÓN DE DISEÑO
        if (mockStatus) {
            if (mockStatus === 'approved') setVerificationResult('success');
            else if (mockStatus === 'verifying') setIsVerifying(true);
            else if (mockStatus === 'error') setVerificationResult('error');
            return;
        }

        const verifyPayment = async () => {
            if (hasAttemptedVerification) return;

            if (status === 'approved' && paymentId) {
                setHasAttemptedVerification(true);
                setIsVerifying(true);
                try {
                    await paymentService.checkPaymentStatus(paymentId);
                    await initialize();
                    setVerificationResult('success');
                    toast.success('¡Plan Activado!', 'Tu suscripción PRO ya está activa.');
                } catch (error) {
                    console.error("Verification failed:", error);
                    setVerificationResult('error');
                } finally {
                    setIsVerifying(false);
                }
            } else if (status === 'approved' && !paymentId) {
                setHasAttemptedVerification(true);
                await initialize();
                setVerificationResult('success');
            }
        };

        verifyPayment();
    }, [status, paymentId, mockStatus, initialize, toast, hasAttemptedVerification]);

    const renderIcon = (type: 'success' | 'error' | 'pending' | 'warning' | 'loading') => {
        let color = 'var(--color-primary)';
        let Icon: any = AlertTriangle;

        if (type === 'success') {
            color = 'var(--color-success)';
            Icon = CheckCircle;
        } else if (type === 'error') {
            color = 'var(--color-error)';
            Icon = XCircle;
        } else if (type === 'pending') {
            color = 'var(--color-warning)';
            Icon = Clock;
        } else if (type === 'warning') {
            color = 'var(--color-warning)';
            Icon = AlertTriangle;
        } else if (type === 'loading') {
            color = 'var(--color-primary)';
            Icon = Loader2;
        }

        return (
            <div
                style={{
                    marginBottom: '32px',
                    padding: '24px',
                    borderRadius: '50%',
                    backgroundColor: type === 'loading' ? 'transparent' : `${color}20`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '84px',
                    height: '84px'
                }}
            >
                <Icon size={42} strokeWidth={2} className={type === 'loading' ? 'animate-spin' : ''} />
            </div>
        );
    };

    const renderContent = () => {
        // STATE: VERIFICANDO
        if (isVerifying || mockStatus === 'verifying') {
            return (
                <div style={containerStyle}>
                    {renderIcon('loading')}
                    <h3 style={titleStyle}>Verificando tu pago</h3>
                    <p style={descriptionStyle}>
                        Estamos confirmando la transacción con Mercado Pago para activar tu plan PRO.
                    </p>
                </div>
            );
        }

        // STATE: RECHAZADO
        if (status === 'rejected' || status === 'failure' || mockStatus === 'rejected') {
            return (
                <div style={containerStyle}>
                    {renderIcon('error')}
                    <h3 style={titleStyle}>Pago Rechazado</h3>
                    <p style={descriptionStyle}>
                        Hubo un problema con tu método de pago y no se pudo completar la transacción.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/pricing')}
                        fullWidth
                        style={buttonStyle}
                    >
                        Volver a Intentar
                    </Button>
                </div>
            );
        }

        // STATE: PENDIENTE
        if (status === 'pending' || mockStatus === 'pending') {
            return (
                <div style={containerStyle}>
                    {renderIcon('pending')}
                    <h3 style={titleStyle}>Pago Pendiente</h3>
                    <p style={descriptionStyle}>
                        Estamos procesando tu pago. Te notificaremos en cuanto se confirme la activación.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/simulador')}
                        fullWidth
                        style={buttonStyle}
                    >
                        Ir al Simulador
                    </Button>
                </div>
            );
        }

        // STATE: ÉXITO
        if (verificationResult === 'success' || mockStatus === 'approved') {
            return (
                <div style={containerStyle}>
                    {renderIcon('success')}
                    <h3 style={titleStyle}>¡Suscripción Activada!</h3>
                    <p style={descriptionStyle}>
                        Tu plan ha sido actualizado correctamente. Ya puedes disfrutar de las ventajas PRO.
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/simulador')}
                        fullWidth
                        style={{ ...buttonStyle, backgroundColor: 'var(--color-primary)' }}
                    >
                        Ir al Simulador <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                    </Button>
                </div>
            );
        }

        // STATE: ERROR DE VERIFICACIÓN
        if (verificationResult === 'error' || mockStatus === 'error') {
            return (
                <div style={containerStyle}>
                    {renderIcon('warning')}
                    <h3 style={titleStyle}>Atención Requerida</h3>
                    <p style={{ ...descriptionStyle, marginBottom: '20px' }}>
                        Recibimos tu pago pero hubo un retraso activando el plan. Tu dinero está seguro.
                    </p>
                    <div style={infoBoxStyle}>
                        <p style={infoLabelStyle}>ID DE REFERENCIA</p>
                        <code style={infoValueStyle}>{paymentId || externalRef || 'N/A'}</code>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/simulador')}
                        fullWidth
                        style={buttonStyle}
                    >
                        Continuar al Simulador
                    </Button>
                </div>
            );
        }

        return (
            <div style={containerStyle}>
                <Loader2 size={32} className="animate-spin text-[var(--text-tertiary)]" />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm" />

            {/* Modal Content */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '448px', // size="sm" equivalent
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '24px',
                    boxShadow: 'var(--shadow-xl)',
                    padding: '48px 32px 40px 32px', // Espaciado interno generoso
                    animation: 'scaleIn 200ms ease-out',
                    zIndex: 1
                }}
            >
                {renderContent()}
            </div>
        </div>
    );
}

// Estilos Reutilizables (Extraídos de ConfirmDialog/Button)
const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
};

const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '16px',
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
};

const descriptionStyle: React.CSSProperties = {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    maxWidth: '300px',
    margin: '0 auto 40px auto'
};

const buttonStyle: React.CSSProperties = {
    height: '52px',
    borderRadius: '14px',
    fontWeight: 700,
    fontSize: '16px'
};

const infoBoxStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--bg-secondary)',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    marginBottom: '32px',
    textAlign: 'left'
};

const infoLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px'
};

const infoValueStyle: React.CSSProperties = {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: 'var(--text-primary)',
    wordBreak: 'break-all'
};
