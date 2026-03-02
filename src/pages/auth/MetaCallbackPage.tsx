import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/common/Spinner';
import { supabase } from '@/lib/supabase';
import { Facebook, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

/**
 * Página de callback para Meta OAuth.
 * Maneja tanto el flujo de ventana principal (redirección) como el de popup (legacy).
 */
export function MetaCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        const processCode = async (authCode: string) => {
            console.log("[MetaCallback] Iniciando procesamiento de código...");

            try {
                // Caso Opener (Popup)
                if (window.opener) {
                    console.log("[MetaCallback] Opener detectado. Enviando mensaje...");
                    window.opener.postMessage({ type: 'META_AUTH_CODE_RECEIVED', code: authCode }, window.location.origin);
                    setStatus('success');
                    setTimeout(() => window.close(), 1000);
                    return;
                }

                // Caso Redirección (Misma ventana)
                console.log("[MetaCallback] Procesando en la misma pestaña...");

                // Intentar obtener sesión inmediata
                let { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log("[MetaCallback] Sin sesión inmediata. Reintentando hidratación...");
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    const refreshedStatus = await supabase.auth.getSession();
                    session = refreshedStatus.data.session;
                }

                if (!session) {
                    console.error("[MetaCallback] Sesión no encontrada después de reintento.");
                    setStatus('error');
                    setErrorMsg('Sesión de usuario no encontrada. Asegúrate de estar logueado.');
                } else {
                    await executeVerification(authCode, session);
                }

            } catch (err: any) {
                console.error("[MetaCallback] Excepción en processCode:", err);
                setStatus('error');
                setErrorMsg(err.message || 'Error inesperado al procesar.');
            }
        };

        const executeVerification = async (authCode: string, session: any) => {
            console.log("[MetaCallback] Token detectado, iniciando verificación segura...");

            try {
                const redirectUri = "https://mistyrose-jay-921979.hostingersite.com/api/auth/meta/callback";

                const fetchParams = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({ code: authCode, redirect_uri: redirectUri })
                };

                console.log("[MetaCallback] LLamando a la Edge Function 'conectar-meta'...");
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/conectar-meta`, fetchParams);

                const data = await response.json();

                if (!response.ok) {
                    console.error("[MetaCallback] Error del servidor:", data);
                    throw new Error(data.error || 'Falla de autenticación en el servidor.');
                }

                console.log("[MetaCallback] ¡Vinculado con éxito!");
                setUserName(data.meta_user_name || 'Perfil Meta');
                setStatus('success');

                setTimeout(() => navigate('/configuracion'), 3000);

            } catch (err: any) {
                console.error("[MetaCallback] Error final:", err);
                setStatus('error');
                setErrorMsg(err.message || 'Error al completar la vinculación.');
            }
        };

        if (error) {
            setStatus('error');
            setErrorMsg(searchParams.get('error_description') || 'Acceso denegado por Meta.');
            return;
        }

        if (code) {
            processCode(code);
        } else if (status === 'loading') {
            setStatus('error');
            setErrorMsg('No se recibió el código de autorización.');
        }

    }, [searchParams, navigate]);

    const handleBack = () => {
        if (window.opener) {
            window.close();
        } else {
            navigate('/configuracion');
        }
    };

    if (status === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '40px',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '440px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Pulsing Background Glow */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '200px',
                        height: '200px',
                        backgroundColor: 'rgba(24, 119, 242, 0.1)',
                        filter: 'blur(80px)',
                        borderRadius: '50%',
                        zIndex: 0,
                        animation: 'pulseGlow 2s infinite ease-in-out'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(24, 119, 242, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#1877F2',
                            border: '1px solid rgba(24, 119, 242, 0.2)'
                        }}>
                            <Facebook size={40} />
                        </div>

                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
                            Vinculando cuenta Meta
                        </h1>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                            padding: '10px 0'
                        }}>
                            <Spinner size="lg" />

                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '15px',
                                margin: 0,
                                fontWeight: 500
                            }}>
                                Por favor espera un momento mientras validamos tu sesión...
                            </p>
                        </div>
                    </div>

                    <style>{`
                        @keyframes pulseGlow {
                            0% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                            50% { opacity: 0.8; transform: translateX(-50%) scale(1.2); }
                            100% { opacity: 0.5; transform: translateX(-50%) scale(1); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '40px',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '440px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background Glow */}
                    <div style={{
                        position: 'absolute',
                        top: '-100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '200px',
                        height: '200px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        filter: 'blur(80px)',
                        borderRadius: '50%',
                        zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                            <CheckCircle2 size={40} />
                        </div>

                        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                            ¡Conexión Exitosa!
                        </h1>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                            Has vinculado correctamente tu perfil de Meta como <br />
                            <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>
                        </p>

                        <div style={{
                            backgroundColor: 'var(--bg-primary)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '32px'
                        }}>
                            <div style={{ width: '32px', height: '32px', backgroundColor: '#1877F2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Facebook size={20} color="white" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>PERFIL CONECTADO</p>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Meta Ads Business</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Redirigiendo a configuración...</p>
                            <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: '100%',
                                    backgroundColor: '#10B981',
                                    borderRadius: '2px',
                                    animation: 'progress 3s ease-in-out'
                                }} />
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes progress {
                            0% { width: 0%; }
                            100% { width: 100%; }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    // Default: Error state
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '40px',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '440px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <XCircle size={40} />
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Error de Conexión
                </h1>

                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    marginBottom: '32px'
                }}>
                    <p style={{ color: '#EF4444', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                        {errorMsg || 'No se pudo completar la integración con Meta Ads.'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={handleBack}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#1877F2',
                            color: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Intentar de nuevo
                    </button>

                    <button
                        onClick={handleBack}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        Regresar a Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}
