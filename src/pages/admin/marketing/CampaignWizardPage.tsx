/**
 * CampaignWizardPage.
 * Wizard paso a paso para configurar y lanzar una campaña de email marketing.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Input,
    Select,
    PageHeader,
    Badge
} from '@/components/common';
import {
    Mail,
    Users,
    ChevronRight,
    ChevronLeft,
    Send,
    Eye,
    Save,
    Layout,
    Clock
} from 'lucide-react';
import { createCampaign } from '@/services/marketingService';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { useMarketingSegments, useMarketingTemplates } from '@/hooks/useMarketing';

const STEPS = [
    { id: 'details', label: 'Información', icon: Mail },
    { id: 'audience', label: 'Audiencia', icon: Users },
    { id: 'template', label: 'Plantilla', icon: Layout },
    { id: 'confirm', label: 'Confirmación', icon: Send }
];

export default function CampaignWizardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { tiendaActual } = useStoreStore();

    const segmentsQuery = useMarketingSegments(tiendaActual?.id || '', user?.id || '');
    const templatesQuery = useMarketingTemplates();

    const segments = segmentsQuery.data || [];
    const templates = templatesQuery.data || [];

    const [step, setStep] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        segment_id: '',
        template_id: ''
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleNext = () => {
        if (step < STEPS.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
        else navigate('/admin/marketing');
    };

    const handleLaunch = async () => {
        if (!user || !tiendaActual) return;

        try {
            await createCampaign({
                name: formData.name,
                subject: formData.subject,
                segment_id: formData.segment_id,
                template_id: formData.template_id,
                tienda_id: tiendaActual.id,
                usuario_id: user.id,
                status: 'processing'
            });
            navigate('/admin/marketing');
        } catch (error) {
            console.error('Error al lanzar campaña:', error);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out', paddingBottom: '40px' }}>
            <PageHeader
                title="Configurar Campaña"
                description="Lanza una nueva campaña de correo para tus suscriptores"
                icon={Mail}
                actions={
                    <Button
                        variant="secondary"
                        onClick={handleBack}
                        leftIcon={<ChevronLeft size={18} />}
                        fullWidth={isMobile}
                    >
                        {step === 0 ? 'Cancelar' : 'Anterior'}
                    </Button>
                }
            />

            {/* Stepper */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '40px',
                position: 'relative',
                padding: isMobile ? '0' : '0 40px'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: isMobile ? '20px' : '60px',
                    right: isMobile ? '20px' : '60px',
                    height: '2px',
                    backgroundColor: 'var(--border-color)',
                    zIndex: 0
                }} />

                {STEPS.map((s, idx) => {
                    const isActive = idx === step;
                    const isCompleted = idx < step;
                    const Icon = s.icon;

                    return (
                        <div key={s.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            zIndex: 1,
                            position: 'relative',
                            flex: 1
                        }}>
                            <div style={{
                                width: isMobile ? '32px' : '40px',
                                height: isMobile ? '32px' : '40px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? 'var(--color-primary)' : isCompleted ? 'var(--color-success)' : 'var(--bg-secondary)',
                                color: isActive || isCompleted ? '#fff' : 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid',
                                borderColor: isActive ? 'var(--color-primary)' : isCompleted ? 'var(--color-success)' : 'var(--border-color)',
                                transition: 'all 300ms ease'
                            }}>
                                <Icon size={isMobile ? 16 : 20} />
                            </div>
                            {!isMobile && (
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)'
                                }}>
                                    {s.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: isMobile ? '0 4px' : '0'
            }}>
                <Card title={STEPS[step].label}>
                    {step === 0 && ( /* Paso 1: Detalles */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Input
                                label="Nombre de la Campaña (Interno)"
                                placeholder="Ej. Lanzamiento DropCost Pro"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <Input
                                label="Asunto del Correo (Lo que ve el usuario)"
                                placeholder="¡Potencia tu tienda de Dropshipping hoy!"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>
                    )}

                    {step === 1 && ( /* Paso 2: Audiencia */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Select
                                label="Seleccionar Lista Inteligente"
                                value={formData.segment_id}
                                onChange={(val) => setFormData({ ...formData, segment_id: val })}
                                options={segments.map(s => ({ value: s.id, label: `${s.name} (${s.count || 0})` }))}
                            />
                            <div style={{
                                padding: '16px',
                                backgroundColor: 'var(--color-primary)08',
                                borderRadius: '12px',
                                border: '1px solid var(--color-primary)20',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                flexDirection: isMobile ? 'column' : 'row',
                                textAlign: isMobile ? 'center' : 'left'
                            }}>
                                <Users size={24} color="var(--color-primary)" />
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        Audiencia Seleccionada: {segments.find(s => s.id === formData.segment_id)?.count || 0} usuarios
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                                        El envío se realizará de forma controlada (1 correo cada 10 segundos).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && ( /* Paso 3: Plantilla */
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: '16px'
                        }}>
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setFormData({ ...formData, template_id: t.id })}
                                    style={{
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: `2px solid ${formData.template_id === t.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: formData.template_id === t.id ? 'var(--color-primary)08' : 'transparent',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Layout size={32} color={formData.template_id === t.id ? 'var(--color-primary)' : 'var(--text-tertiary)'} style={{ margin: '0 auto' }} />
                                    <p style={{ marginTop: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 0 }}>{t.name}</p>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px' }}>
                                    No hay plantillas disponibles. Contacte al administrador.
                                </p>
                            )}
                        </div>
                    )}

                    {step === 3 && ( /* Paso 4: Confirmación */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                padding: isMobile ? '16px' : '24px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>Resumen de Campaña</h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                    gap: '16px'
                                }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Campaña</p>
                                        <p style={{ fontWeight: 600 }}>{formData.name || 'Sin nombre'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Audiencia</p>
                                        <p style={{ fontWeight: 600 }}>{segments.find(s => s.id === formData.segment_id)?.name || 'Sin audiencia'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Plantilla</p>
                                        <p style={{ fontWeight: 600 }}>{templates.find(t => t.id === formData.template_id)?.name || 'No seleccionada'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Velocidad</p>
                                        <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>1 email / 10s</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <Button variant="secondary" fullWidth leftIcon={<Eye size={18} />}>Vista Previa</Button>
                                <Button variant="secondary" fullWidth leftIcon={<Save size={18} />}>Guardar Borrador</Button>
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '32px',
                        gap: '12px',
                        flexDirection: isMobile ? 'column' : 'row'
                    }}>
                        {step < STEPS.length - 1 ? (
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                rightIcon={<ChevronRight size={18} />}
                                fullWidth={isMobile}
                            >
                                Siguiente
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleLaunch}
                                leftIcon={<Send size={18} />}
                                fullWidth={isMobile}
                            >
                                Lanzar Campaña
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
