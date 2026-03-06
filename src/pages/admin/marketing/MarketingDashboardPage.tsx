/**
 * MarketingDashboardPage.
 * Vista principal para gestionar Campañas, Listas y Plantillas.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Badge,
    StatsCard,
    PageHeader,
    EmptyState,
    Tabs
} from '@/components/common';
import {
    Mail,
    Users,
    FileText,
    Plus,
    Play,
    CheckCircle2,
    AlertCircle,
    Clock,
    BarChart3
} from 'lucide-react';
import { getCampaigns, getSegments } from '@/services/marketingService';
import { EmailCampaign, EmailSegment } from '@/types/marketing';

export default function MarketingDashboardPage() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [segments, setSegments] = useState<EmailSegment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [c, s] = await Promise.all([getCampaigns(), getSegments()]);
                setCampaigns(c);
                setSegments(s);
            } catch (error) {
                console.error('Error cargando dashboard marketing:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} color="var(--color-success)" />;
            case 'processing': return <Play size={16} className="animate-pulse" color="var(--color-primary)" />;
            case 'failed': return <AlertCircle size={16} color="var(--color-error)" />;
            default: return <Clock size={16} color="var(--text-tertiary)" />;
        }
    };

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            <PageHeader
                title="Email Marketing"
                subtitle="Gestiona tus listas inteligentes y campañas automatizadas"
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/admin/marketing/new-list')}
                            icon={Plus}
                        >
                            Nueva Lista
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/admin/marketing/new-campaign')}
                            icon={Mail}
                        >
                            Crear Campaña
                        </Button>
                    </div>
                }
            />

            {/* Métricas del Dashboard */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}
            >
                <StatsCard
                    title="Envíos Totales"
                    value="15.4K"
                    icon={Mail}
                    trend={{ value: '12%', isPositive: true }}
                />
                <StatsCard
                    title="Tasa de Éxito"
                    value="98.2%"
                    icon={CheckCircle2}
                    trend={{ value: '0.5%', isPositive: true }}
                />
                <StatsCard
                    title="Listas Inteligentes"
                    value={segments.length.toString()}
                    icon={Users}
                />
                <StatsCard
                    title="Campañas Activas"
                    value={campaigns.filter(c => c.status === 'processing').length.toString()}
                    icon={Play}
                />
            </div>

            <Tabs
                tabs={[
                    { id: 'campaigns', label: 'Campañas Recientes', icon: Mail },
                    { id: 'segments', label: 'Listas Inteligentes', icon: Users },
                    { id: 'templates', label: 'Plantillas', icon: FileText }
                ]}
                renderContent={(activeTab) => {
                    if (activeTab === 'campaigns') {
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {campaigns.length === 0 ? (
                                    <EmptyState title="No hay campañas" description="Crea tu primera campaña para empezar a enviar correos." />
                                ) : (
                                    campaigns.map(campaign => (
                                        <Card key={campaign.id} hoverable>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        {getStatusIcon(campaign.status)}
                                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                            {campaign.name}
                                                        </h4>
                                                        <Badge variant={campaign.status === 'completed' ? 'success' : campaign.status === 'processing' ? 'primary' : 'gray'}>
                                                            {campaign.status}
                                                        </Badge>
                                                    </div>
                                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                                                        {campaign.subject}
                                                    </p>
                                                </div>

                                                {campaign.stats && (
                                                    <div style={{ width: '240px', marginLeft: '32px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                                            <span style={{ color: 'var(--text-secondary)' }}>Progreso de envío</span>
                                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {Math.round((campaign.stats.sent / campaign.stats.total) * 100)}%
                                                            </span>
                                                        </div>
                                                        <div style={{
                                                            height: '8px',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            borderRadius: '4px',
                                                            overflow: 'hidden',
                                                            display: 'flex'
                                                        }}>
                                                            <div style={{
                                                                width: `${(campaign.stats.sent / campaign.stats.total) * 100}%`,
                                                                backgroundColor: 'var(--color-success)',
                                                                transition: 'width 0.5s ease'
                                                            }} />
                                                            <div style={{
                                                                width: `${(campaign.stats.failed / campaign.stats.total) * 100}%`,
                                                                backgroundColor: 'var(--color-error)'
                                                            }} />
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{campaign.stats.sent}</span> Éxitos
                                                            </span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                                <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>{campaign.stats.failed}</span> Fallos
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        );
                    }

                    if (activeTab === 'segments') {
                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                                {segments.length === 0 ? (
                                    <EmptyState title="No hay listas" description="Define filtros inteligentes para segmentar a tus usuarios." />
                                ) : (
                                    segments.map(segment => (
                                        <Card key={segment.id} hoverable>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary)12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={20} color="var(--color-primary)" />
                                                </div>
                                                <Badge variant="gray">{segment.count} Miembros</Badge>
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
                        );
                    }

                    return (
                        <Card>
                            <EmptyState
                                title="Plantillas de Email"
                                description="Esta sección te permite gestionar el diseño HTML de tus correos."
                                icon={FileText}
                            />
                        </Card>
                    );
                }}
            />
        </div>
    );
}
