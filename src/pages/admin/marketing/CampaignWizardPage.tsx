/**
 * CampaignWizardPage.
 * Wizard para crear campañas de email paso a paso.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Input,
    Select,
    PageHeader,
    StepIndicator,
    Alert,
    Badge,
    EmptyState
} from '@/components/common';
import {
    ChevronRight,
    ChevronLeft,
    Send,
    Play,
    Check,
    Mail,
    Users,
    FileText
} from 'lucide-react';
import { createCampaign } from '@/services/marketingService';

export default function CampaignWizardPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        template_id: '',
        segment_id: '',
        scheduled_at: ''
    });

    const steps = [
        { id: 1, label: 'Identificación', icon: Mail },
        { id: 2, label: 'Diseño', icon: FileText },
        { id: 3, label: 'Audiencia', icon: Users },
        { id: 4, label: 'Confirmación', icon: Play }
    ];

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => prev - 1);

    const handleLaunch = async () => {
        await createCampaign(formData);
        navigate('/admin/marketing');
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <Card title="Paso 1: Información General">
                        <Input
                            label="Nombre Interno de la Campaña"
                            placeholder="Ej. Oferta Flash Abril"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ marginBottom: '20px' }}
                            helperText="Solo visible para administradores"
                        />
                        <Input
                            label="Asunto del Email (Subject)"
                            placeholder="¡No te pierdas de esta oportunidad!"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            style={{ marginBottom: '20px' }}
                            helperText="Asunto que verá el usuario en su bandeja"
                        />
                    </Card>
                );
            case 2:
                return (
                    <Card title="Paso 2: Seleccionar Plantilla">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {[1, 2, 3].map(id => (
                                <div
                                    key={id}
                                    onClick={() => setFormData({ ...formData, template_id: id.toString() })}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '2px solid',
                                        borderColor: formData.template_id === id.toString() ? 'var(--color-primary)' : 'var(--border-color)',
                                        backgroundColor: formData.template_id === id.toString() ? 'var(--color-primary)08' : 'var(--bg-primary)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 200ms ease'
                                    }}
                                >
                                    <div style={{
                                        height: '140px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FileText size={40} color="var(--text-tertiary)" />
                                    </div>
                                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                        Plantilla v{id}
                                    </h5>
                                </div>
                            ))}
                        </div>
                    </Card>
                );
            case 3:
                return (
                    <Card title="Paso 3: Target y Audiencia">
                        <Select
                            label="Seleccionar Lista Inteligente"
                            placeholder="Elegir una lista..."
                            value={formData.segment_id}
                            onChange={(e) => setFormData({ ...formData, segment_id: e.target.value })}
                            options={[
                                { value: 'seg-1', label: 'Clientes VIP Colombia (1,250)' },
                                { value: 'seg-2', label: 'Abandono Registro (340)' }
                            ]}
                        />
                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Users size={20} color="var(--color-primary)" />
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Resumen de Auditoría</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                El sistema enviará un total de 1,250 correos a un ritmo de 1 por cada 10 segundos. Tiempo total estimado: 3.4 horas.
                            </p>
                        </div>
                    </Card>
                );
            case 4:
                return (
                    <Card title="Paso 4: Confirmación y Lanzamiento">
                        <Alert variant="info" title="Revisión final" style={{ marginBottom: '24px' }}>
                            Por favor revisa que todos los detalles sean correctos antes de iniciar el envío masivo.
                        </Alert>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Nombre Campaña</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formData.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Asunto</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formData.subject}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Lista de Envío</span>
                                <Badge variant="primary">Segmento #{formData.segment_id}</Badge>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Plantilla</span>
                                <Badge variant="gray">Plantilla #{formData.template_id}</Badge>
                            </div>
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            <PageHeader
                title="Nueva Campaña de Email"
                subtitle="Sigue los pasos para configurar tu envío de marketing"
                onBack={() => navigate('/admin/marketing')}
            />

            <div style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
                <StepIndicator steps={steps} currentStep={step} style={{ marginBottom: '32px' }} />

                {renderStepContent()}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '32px',
                        paddingTop: '24px',
                        borderTop: '1px solid var(--border-color)'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handlePrev}
                        disabled={step === 1}
                        icon={ChevronLeft}
                    >
                        Anterior
                    </Button>

                    {step < steps.length ? (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={!formData.name || (step === 3 && !formData.segment_id)}
                            icon={ChevronRight}
                            iconPosition="right"
                        >
                            Siguiente
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleLaunch}
                            icon={Send}
                            iconPosition="right"
                        >
                            Lanzar Campaña
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
