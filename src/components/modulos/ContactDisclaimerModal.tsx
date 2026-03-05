import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, X, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface ContactDisclaimerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => Promise<void>;
    isLoading?: boolean;
}

export function ContactDisclaimerModal({ isOpen, onClose, onAccept, isLoading }: ContactDisclaimerModalProps) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Umbral de 20px para considerar que llegó al final
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                setHasScrolledToBottom(true);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '12px' : '20px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 200ms ease'
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)',
                width: '100%',
                maxWidth: '600px',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--card-border)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
                animation: 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.05), transparent)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(0, 102, 255, 0.1)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Descargo de Responsabilidad
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                Módulo de Contactos y Gestión de Datos
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    style={{
                        padding: isMobile ? '20px' : '24px',
                        overflowY: 'auto',
                        flex: 1,
                        backgroundColor: 'var(--bg-secondary)',
                        fontSize: isMobile ? '13px' : '14px',
                        lineHeight: 1.6,
                        color: 'var(--text-secondary)'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Al habilitar el Módulo de Contactos en DropCost Master, usted como Usuario responsable de la tienda acepta los siguientes términos:
                        </p>

                        <div style={{ padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li style={{ display: 'flex', gap: '10px' }}>
                                    <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Controlador de Datos:</strong> Usted asume la responsabilidad legal completa por el tratamiento de los datos personales de sus clientes descargados o visualizados.</span>
                                </li>
                                <li style={{ display: 'flex', gap: '10px' }}>
                                    <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Cumplimiento Legal:</strong> Se compromete a cumplir con las leyes de protección de datos locales (GDPR, CCPA, Ley 1581 de 2012, etc.) según corresponda.</span>
                                </li>
                                <li style={{ display: 'flex', gap: '10px' }}>
                                    <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Limitación de Uso:</strong> Los datos serán utilizados exclusivamente para fines comerciales directos relacionados con las órdenes procesadas.</span>
                                </li>
                                <li style={{ display: 'flex', gap: '10px' }}>
                                    <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span><strong>Solicitudes ARCO:</strong> Es su obligación responder a solicitudes de acceso, rectificación, cancelación u oposición de sus clientes.</span>
                                </li>
                            </ul>
                        </div>

                        <p>
                            DropCost Master actúa únicamente como un <strong>procesador intermedio</strong> y no se hace responsable del uso posterior que se le dé a la información fuera de la plataforma.
                        </p>

                        <div style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                        }}>
                            <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '12px', color: 'var(--color-warning)', fontWeight: 600, margin: 0 }}>
                                Importante: La fecha, hora, IP y User Agent de esta aceptación serán grabados permanentemente en nuestra bitácora de auditoría para fines de transparencia legal.
                            </p>
                        </div>

                        {!hasScrolledToBottom && (
                            <div style={{ textAlign: 'center', padding: '10px', color: 'var(--color-primary)', fontWeight: 600, animation: 'bounce 2s infinite' }}>
                                ↓ Por favor desplácese hasta el final para continuar
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                        opacity: hasScrolledToBottom ? 1 : 0.5
                    }}>
                        <input
                            type="checkbox"
                            checked={isAccepted}
                            onChange={(e) => hasScrolledToBottom && setIsAccepted(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            style={{ width: '20px', height: '20px', cursor: 'inherit' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Entiendo y acepto la responsabilidad legal sobre los datos de mis clientes.
                        </span>
                    </label>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={onAccept}
                            disabled={!isAccepted || isLoading}
                            isLoading={isLoading}
                            rightIcon={<ArrowRight size={18} />}
                        >
                            Habilitar Módulo
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
        </div>
    );
}
