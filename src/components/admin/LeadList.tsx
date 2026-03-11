import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight, MessageSquare, Trash2, Calendar, User, Hash, RefreshCcw } from 'lucide-react';
import { leadService, Lead } from '../../services/leadService';
import { Button, Spinner, Card } from '../common';
import { LeadDetailsSlideOver } from './LeadDetailsSlideOver';

export const LeadList: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

    useEffect(() => {
        loadLeads();
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header / Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                            <User size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Total Leads Únicos</div>
                            <div style={{ fontSize: '28px', fontWeight: 800 }}>{leads.length}</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Conversaciones Totales</div>
                            <div style={{ fontSize: '28px', fontWeight: 800 }}>
                                {leads.reduce((acc, current) => acc + countSessions(current.conversacion), 0)}
                            </div>
                        </div>
                    </div>
                </Card>
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
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '12px',
                                                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 700, fontSize: '16px'
                                            }}>
                                                {(lead.nombre || 'U').charAt(0).toUpperCase()}
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
};
