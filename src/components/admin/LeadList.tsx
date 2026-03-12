import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Search, Filter, ChevronRight, MessageSquare, Trash2, Calendar, User, Hash, RefreshCcw, Zap, Brain, CheckCircle, TrendingUp } from 'lucide-react';
import { leadService, Lead } from '../../services/leadService';
import { Button, Spinner, Card } from '../common';
import { LeadDetailsSlideOver } from './LeadDetailsSlideOver';

interface LeadListProps {
    period: 'today' | '7d' | '30d' | 'all';
}

export const LeadList = forwardRef<{ refresh: () => void }, LeadListProps>(({ period }, ref) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [registeredEmails, setRegisteredEmails] = useState<string[]>([]);

    useEffect(() => {
        loadLeads();
        loadRegisteredEmails();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await leadService.getLeads();
            setLeads(data);
        } catch (error) {
            console.error("Error loading leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadRegisteredEmails = async () => {
        try {
            const emails = await leadService.getRegisteredEmails();
            setRegisteredEmails(emails);
        } catch (error) {
            console.error("Error loading registered emails:", error);
        }
    };

    const isConverted = (lead: Lead): boolean => {
        return registeredEmails.includes(lead.email?.toLowerCase());
    };

    const countSessions = (conversacion: any[]): number => {
        if (!Array.isArray(conversacion)) return 0;
        const actualMessages = conversacion.filter(m => m.role === 'user' || m.role === 'assistant');
        if (actualMessages.length === 0) return 0;

        let sessions = 1;
        const thirtyMinutes = 30 * 60 * 1000;
        let lastTime = actualMessages[0].timestamp ? new Date(actualMessages[0].timestamp).getTime() : 0;

        actualMessages.forEach((msg) => {
            const currentTime = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;
            if (lastTime && (currentTime - lastTime) > thirtyMinutes && currentTime > 0) {
                sessions++;
            }
            if (currentTime > 0) lastTime = currentTime;
        });

        return sessions;
    };

    const calculateTotalMessages = (leads: Lead[]): number => {
        return leads.reduce((acc, lead) => {
            const conv = lead.conversacion || [];
            return acc + conv.filter((m: any) => m.role === 'user' || m.role === 'assistant').length;
        }, 0);
    };

    const calculateGeminiTokens = (leads: Lead[]): { total: number, hasEstimated: boolean } => {
        let total = 0;
        let hasEstimated = false;
        leads.forEach(lead => {
            (lead.conversacion || []).forEach((msg: any) => {
                if (msg.ai_stats?.gemini) {
                    total += (msg.ai_stats.gemini.total ?? 0);
                    if (msg.ai_stats.estimated) hasEstimated = true;
                }
            });
        });
        return { total, hasEstimated };
    };

    const calculateOllamaTokens = (leads: Lead[]): number => {
        return leads.reduce((acc, lead) => {
            return acc + (lead.conversacion || []).reduce((msgAcc: number, msg: any) => {
                if (msg.ai_stats?.ollama) {
                    return msgAcc + (msg.ai_stats.ollama.total ?? 0);
                }
                return msgAcc;
            }, 0);
        }, 0);
    };

    const filteredLeads = leads.filter(l =>
        (l.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.telefono || '').includes(search)
    );

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de eliminar este lead?')) {
            try {
                await leadService.deleteLead(id);
                setLeads(leads.filter(l => l.id !== id));
            } catch (error) {
                alert('Error al eliminar');
            }
        }
    };

    useImperativeHandle(ref, () => ({
        refresh: loadLeads,
        loading: loading
    }));


    const getFilteredLeads = (): Lead[] => {
        if (period === 'all') return leads;
        const now = new Date();
        const cutoff = new Date();
        if (period === 'today') cutoff.setHours(0, 0, 0, 0);
        else if (period === '7d') cutoff.setDate(now.getDate() - 7);
        else if (period === '30d') cutoff.setDate(now.getDate() - 30);
        return leads.filter(l => new Date(l.created_at) >= cutoff);
    };

    const filteredByPeriod = getFilteredLeads();
    const formatPremiumNumber = (num: number): string => {
        if (num < 10000) return num.toLocaleString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        return (num / 1000000).toFixed(2) + 'M';
    };

    const periodConversions = filteredByPeriod.filter(isConverted).length;
    const periodConversionRate = filteredByPeriod.length > 0 ? ((periodConversions / filteredByPeriod.length) * 100).toFixed(1) : '0.0';
    const periodGemini = calculateGeminiTokens(filteredByPeriod);
    const periodOllama = calculateOllamaTokens(filteredByPeriod);

    const kpiCards = [
        { title: 'Total Leads', value: formatPremiumNumber(filteredByPeriod.length), icon: User, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
        { title: 'Mensajes Totales', value: formatPremiumNumber(calculateTotalMessages(filteredByPeriod)), icon: MessageSquare, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { title: 'Conversiones', value: formatPremiumNumber(periodConversions), icon: CheckCircle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { title: 'Tokens Gemini', value: `${periodGemini.hasEstimated ? '~' : ''}${formatPremiumNumber(periodGemini.total)}`, icon: Zap, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' },
        { title: 'Tokens Ollama', value: formatPremiumNumber(periodOllama), icon: Brain, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        { title: 'Tasa Conversión', value: `${periodConversionRate}%`, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KPIs */}
            <div className="kpi-grid">
                {kpiCards.map((card, index) => (
                    <div key={card.title} style={{ animation: 'slideUp 0.5s ease-out forwards', opacity: 0, animationDelay: `${index * 0.08}s` }}>
                        <Card hoverable style={{ height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)',
                                        margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em',
                                        marginBottom: '4px'
                                    }}>
                                        {card.title}
                                    </p>
                                    <h3 style={{
                                        fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)',
                                        margin: 0, letterSpacing: '-0.02em',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {card.value}
                                    </h3>
                                </div>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    backgroundColor: card.bg, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    boxShadow: `0 8px 16px -4px ${card.color}20`
                                }}>
                                    <card.icon size={26} style={{ color: card.color }} />
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            {/* List Table */}
            <Card noPadding>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ position: 'relative', maxWidth: '450px', width: '100%' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px 12px 48px',
                                borderRadius: '12px', border: '1.5px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                                fontSize: '14px', outline: 'none', transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366F1'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="secondary" leftIcon={<RefreshCcw size={18} />} onClick={loadLeads} isLoading={loading}>
                            Actualizar
                        </Button>
                        <Button variant="secondary" leftIcon={<Filter size={18} />}>Filtros</Button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visitante</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>País</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sesiones</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Actividad</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <Spinner />
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No se encontraron leads registrados.</td>
                                </tr>
                            ) : filteredLeads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    onClick={() => {
                                        setSelectedLead(lead);
                                        setIsSlideOverOpen(true);
                                    }}
                                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontWeight: 700, fontSize: '16px'
                                                }}>
                                                    {(lead.nombre || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                {isConverted(lead) && (
                                                    <div style={{
                                                        position: 'absolute', bottom: '-3px', right: '-3px',
                                                        width: '18px', height: '18px', borderRadius: '50%',
                                                        backgroundColor: '#22c55e', border: '2px solid var(--bg-primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <CheckCircle size={11} style={{ color: 'white' }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{lead.nombre || 'Sin nombre'}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{lead.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{lead.telefono}</div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {lead.pais ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img
                                                    src={`https://flagcdn.com/w40/${lead.pais.toLowerCase()}.png`}
                                                    alt={lead.pais}
                                                    style={{ width: '22px', height: '15px', borderRadius: '3px', objectFit: 'cover', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                                />
                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{lead.pais}</span>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#6366F1', fontSize: '13px', fontWeight: 700 }}>
                                            <Hash size={14} /> {countSessions(lead.conversacion)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '-'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '20px' }}>
                                                {lead.updated_at ? new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            <button
                                                onClick={(e) => handleDelete(e, lead.id)}
                                                style={{ padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                title="Eliminar Lead"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div style={{ padding: '10px', color: 'var(--text-tertiary)' }}>
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <LeadDetailsSlideOver
                lead={selectedLead}
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
            />
        </div>
    );
});

