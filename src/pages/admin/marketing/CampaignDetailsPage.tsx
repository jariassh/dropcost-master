import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Clock, Send, CheckCircle2, XCircle, Users, FileText, Trash2, Settings } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatsCard } from '@/components/common/StatsCard';
import { useCampaignDetails, useCampaignLogs, useDeleteCampaign, useLaunchCampaign } from '@/hooks/useMarketing';
import { useToast, ConfirmDialog, Spinner } from '@/components/common';

const tableHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '13px',
    color: 'var(--text-primary)'
};


export default function CampaignDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [isDeletingModalOpen, setIsDeletingModalOpen] = React.useState(false);
    const [isLaunchingModalOpen, setIsLaunchingModalOpen] = React.useState(false);

    const { data: campaignData, isLoading: isCampaignLoading } = useCampaignDetails(id || '');
    const campaign = campaignData as any;
    const { data: logsData = [], isLoading: isLogsLoading } = useCampaignLogs(id || '');
    const logs = logsData as any[];
    const deleteCampaignMutation = useDeleteCampaign();
    const launchCampaignMutation = useLaunchCampaign();

    const handleLaunch = async () => {
        try {
            await launchCampaignMutation.mutateAsync(id || '');
            toast.success('Campaña enviada', 'La campaña se ha puesto en cola de procesamiento correctamente.');
            setIsLaunchingModalOpen(false);
        } catch (error: any) {
            toast.error('Error al lanzar', error.message || 'No se pudo lanzar la campaña.');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCampaignMutation.mutateAsync(id || '');
            toast.success('Campaña eliminada', 'La campaña ha sido eliminada correctamente.');
            navigate('/admin/marketing');
        } catch (error: any) {
            toast.error('Error al eliminar', error.message || 'No se pudo eliminar la campaña.');
        }
    };

    if (isCampaignLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando detalles...</div>;
    }

    if (!campaign) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Clock size={48} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                <h3>Campaña no encontrada</h3>
                <Button variant="ghost" onClick={() => navigate('/admin/marketing')}>Volver al Dashboard</Button>
            </div>
        );
    }

    const sent = logs.filter(l => l.status === 'sent').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const pending = logs.filter(l => l.status === 'pending').length;
    const totalSegment = logs.length > 0 ? logs.length : (campaign.segment?.count || 0);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/marketing')} leftIcon={<ArrowLeft size={16} />}>
                    Volver
                </Button>
            </div>
            <PageHeader
                title={campaign.name || 'Campaña'}
                description={`Campaña creada el ${new Date(campaign.created_at).toLocaleDateString()}`}
                icon={Mail}
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {campaign.status === 'draft' && (
                            <Button
                                variant="primary"
                                leftIcon={<Send size={18} />}
                                onClick={() => setIsLaunchingModalOpen(true)}
                            >
                                Enviar Ahora
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            style={{ color: 'var(--color-error)' }}
                            leftIcon={<Trash2 size={18} />}
                            onClick={() => setIsDeletingModalOpen(true)}
                        >
                            Eliminar
                        </Button>
                    </div>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <StatsCard title="Total Segmento" value={totalSegment} icon={<Users color="#8B5CF6" />} />
                <StatsCard title="Enviados" value={sent} icon={<CheckCircle2 color="#10B981" />} />
                <StatsCard title="Fallidos" value={failed} icon={<XCircle color="#EF4444" />} />
                <StatsCard title="En Cola" value={pending} icon={<Clock color="#F59E0B" />} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Historial de Envíos</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Seguimiento detallado de cada correo procesado.</p>
                        </div>
                    </div>

                    <Card noPadding style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                        {isLogsLoading ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}><Spinner /></div>
                        ) : logs.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <Mail size={40} color="var(--text-tertiary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px' }}>No hay envíos registrados aún.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={tableHeaderStyle}>Destinatario</th>
                                            <th style={tableHeaderStyle}>Estado</th>
                                            <th style={tableHeaderStyle}>Fecha y Hora</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                                        {logs.map((log: any) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                                                            {log.user ? `${log.user.nombres || ''} ${log.user.apellidos || ''}`.trim() || log.email : 'Contacto'}
                                                        </span>
                                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{log.email}</span>
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <Badge variant={log.status === 'sent' ? 'pill-success' : log.status === 'failed' ? 'pill-error' : 'pill-secondary'}>
                                                        {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'Fallido' : log.status}
                                                    </Badge>
                                                    {log.error_message && (
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--color-error)' }}>{log.error_message}</p>
                                                    )}
                                                </td>
                                                <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                                                    {new Date(log.created_at).toLocaleString('es-CO', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit', hour12: true
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card title="Configuración" icon={<Settings size={18} />}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>Estado</label>
                                <Badge variant={campaign.status === 'completed' ? 'pill-success' : campaign.status === 'draft' ? 'pill-info' : 'pill-warning'}>
                                    {campaign.status === 'completed' ? 'Finalizada' : campaign.status === 'draft' ? 'Borrador' : 'Enviando'}
                                </Badge>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>Segmento</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={16} color="var(--color-primary)" />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{campaign.segment?.name || 'Lista Desconocida'}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Plantilla Original</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} color="var(--color-primary)" />
                                    <span style={{ fontSize: '14px' }}>ID: {campaign.template_id}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Asunto configurado">
                        <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic' }}>"{campaign.subject}"</p>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeletingModalOpen}
                onCancel={() => setIsDeletingModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Campaña"
                description="¿Estás seguro de eliminar esta campaña y todos sus reportes? Esta acción es irreversible."
                confirmLabel="Sí, eliminar"
                variant="danger"
                isLoading={deleteCampaignMutation.isPending}
            />

            <ConfirmDialog
                isOpen={isLaunchingModalOpen}
                onCancel={() => setIsLaunchingModalOpen(false)}
                onConfirm={handleLaunch}
                title="Lanzar Campaña"
                description={`¿Estás seguro de enviar la campaña "${campaign.name}" ahora? Se enviará a todos los contactos del segmento.`}
                confirmLabel="Sí, enviar ahora"
                variant="info"
                isLoading={launchCampaignMutation.isPending}
            />
        </div>
    );
}
