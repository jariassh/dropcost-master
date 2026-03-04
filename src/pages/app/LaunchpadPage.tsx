import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Store,
    Link as LinkIcon,
    Facebook,
    Target,
    CheckCircle2,
    Circle,
    ChevronRight,
    Zap,
    Rocket,
    Layout,
    ArrowRight
} from 'lucide-react';
import {
    Card,
    Button,
    Badge,
    Spinner,
    useToast
} from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Step Components (Placeholder for now)
import { StepPlanSelection } from '@/pages/app/launchpad/StepPlanSelection';
import { StepCreateStore } from '@/pages/app/launchpad/StepCreateStore';
import { StepConnectShopify } from '@/pages/app/launchpad/StepConnectShopify';
import { StepConnectMeta } from '@/pages/app/launchpad/StepConnectMeta';
import { StepAssignAdAccounts } from '@/pages/app/launchpad/StepAssignAdAccounts';
import { useLaunchpadStore } from '@/store/useLaunchpadStore';

type LaunchpadStep = 0 | 1 | 2 | 3 | 4;

export function LaunchpadPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const toast = useToast();

    const {
        currentStep,
        progress,
        isLoading,
        tiendaId,
        fetchStatus,
        isComplete,
        setCurrentStep
    } = useLaunchpadStore();

    // viewingStep: qué paso estoy VIENDO (navegación visual)
    // currentStep: progreso más alto real (del store)
    const [viewingStep, setViewingStep] = useState<number>(0);

    const steps = [
        { id: 0, title: 'Plan', icon: Zap, label: 'Seleccionar Plan' },
        { id: 1, title: 'Tienda', icon: Store, label: 'Crear Tienda' },
        { id: 2, title: 'Meta', icon: Facebook, label: 'Conectar Meta' },
        { id: 3, title: 'Cuentas', icon: Target, label: 'Configurar Ads' },
        { id: 4, title: 'Shopify', icon: LinkIcon, label: 'Conectar Shopify' },
    ];

    useEffect(() => {
        // Solo sincronizar viewingStep con currentStep si no estamos cargando
        if (!isLoading) {
            setViewingStep(currentStep);
        }
    }, [isLoading, currentStep]);

    const onFinish = () => {
        toast.success('¡Configuración Completa!', 'Redirigiendo al Dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
    };

    // Botón principal: avanza visualmente paso a paso
    const handleContinueClick = () => {
        const isLastStepAndComplete = isComplete && viewingStep >= 4;
        if (isLastStepAndComplete) {
            // Progreso 100% y estamos en el último paso: Terminar
            onFinish();
            return;
        }

        // Si el paso que vemos ya fue completado, solo avanzar visualmente
        if (viewingStep < currentStep) {
            setViewingStep(viewingStep + 1);
            return;
        }

        // Si estamos en el paso actual y hacemos clic en continuar/omitir
        if (viewingStep === currentStep) {
            handleStepComplete(currentStep + 1);
        }
    };

    const handleStepComplete = async (nextStep: number, metadata?: any) => {
        if (!user?.id) {
            toast.error('Sesión no encontrada', 'Por favor inicia sesión para guardar tu progreso.');
            return;
        }

        if (nextStep <= currentStep || (nextStep >= 5 && isComplete)) return;

        const newProgress = Math.min(nextStep * 20, 100);
        const resolvedTiendaId = metadata?.tiendaId || tiendaId;

        try {
            // 1. Fetch existing record for this user + tienda
            let query = supabase
                .from('onboarding_progress' as any)
                .select('id, tienda_id')
                .eq('user_id', user.id);

            if (resolvedTiendaId) {
                query = query.eq('tienda_id', resolvedTiendaId);
            } else {
                query = query.is('tienda_id', null);
            }

            const { data: existing } = await query.maybeSingle();

            // 2. Prepare Update Data (NEW ORDER)
            // ['plan', 'tienda', 'meta', 'cuentas_publicitarias', 'shopify']
            const stepNameMapping = ['plan', 'tienda', 'meta', 'cuentas_publicitarias', 'shopify'];
            const stepKey = `paso_${Math.max(0, nextStep - 1)}_` + stepNameMapping[Math.max(0, nextStep - 1)];

            const upsertData: any = {
                user_id: user.id,
                paso_actual: Math.min(nextStep, 5),
                porcentaje_completado: newProgress,
                completado: nextStep >= 5,
                [stepKey]: true
            };

            if (existing) upsertData.id = (existing as any).id;
            if (resolvedTiendaId) upsertData.tienda_id = resolvedTiendaId;

            if (!upsertData.tienda_id && nextStep === 1) {
                console.log('Skipping onboarding_progress record update (no tienda_id available yet)');
            } else {
                const { error } = await supabase
                    .from('onboarding_progress' as any)
                    .upsert(upsertData);

                if (error) throw new Error(error.message);
            }

            // Refresh store state
            await fetchStatus(user.id, resolvedTiendaId);

            if (nextStep <= 4) {
                setViewingStep(nextStep);
            }
        } catch (err: any) {
            console.error('Launchpad Save Error:', err);
            toast.error('Error al guardar', err.message || 'No se pudo guardar el progreso.');
        }
    };

    if (isLoading) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--bg-primary)'
            }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            {/* Header Area */}
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                position: 'relative',
                marginBottom: '48px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '0 24px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        color: 'var(--color-primary)'
                    }}>
                        <Rocket size={32} />
                        <h1 style={{ fontFamily: 'var(--font-headings)', fontSize: '32px', letterSpacing: 'var(--ls-h)', margin: 0, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            LAUNCHPAD
                            <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', letterSpacing: '0', textTransform: 'none' }}>
                                | ONBOARDING
                            </span>
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
                        Configura tu negocio de dropshipping en minutos con nuestra guía paso a paso.
                    </p>
                </div>

                {(() => {
                    // Determinar si mostrar el botón y qué texto usar
                    const isViewingCompletedStep = viewingStep < currentStep;
                    const isLastStepAndComplete = isComplete && viewingStep >= 4;
                    const isCurrentStep = viewingStep === currentStep;
                    const showButton = isViewingCompletedStep || isLastStepAndComplete || isCurrentStep;

                    if (!showButton) return null;

                    return (
                        <Button
                            onClick={handleContinueClick}
                            variant="primary"
                            size="lg"
                            style={{
                                gap: '12px',
                                padding: '0 32px',
                                height: '52px',
                                borderRadius: '16px',
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.3)'
                            }}
                        >
                            {isLastStepAndComplete ? 'Terminar' : 'Continuar'} <ArrowRight size={20} />
                        </Button>
                    );
                })()}
            </div>

            {/* Progress Stepper - Columnas alternadas: [ÍCONO] [CONECTOR] [ÍCONO] ... */}
            <div style={{
                width: '100%', maxWidth: '800px', marginBottom: '40px',
                padding: '24px 32px', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px',
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center'
            }}>
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isCompleted = currentStep > idx || (idx === 4 && isComplete);
                    const isActive = viewingStep === idx;
                    const isAheadOfViewing = isCompleted && idx > viewingStep;

                    let bgColor = 'var(--bg-tertiary)';
                    let iconColor = 'var(--text-tertiary)';
                    if (isActive) {
                        bgColor = 'var(--color-primary)';
                        iconColor = '#fff';
                    } else if (isCompleted) {
                        bgColor = 'var(--color-success)';
                        iconColor = '#fff';
                    }

                    // Conector ANTES de este ícono (entre el anterior y este)
                    const connectorBefore = idx > 0 ? (() => {
                        const prevCompleted = currentStep > (idx - 1) || (idx - 1 === 4 && isComplete);
                        const connectorAhead = prevCompleted && (idx - 1) >= viewingStep;
                        const lineColor = prevCompleted ? 'var(--color-success)' : 'var(--border-color)';
                        const dotColor = prevCompleted ? 'var(--color-success)' : 'var(--border-color)';
                        return (
                            <div
                                key={`conn-${idx}`}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center',
                                    gap: '0', marginTop: '-20px',
                                    padding: '0 8px',
                                    opacity: connectorAhead ? 0.4 : 1,
                                    transition: 'opacity 0.3s ease'
                                }}
                            >
                                <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    backgroundColor: dotColor, flexShrink: 0
                                }} />
                                <div style={{
                                    flex: 1, height: '2px',
                                    backgroundColor: lineColor
                                }} />
                                <div style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    backgroundColor: dotColor, flexShrink: 0
                                }} />
                            </div>
                        );
                    })() : null;

                    return (
                        <React.Fragment key={step.id}>
                            {connectorBefore}
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                flexShrink: 0,
                                opacity: isAheadOfViewing ? 0.5 : 1,
                                transition: 'opacity 0.3s ease'
                            }}>
                                <div style={{
                                    width: '42px', height: '42px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: bgColor,
                                    color: iconColor,
                                    border: isActive ? '4px solid rgba(var(--color-primary-rgb), 0.3)' : 'none',
                                    transition: 'all 0.3s ease',
                                    cursor: (isCompleted || idx <= currentStep) ? 'pointer' : 'default'
                                }} onClick={() => {
                                    if (isCompleted || idx <= currentStep) {
                                        setViewingStep(idx);
                                    }
                                }}>
                                    {isCompleted && !isActive ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </div>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {step.title}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div style={{
                width: '100%',
                maxWidth: viewingStep === 0 ? '1200px' : '800px',
                transition: 'max-width 0.4s ease'
            }}>
                {viewingStep === 0 && <StepPlanSelection onComplete={() => handleStepComplete(1)} />}
                {viewingStep === 1 && <StepCreateStore onComplete={(tid: string) => handleStepComplete(2, { tiendaId: tid })} />}
                {viewingStep === 2 && <StepConnectMeta onComplete={() => handleStepComplete(3)} />}
                {viewingStep === 3 && <StepAssignAdAccounts tiendaId={tiendaId!} onComplete={() => handleStepComplete(4)} />}
                {viewingStep === 4 && <StepConnectShopify tiendaId={tiendaId!} onComplete={() => handleStepComplete(5 as any)} />}
            </div>

            {/* Footer / Meta Info */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    <Layout size={14} /> Progreso guardado automáticamente
                </p>
            </div>
        </div>
    );
}
