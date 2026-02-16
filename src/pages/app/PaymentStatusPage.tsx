
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/components/common';

export function PaymentStatusPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    // URL Params from Mercado Pago
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id'); // MP sends this
    const externalRef = searchParams.get('external_reference');

    const { initialize } = useAuthStore();

    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            if (status === 'approved' && paymentId) {
                setIsVerifying(true);
                try {
                    // Manual verification against backend to ensure subscription update
                    // This creates a robust fallback if webhooks fail or are delayed.
                    await paymentService.checkPaymentStatus(paymentId);

                    // If successful, refresh user session to get new plan claims
                    await initialize();
                    setVerificationResult('success');
                    toast.success('¡Plan Activado!', 'Tu pago ha sido validado correctamente.');
                } catch (error) {
                    console.error("Verification failed:", error);
                    setVerificationResult('error');
                    toast.error('Atención', 'El pago fue aprobado en Mercado Pago pero hubo un error al activar tu plan. Por favor contacta a soporte.');
                } finally {
                    setIsVerifying(false);
                }
            } else if (status === 'approved' && !paymentId) {
                // Determine success without verification (less secure, but fallback for UI)
                await initialize();
                setVerificationResult('success');
            }
        };

        // Run validation only once on mount if approved
        verifyPayment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once

    // Redirect automatically on success after delay? No, let user read.

    const renderContent = () => {
        if (isVerifying) {
            return (
                <div className="text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <Loader2 size={64} className="text-[#0066FF] animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-[#0066FF]">Verificando tu pago...</h1>
                    <p className="text-gray-600 dark:text-gray-400">Estamos confirmando la transacción con el banco para activar tu plan.</p>
                </div>
            );
        }

        if (status === 'rejected' || status === 'failure') {
            return (
                <div className="text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <XCircle size={64} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-red-500">Pago Rechazado</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Hubo un problema con tu método de pago. No se ha realizado ningún cargo.
                        Por favor intenta con otra tarjeta o medio de pago.
                    </p>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        Volver a Intentar
                    </button>
                </div>
            );
        }

        if (status === 'pending') {
            return (
                <div className="text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <Clock size={64} className="text-yellow-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-yellow-500">Pago Pendiente</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Estamos procesando tu pago. Esto puede tomar unos minutos (especialmente con PSE o Efectivo).
                        Te notificaremos por correo cuando se confirme.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        Ir al Dashboard
                    </button>
                </div>
            );
        }

        // Success Case (Verified or implicit)
        if (status === 'approved' || verificationResult === 'success') {
            return (
                <div className="text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-green-500">¡Suscripción Activada!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Gracias por tu compra. Tu plan ha sido actualizado correctamente.
                        Ya tienes acceso a todas las funcionalidades PRO.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        Ir al Dashboard <ArrowRight size={20} />
                    </button>
                </div>
            );
        }

        // Catch all error (verification failed but status was approved)
        if (verificationResult === 'error') {
            return (
                <div className="text-center animate-fade-in">
                    <div className="flex justify-center mb-6">
                        <AlertTriangle size={64} className="text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-orange-500">Atención Requerida</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Recibimos tu pago pero hubo un retraso activando el plan automáticamente.
                        <br /><br />
                        <strong>No te preocupes, tu dinero está seguro.</strong><br />
                        Por favor contacta a soporte con el ID: <code>{paymentId || externalRef || 'N/A'}</code>
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        Continuar al Dashboard
                    </button>
                </div>
            );
        }

        return (
            <div className="text-center animate-fade-in">
                <Loader2 size={48} className="text-gray-400 animate-spin mx-auto mb-4" />
                <p>Cargando información del pago...</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {renderContent()}
            </div>
        </div>
    );
}
