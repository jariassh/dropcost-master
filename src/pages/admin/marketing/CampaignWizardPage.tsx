import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Users,
    ChevronRight,
    ChevronLeft,
    Send,
    Layout,
    CheckCircle2,
    Settings,
    Eye,
    Search,
    ArrowLeft,
    Info,
    Check
} from 'lucide-react';
import {
    Card,
    Button,
    Input,
    Select,
    PageHeader,
    Badge,
    useToast,
    Spinner,
    Modal
} from '@/components/common';
import { EmailPreview } from '@/components/marketing/EmailPreview';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import {
    useMarketingSegments,
    useMarketingTemplates,
    useCreateCampaign
} from '@/hooks/useMarketing';
import { EmailCampaign, EmailTemplate } from '@/types/marketing';

type WizardStep = 'content' | 'setup' | 'review';

export default function CampaignWizardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { tiendaActual } = useStoreStore();
    const toast = useToast();

    // Data fetching (Global para Admin)
    const { data: segments = [], isLoading: isLoadingSegments } = useMarketingSegments(undefined, user?.id || '');
    const { data: templates = [], isLoading: isLoadingTemplates } = useMarketingTemplates();

    // State
    const [step, setStep] = useState<WizardStep>('content');
    const [searchTerm, setSearchTerm] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const createCampaignMutation = useCreateCampaign();

    const [campaignData, setCampaignData] = useState<Partial<EmailCampaign>>({
        name: '',
        subject: '',
        segment_id: '',
        template_id: '',
        sender_name: '',
        sender_prefix: ''
    });

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isStepValid = () => {
        if (step === 'content') return campaignData.template_id;
        if (step === 'setup') return campaignData.name && campaignData.subject && campaignData.segment_id && campaignData.sender_prefix;
        return true;
    };

    const handleNext = () => {
        if (step === 'content') setStep('setup');
        else if (step === 'setup') setStep('review');
    };

    const handleBack = () => {
        if (step === 'setup') setStep('content');
        else if (step === 'review') setStep('setup');
    };

    const handleFinish = async () => {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        if (!user || (!isAdmin && !tiendaActual)) return;

        try {
            // Limpiamos los campos vacíos antes de enviar
            const dataToSave = {
                name: campaignData.name as string,
                subject: campaignData.subject as string,
                segment_id: campaignData.segment_id as string,
                template_id: campaignData.template_id as string,
                sender_name: campaignData.sender_name,
                sender_prefix: campaignData.sender_prefix,
                tienda_id: tiendaActual?.id || null,
                usuario_id: user.id,
                created_by: user.id,
                status: 'draft' as const
            };

            await createCampaignMutation.mutateAsync(dataToSave);
            toast.success('Campaña creada', 'La campaña se ha creado correctamente como borrador.');
            navigate('/admin/marketing');
        } catch (error) {
            console.error('Error creating campaign:', error);
            toast.error('Error', 'No se pudo crear la campaña. Inténtalo de nuevo.');
        }
    };

    const steps = [
        { id: 'content', label: 'Elegir Plantilla', icon: Layout },
        { id: 'setup', label: 'Configuración', icon: Settings },
        { id: 'review', label: 'Revisión', icon: CheckCircle2 }
    ];

    const selectedTemplate = templates.find(t => t.id === campaignData.template_id);
    const selectedSegment = segments.find(s => s.id === campaignData.segment_id);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            <PageHeader
                title="Nueva Campaña de Email"
                icon={Mail as any}
                description="Selecciona una plantilla y configura los detalles de tu envío."
                actions={
                    <Button variant="secondary" onClick={() => navigate('/admin/marketing')} leftIcon={<ArrowLeft size={18} />}>
                        Volver
                    </Button>
                }
            />

            {/* Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 80px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', left: '120px', right: '120px', height: '2px', background: 'var(--border-color)', zIndex: 0 }} />
                {steps.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isDone = steps.findIndex(x => x.id === step) > idx;
                    return (
                        <div key={s.id} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--card-bg)',
                                border: `2px solid ${isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                color: isDone || isActive ? '#fff' : 'var(--text-tertiary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease'
                            }}>
                                {isDone ? <Check size={20} /> : <Icon size={20} />}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{s.label}</span>
                        </div>
                    );
                })}
            </div>

            <Card style={{ padding: 0, overflow: 'hidden' }}>
                {step === 'content' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Mis Plantillas</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>Usa una plantilla existente como base para tu campaña.</p>
                            </div>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    placeholder="Buscar por nombre o asunto..."
                                    style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '12px' }}>
                            {isLoadingTemplates ? (
                                <div style={{ padding: '60px', textAlign: 'center' }}><Spinner /></div>
                            ) : filteredTemplates.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No se encontraron plantillas.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase' }}>
                                            <th style={{ padding: '0 20px 8px 20px' }}>Nombre</th>
                                            <th style={{ padding: '0 20px 8px 20px' }}>Asunto por Defecto</th>
                                            <th style={{ padding: '0 20px 8px 20px', width: '120px', textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTemplates.map(tmp => (
                                            <tr
                                                key={tmp.id}
                                                onClick={() => {
                                                    setCampaignData({
                                                        ...campaignData,
                                                        template_id: tmp.id,
                                                        subject: tmp.subject || '',
                                                        sender_name: tmp.sender_name || tiendaActual?.nombre || '',
                                                        sender_prefix: tmp.sender_prefix || 'contacto'
                                                    });
                                                }}
                                                style={{
                                                    background: campaignData.template_id === tmp.id ? 'var(--color-primary)' : 'var(--bg-primary)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    borderRadius: '12px',
                                                    color: campaignData.template_id === tmp.id ? '#ffffff' : 'var(--text-primary)'
                                                }}
                                            >
                                                <td style={{ padding: '16px 20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '8px',
                                                            background: campaignData.template_id === tmp.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Layout size={18} color={campaignData.template_id === tmp.id ? '#ffffff' : 'var(--color-primary)'} />
                                                        </div>
                                                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'inherit' }}>{tmp.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        color: campaignData.template_id === tmp.id
                                                            ? 'rgba(255,255,255,0.9)'
                                                            : (tmp.subject ? 'var(--text-tertiary)' : 'var(--color-warning)')
                                                    }}>
                                                        {tmp.subject || '(Sin asunto configurado)'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewTemplate(tmp);
                                                            }}
                                                            style={{
                                                                height: '36px',
                                                                width: '36px',
                                                                padding: 0,
                                                                borderRadius: '10px',
                                                                backgroundColor: campaignData.template_id === tmp.id ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)',
                                                                border: campaignData.template_id === tmp.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--border-color)',
                                                                color: campaignData.template_id === tmp.id ? '#ffffff' : 'var(--text-primary)',
                                                                boxShadow: 'none'
                                                            }}
                                                            title="Ver Previa"
                                                        >
                                                            <Eye size={18} />
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setCampaignData({
                                                                    ...campaignData,
                                                                    template_id: tmp.id,
                                                                    subject: tmp.subject || '',
                                                                    sender_name: tmp.sender_name || tiendaActual?.nombre || '',
                                                                    sender_prefix: tmp.sender_prefix || 'contacto'
                                                                });
                                                            }}
                                                            style={{
                                                                height: '36px',
                                                                width: '36px',
                                                                padding: 0,
                                                                borderRadius: '10px',
                                                                backgroundColor: campaignData.template_id === tmp.id ? '#ffffff' : 'var(--bg-secondary)',
                                                                border: campaignData.template_id === tmp.id ? 'none' : '1px solid var(--border-color)',
                                                                color: campaignData.template_id === tmp.id ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                                                boxShadow: 'none'
                                                            }}
                                                            title={campaignData.template_id === tmp.id ? 'Seleccionada' : 'Seleccionar'}
                                                        >
                                                            <Check size={18} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {step === 'setup' && (
                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Configuración de la Campaña</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>Define los parámetros técnicos del envío.</p>
                                </div>

                                <Input label="Nombre Interno" value={campaignData.name || ''} onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })} />
                                <Input label="Asunto del Email" value={campaignData.subject || ''} onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })} />

                                <Select
                                    label="Audiencia (Lista Inteligente)"
                                    value={campaignData.segment_id || ''}
                                    onChange={(val) => setCampaignData({ ...campaignData, segment_id: val })}
                                    options={segments.map(s => ({ value: s.id, label: `${s.name} (${s.count || 0} personas)` }))}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Remitente</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>¿Quién envía este correo?</p>
                                </div>

                                <Input label="Nombre a mostrar" value={campaignData.sender_name || ''} onChange={(e) => setCampaignData({ ...campaignData, sender_name: e.target.value })} />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Correo de salida</label>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <input
                                            style={{ border: 'none', background: 'transparent', padding: '10px 12px', outline: 'none', textAlign: 'right', fontWeight: 700, fontSize: '14px', width: '120px' }}
                                            value={campaignData.sender_prefix || ''}
                                            onChange={(e) => setCampaignData({ ...campaignData, sender_prefix: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                                        />
                                        <div style={{ padding: '0 12px', background: 'var(--bg-tertiary)', alignSelf: 'stretch', display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-tertiary)', borderLeft: '1px solid var(--border-color)' }}>
                                            @dropcost.com
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Los usuarios verán: {campaignData.sender_name} &lt;{campaignData.sender_prefix}@dropcost.com&gt;</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'review' && (
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Resumen de Envío</h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>Revisa todo antes de crear el borrador final.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                <Badge variant="pill-info" style={{ marginBottom: '16px' }}>Detalles del Email</Badge>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)' }}>ASUNTO</p>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{campaignData.subject}</p>
                                    </div>
                                    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px' }}>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)' }}>REMITENTE</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{campaignData.sender_name} <span style={{ color: 'var(--color-primary)' }}>&lt;{campaignData.sender_prefix}@dropcost.com&gt;</span></p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                <Badge variant="pill-success" style={{ marginBottom: '16px' }}>Audiencia y Diseño</Badge>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Users size={16} color="var(--color-success)" />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)' }}>LISTA SMART</p>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{selectedSegment?.name} ({selectedSegment?.count || 0} usuarios)</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Layout size={16} color="var(--color-primary)" />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)' }}>ESTILO</p>
                                            <p style={{ margin: 0, fontWeight: 600 }}>{selectedTemplate?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--color-info-light)', border: '1px solid var(--color-info-shabow)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Info size={20} color="var(--color-info)" />
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-info)', fontWeight: 500 }}>
                                Al confirmar, la campaña se guardará como <b>Borrador</b>. Podrás realizar una prueba final de envío antes de programarla.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer buttons */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
                    <Button
                        variant="secondary"
                        leftIcon={<ChevronLeft size={18} />}
                        onClick={step === 'content' ? () => navigate('/admin/marketing') : handleBack}
                        disabled={createCampaignMutation.isPending}
                    >
                        {step === 'content' ? 'Cancelar' : 'Atrás'}
                    </Button>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {step === 'review' ? (
                            <Button
                                variant="primary"
                                leftIcon={<Send size={18} />}
                                onClick={handleFinish}
                                isLoading={createCampaignMutation.isPending}
                            >
                                Crear Borrador de Campaña
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                rightIcon={<ChevronRight size={18} />}
                                onClick={handleNext}
                                disabled={!isStepValid()}
                            >
                                Siguiente: {step === 'content' ? 'Configuración' : 'Revisión'}
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Modal de Previsualización */}
            <Modal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                title={`Previsualización: ${previewTemplate?.name}`}
                size="xl"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {previewTemplate && (
                        <EmailPreview
                            template={previewTemplate}
                            device="pc"
                        />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>Cerrar</Button>
                        <Button variant="primary" onClick={() => {
                            if (previewTemplate) {
                                setCampaignData({
                                    ...campaignData,
                                    template_id: previewTemplate.id,
                                    subject: previewTemplate.subject || '',
                                    sender_name: previewTemplate.sender_name || tiendaActual?.nombre || '',
                                    sender_prefix: previewTemplate.sender_prefix || 'contacto'
                                });
                                setPreviewTemplate(null);
                            }
                        }}>Usar esta Plantilla</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
