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
    Megaphone
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useMarketingStats, useMarketingCampaigns, useMarketingSegments } from '@/hooks/useMarketing';
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

    const isLoading = isStatsLoading || isCampaignsLoading || isSegmentsLoading;

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

                                        {campaign.stats && (
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
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'segments' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                        {segments.length === 0 ? (
                            <EmptyState
                                title="No hay listas"
                                description="Define filtros inteligentes para segmentar a tus usuarios."
                                icon={<Users size={48} />}
                            />
                        ) : (
                            segments.map((segment: EmailSegment) => (
                                <Card key={segment.id} hoverable>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(0,102,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Users size={20} color="var(--color-primary)" />
                                        </div>
                                        <Badge variant="pill-secondary">{segment.count || 0} Miembros</Badge>
                                    </div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {segment.name}
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                                        {segment.description}
                                    </p>
                                    <Button variant="secondary" size="sm" fullWidth onClick={() => navigate(`/admin/marketing/list/${segment.id}`)}>
                                        Editar Filtros
                                    </Button>
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
        </div>
    );
}
