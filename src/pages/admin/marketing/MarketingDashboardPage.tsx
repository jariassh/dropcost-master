import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail,
    Users,
    BarChart3,
    Plus,
    ChevronRight,
    Clock,
    Settings,
    Zap,
    History,
    FileText,
    CheckCircle2,
    XCircle,
    Send,
    Megaphone,
    Trash2,
    AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useMarketingStats, useMarketingCampaigns, useMarketingSegments, useDeleteSegment, useDeleteCampaign, useLaunchCampaign } from '@/hooks/useMarketing';
import { ConfirmDialog, useToast } from '@/components/common';
import { EmailCampaign, EmailSegment } from '@/types/marketing';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { EmailTemplatesManager } from '@/components/marketing/EmailTemplatesManager';
import { EmailTriggersManager } from '@/components/marketing/EmailTriggersManager';
import { GlobalEmailHistory } from '@/components/marketing/GlobalEmailHistory';

export default function MarketingDashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { tiendaActual } = useStoreStore();

    const [activeTab, setActiveTab] = useState('campaigns');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const toast = useToast();

    // Estados para lanzamiento de campaña
    const [campaignToLaunch, setCampaignToLaunch] = useState<EmailCampaign | null>(null);

    // Queries con React Query para Caché
    const { data: stats = {
        totalCampaigns: 0,
        totalEmailsSent: 0,
        avgSuccessRate: 0,
        activeSegments: 0,
        activeTriggers: 0,
        failedEmails: 0
    }, isLoading: isStatsLoading } = useMarketingStats(tiendaActual?.id || '', user?.id || '');

    const { data: campaigns = [], isLoading: isCampaignsLoading } = useMarketingCampaigns(tiendaActual?.id || '', user?.id || '');
    const { data: segments = [], isLoading: isSegmentsLoading } = useMarketingSegments(tiendaActual?.id || '', user?.id || '');
    const deleteSegmentMutation = useDeleteSegment();
    const deleteCampaignMutation = useDeleteCampaign();
    const launchCampaignMutation = useLaunchCampaign();

    const handleLaunchCampaign = async () => {
        if (!campaignToLaunch) return;

        try {
            await launchCampaignMutation.mutateAsync(campaignToLaunch.id);
            toast.success('Campaña enviada', 'La campaña se ha puesto en cola de procesamiento correctamente');
            setCampaignToLaunch(null);
        } catch (error: any) {
            console.error('Error launching campaign:', error);
            toast.error('Error al lanzar', error.message || 'Error al lanzar la campaña');
        }
    };

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string; type: 'segment' | 'campaign' }>({
        isOpen: false,
        id: '',
        name: '',
        type: 'segment'
    });

    const isLoading = isStatsLoading || isCampaignsLoading || isSegmentsLoading;

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;

        try {
            if (deleteModal.type === 'segment') {
                await deleteSegmentMutation.mutateAsync(deleteModal.id);
                toast.success('Lista eliminada', 'La lista inteligente se ha eliminado correctamente');
            } else {
                await deleteCampaignMutation.mutateAsync(deleteModal.id);
                toast.success('Campaña eliminada', 'La campaña se ha eliminado correctamente');
            }
            setDeleteModal({ isOpen: false, id: '', name: '', type: 'segment' });
        } catch (error: any) {
            console.error('Error deleting:', error);
            toast.error('Error al eliminar', error.message || 'Hubo un error al intentar eliminar');
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} color="var(--color-success)" />;
            case 'failed': return <XCircle size={16} color="var(--color-error)" />;
            case 'processing': return <Clock size={16} color="var(--color-primary)" className="animate-spin" />;
            default: return <Clock size={16} color="var(--text-tertiary)" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Borrador';
            case 'scheduled': return 'Programado';
            case 'processing': return 'Enviando...';
            case 'completed': return 'Finalizado';
            case 'failed': return 'Fallido';
            default: return status;
        }
    };
    const segmentsByTab = segments.reduce((acc: Record<string, EmailSegment[]>, s: EmailSegment) => {
        const tab = s.filters ? 'Smart List' : 'Static';
        if (!acc[tab]) acc[tab] = [];
        acc[tab].push(s);
        return acc;
    }, {} as Record<string, EmailSegment[]>);

    const handleDeleteSegment = async () => {
        try {
            await deleteSegmentMutation.mutateAsync(deleteModal.id);
            toast.success('Lista eliminada', `La lista "${deleteModal.name}" ha sido eliminada correctamente.`);
            // refetchSegments(); // This was commented out, keeping it that way.
            setDeleteModal({ ...deleteModal, isOpen: false });
        } catch (error) {
            console.error('Error al eliminar segmento:', error);
            toast.error('Error', 'No se pudo eliminar la lista. Inténtalo de nuevo.');
        }
    };
    const tabs = [
        { id: 'campaigns', label: 'Campañas', icon: Mail },
        { id: 'segments', label: 'Smart Lists', icon: Users },
        { id: 'templates', label: 'Plantillas', icon: FileText },
        { id: 'automation', label: 'Automatización', icon: Zap },
        { id: 'history', label: 'Historial Global', icon: History },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PageHeader
                title="Marketing Hub"
                icon={Megaphone as any}
                description="Gestiona tus campañas de email, automatizaciones y audiencias."
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="secondary" leftIcon={<Users size={18} />} onClick={() => navigate('/admin/marketing/new-list')}>
                            Nueva Lista
                        </Button>
                        <Button leftIcon={<Plus size={18} />} onClick={() => navigate('/admin/marketing/new-campaign')}>
                            Nueva Campaña
                        </Button>
                    </div>
                }
            />

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <StatsCard title="Campañas" value={stats.totalCampaigns} icon={<Mail color="var(--color-primary)" />} subtitle="+3 este mes" />
                <StatsCard title="Emails Enviados" value={stats.totalEmailsSent} icon={<Send color="#10B981" />} />
                <StatsCard title="Tasa Entrega" value={`${stats.avgSuccessRate}%`} icon={<BarChart3 color="#8B5CF6" />} />
                <StatsCard title="Listas Activas" value={stats.activeSegments} icon={<Users color="#F59E0B" />} />
            </div>

            {/* Main Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '2px',
                overflowX: 'auto',
                scrollbarWidth: 'none'
            }} className="no-scrollbar">
                {tabs.map(tab => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                borderRadius: '12px 12px 0 0',
                                border: 'none',
                                background: isActive ? 'var(--bg-secondary)' : 'transparent',
                                color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                                fontSize: '14px',
                                fontWeight: isActive ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent'
                            }}
                        >
                            <TabIcon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '400px' }}>
                {activeTab === 'campaigns' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isLoading ? (
                            <Card><div style={{ padding: '40px', textAlign: 'center' }}><Clock className="animate-spin" /></div></Card>
                        ) : campaigns.length === 0 ? (
                            <EmptyState
                                title="No hay campañas"
                                description="Crea tu primera campaña para empezar a enviar correos masivos."
                                icon={<Mail size={48} />}
                            />
                        ) : (
                            campaigns.map((campaign: EmailCampaign) => (
                                <Card key={campaign.id} hoverable>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        justifyContent: 'space-between',
                                        alignItems: isMobile ? 'flex-start' : 'center',
                                        gap: '16px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                backgroundColor: 'rgba(59,130,246,0.1)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Mail size={24} color="var(--color-primary)" />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{campaign.name}</h4>
                                                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {getStatusIcon(campaign.status)} {getStatusLabel(campaign.status)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Creada: {new Date(campaign.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {campaign.stats ? (
                                            <div style={{ display: 'flex', gap: '20px', textAlign: isMobile ? 'left' : 'right' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Total</p>
                                                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{campaign.stats.total}</p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Enviados</p>
                                                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>{campaign.stats.sent}</p>
                                                </div>
                                                <div style={{ display: isMobile ? 'none' : 'block' }}>
                                                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Fallos</p>
                                                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-error)' }}>{campaign.stats.failed}</p>
                                                </div>
                                                <Button variant="ghost" size="sm" leftIcon={<ChevronRight size={18} />} onClick={() => navigate(`/admin/marketing/${campaign.id}`)} />
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {campaign.status === 'draft' && (
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        leftIcon={<Send size={16} />}
                                                        onClick={() => setCampaignToLaunch(campaign)}
                                                    >
                                                        Enviar Ahora
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    style={{ color: 'var(--color-error)' }}
                                                    onClick={() => setDeleteModal({ isOpen: true, id: campaign.id, name: campaign.name, type: 'campaign' })}
                                                    leftIcon={<Trash2 size={16} />}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={<ChevronRight size={18} />}
                                                    onClick={() => navigate(`/admin/marketing/${campaign.id}`)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'segments' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 400px))',
                        gap: '24px',
                        justifyContent: 'start'
                    }}>
                        {segments.length === 0 ? (
                            <EmptyState
                                title="No hay listas"
                                description="Define filtros inteligentes para segmentar a tus usuarios."
                                icon={<Users size={48} />}
                            />
                        ) : (
                            segments.map((segment: any) => (
                                <Card key={segment.id} hoverable style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '12px',
                                                backgroundColor: 'var(--color-primary-light)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid var(--color-primary-shabow)'
                                            }}>
                                                <Users size={22} color="var(--color-primary)" />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {segment.name}
                                                </h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                                                        Refresco: {new Date(segment.updated_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="pill-info" style={{ fontSize: '12px', fontWeight: 800 }}>
                                            {segment.count || 0} USUARIOS
                                        </Badge>
                                    </div>

                                    <p style={{
                                        fontSize: '13px',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '20px',
                                        lineHeight: '1.5',
                                        height: '40px',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {segment.description || 'Sin descripción detallada.'}
                                    </p>

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            style={{ flex: 1, height: '36px', borderRadius: '10px' }}
                                            onClick={() => navigate(`/admin/marketing/list/${segment.id}`)}
                                        >
                                            Configurar Filtros
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteModal({ isOpen: true, id: segment.id, name: segment.name, type: 'segment' })}
                                            style={{ color: 'var(--color-error)', height: '36px', width: '36px', padding: 0 }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'templates' && (
                    <EmailTemplatesManager />
                )}

                {activeTab === 'automation' && (
                    <EmailTriggersManager />
                )}

                {activeTab === 'history' && (
                    <GlobalEmailHistory />
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteModal.isOpen}
                onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleDeleteConfirm}
                title={`Eliminar ${deleteModal.type === 'segment' ? 'Lista' : 'Campaña'}`}
                description={`¿Estás seguro de que deseas eliminar "${deleteModal.name}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                variant="danger"
                isLoading={deleteSegmentMutation.isPending || deleteCampaignMutation.isPending}
            />
            {/* Modal de Confirmación de Lanzamiento */}
            <ConfirmDialog
                isOpen={!!campaignToLaunch}
                onCancel={() => setCampaignToLaunch(null)}
                onConfirm={handleLaunchCampaign}
                title="Lanzar Campaña"
                description={`¿Estás seguro de que deseas enviar la campaña "${campaignToLaunch?.name}" ahora? Se enviará a todos los contactos del segmento seleccionado.`}
                confirmLabel={launchCampaignMutation.isPending ? "Lanzando..." : "Sí, Enviar Ahora"}
                cancelLabel="Cancelar"
                variant="info"
                isLoading={launchCampaignMutation.isPending}
            />
        </div>
    );
}
