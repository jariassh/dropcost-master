import React, { useState } from 'react';
import { X, User, Bot, Calendar, MessageSquare, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { SlideOver, Card } from '../common';
import { Lead } from '@/services/leadService';

interface LeadDetailsSlideOverProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
}

interface ChatSession {
    id: number;
    messages: any[];
    startTime: string;
}

export const LeadDetailsSlideOver: React.FC<LeadDetailsSlideOverProps> = ({ lead, isOpen, onClose }) => {
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

    if (!lead) return null;

    // Lógica para agrupar mensajes por sesiones (gap > 30 min)
    const getSessions = (conversacion: any[]): ChatSession[] => {
        if (!Array.isArray(conversacion)) return [];

        const sessions: ChatSession[] = [];
        let currentMessages: any[] = [];
        let lastTime: number | null = null;
        const thirtyMinutes = 30 * 60 * 1000;

        // Filtrar mensajes de sistema y metadatos
        const actualMessages = conversacion.filter(m => m.role === 'user' || m.role === 'assistant');

        actualMessages.forEach((msg, idx) => {
            const currentTime = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;

            if (lastTime && (currentTime - lastTime) > thirtyMinutes) {
                if (currentMessages.length > 0) {
                    sessions.push({
                        id: sessions.length + 1,
                        messages: currentMessages,
                        startTime: currentMessages[0].timestamp || lead.created_at
                    });
                }
                currentMessages = [msg];
            } else {
                currentMessages.push(msg);
            }
            lastTime = currentTime;
        });

        if (currentMessages.length > 0) {
            sessions.push({
                id: sessions.length + 1,
                messages: currentMessages,
                startTime: currentMessages[0].timestamp || lead.created_at
            });
        }

        return sessions.reverse(); // Mostrar la más reciente primero
    };

    const sessions = getSessions(lead.conversacion);

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setSelectedSession(null);
            }}
            title={selectedSession ? `Chat - Sesión ${selectedSession.id}` : `Perfil de Lead: ${lead.nombre}`}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

                {/* Cabecera del Lead */}
                {!selectedSession && (
                    <div style={{
                        padding: '20px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '20px', fontWeight: 700
                            }}>
                                {lead.nombre.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{lead.nombre}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-tertiary)' }}>{lead.email}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                            <div style={{ fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</span>
                                <span style={{ fontWeight: 500 }}>{lead.telefono}</span>
                            </div>
                            <div style={{ fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>País</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {lead.pais && <img src={`https://flagcdn.com/w40/${lead.pais.toLowerCase()}.png`} alt={lead.pais} style={{ width: '16px', height: '11px' }} />}
                                    <span style={{ fontWeight: 500 }}>{lead.pais || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Listado de Sesiones o Chat Detallado */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {selectedSession ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedSession(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'none', border: 'none', color: '#6366F1',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    padding: '0 0 12px 0'
                                }}
                            >
                                <ChevronLeft size={16} /> Volver a todas las conversaciones
                            </button>

                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px'
                            }} className="dc-scrollbar">
                                {selectedSession.messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex', gap: '8px',
                                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                            fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600
                                        }}>
                                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                            {msg.role === 'user' ? 'Visitante' : 'Drop Assistant'}
                                        </div>
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                            backgroundColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                                            color: 'var(--text-primary)',
                                            border: '1px solid ' + (msg.role === 'user' ? 'rgba(99, 102, 241, 0.2)' : 'var(--border-color)'),
                                            fontSize: '14px',
                                            lineHeight: '1.5'
                                        }}>
                                            {msg.content}
                                        </div>
                                        {msg.timestamp && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={18} style={{ color: '#6366F1' }} />
                                Historial de Sesiones ({sessions.length})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sessions.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                                        No hay conversaciones registradas.
                                    </div>
                                ) : (
                                    sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            onClick={() => setSelectedSession(session)}
                                            style={{
                                                padding: '16px',
                                                backgroundColor: 'var(--bg-primary)',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                        >
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                                                    <Clock size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Sesión #{session.id}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                        {new Date(session.startTime).toLocaleDateString()} • {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                                    {session.messages.length} msgs
                                                </span>
                                                <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </SlideOver>
    );
};
